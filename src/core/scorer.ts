import type { MatchType, PackedLexicon, ReadingData } from "./types.js";
import { foldVariants, hiraganaToKatakana } from "./normalize.js";

// Score weights — dictionary evidence is primary, length is secondary
const MATCH_SCORE: Record<MatchType, number> = {
  surface: 4.0,
  folded: 2.5,
  reading: 1.0,
  none: 0,
};

const SEI_LENGTH_SCORE: Record<number, number> = {
  1: 0.1,
  2: 0.5,
  3: 0.3,
  4: 0.0,
  5: -0.2,
  6: -0.4,
};

const MEI_LENGTH_SCORE: Record<number, number> = {
  1: 0.3,
  2: 0.5,
  3: 0.2,
  4: 0.0,
  5: -0.2,
  6: -0.4,
};

const PAIR_BONUS = 0.8;
const BOTH_SINGLE_CHAR_PENALTY = -1.0;

// Script boundary scoring
const BOUNDARY_MATCH_BONUS = 1.2;
const BOUNDARY_MATCH_WITH_DICT_BONUS = 0.8;
const BOUNDARY_BEFORE_PENALTY = -3.0;
const BOUNDARY_AFTER_PENALTY = -1.8;

// Sei mixed-script penalty: OOV surname containing kana is unnatural
const SEI_MIXED_SINGLE_HIRA_PENALTY = -2.5;
const SEI_MIXED_SINGLE_KATA_PENALTY = -3.0;
const SEI_MIXED_MULTI_KANA_PENALTY = -1.5;

// Cache for Set-based lookups built from string[]
const setCache = new WeakMap<PackedLexicon, { sei: Set<string>; mei: Set<string> }>();

function getSets(lexicon: PackedLexicon): { sei: Set<string>; mei: Set<string> } {
  let cached = setCache.get(lexicon);
  if (!cached) {
    cached = {
      sei: new Set(lexicon.sei),
      mei: new Set(lexicon.mei),
    };
    setCache.set(lexicon, cached);
  }
  return cached;
}

const RE_KANJI = /[\p{Script=Han}々〆ヶ]/u;
const RE_HIRAGANA = /[\u3041-\u3096]/;
const RE_KATAKANA = /[\u30A1-\u30F6\u30FC]/;

function scriptOf(ch: string): "K" | "H" | "T" | "O" {
  if (RE_KANJI.test(ch)) return "K";
  if (RE_HIRAGANA.test(ch)) return "H";
  if (RE_KATAKANA.test(ch)) return "T";
  return "O";
}

function scriptPattern(s: string): string {
  return [...s].map(scriptOf).join("");
}

/**
 * Penalty for OOV surnames that contain kana (e.g. 宝鐘マ, 星街すい).
 * Real Japanese surnames are almost always pure kanji.
 * Only applied when the surname has no dictionary hit.
 */
function seiMixedScriptPenalty(sei: string, seiMatch: MatchType): number {
  if (seiMatch !== "none") return 0;

  const p = scriptPattern(sei);
  if (!/^K+[HT]+$/.test(p)) return 0;

  const suffix = p.match(/[HT]+$/)![0];
  if (suffix.length === 1) {
    return suffix[0] === "T"
      ? SEI_MIXED_SINGLE_KATA_PENALTY
      : SEI_MIXED_SINGLE_HIRA_PENALTY;
  }
  return SEI_MIXED_MULTI_KANA_PENALTY;
}

/**
 * Penalty for OOV given names that start with kana followed by kanji (e.g. モン閣下, イク眞木).
 * When a kana→kanji boundary exists, the mei side should be pure kanji.
 * Only applied when the given name has no dictionary hit.
 */
function meiMixedScriptPenalty(mei: string, meiMatch: MatchType): number {
  if (meiMatch !== "none") return 0;

  const p = scriptPattern(mei);
  if (!/^[HT]+K+$/.test(p)) return 0;

  const prefix = p.match(/^[HT]+/)![0];
  if (prefix.length === 1) {
    return prefix[0] === "T"
      ? SEI_MIXED_SINGLE_KATA_PENALTY
      : SEI_MIXED_SINGLE_HIRA_PENALTY;
  }
  return SEI_MIXED_MULTI_KANA_PENALTY;
}

/**
 * Look up a candidate string in the lexicon.
 * Returns the match type: surface > folded > reading > none.
 */
export function lookupMatch(
  candidate: string,
  kind: "sei" | "mei",
  lexicon: PackedLexicon,
  isKana: boolean,
  readingData?: ReadingData,
): MatchType {
  const sets = getSets(lexicon);
  const dict = kind === "sei" ? sets.sei : sets.mei;

  // Direct surface match
  if (dict.has(candidate)) {
    return "surface";
  }

  // Folded (variant kanji) match
  const folded = foldVariants(candidate);
  if (folded !== candidate && dict.has(folded)) {
    return "folded";
  }
  if (folded in lexicon.folded) {
    return "folded";
  }

  // Reading match (for kana input, only if reading data is loaded)
  if (isKana && readingData) {
    const readingDict = kind === "sei" ? readingData.sei : readingData.mei;
    const kataReading = hiraganaToKatakana(candidate);
    if (kataReading in readingDict) {
      return "reading";
    }
  }

  return "none";
}

/**
 * Calculate the score for a split candidate.
 *
 * @param sei - the surname candidate string
 * @param splitIndex - the character index where this candidate splits (i.e. sei length)
 * @param boundaryIndex - the unique kanji→kana boundary position, or undefined if none
 */
export function calcScore(
  sei: string,
  mei: string,
  seiMatch: MatchType,
  meiMatch: MatchType,
  seiLen: number,
  meiLen: number,
  splitIndex: number,
  boundaryIndex: number | undefined,
): number {
  let score = 0;

  // Match scores (primary signal)
  score += MATCH_SCORE[seiMatch];
  score += MATCH_SCORE[meiMatch];

  // Length scores (secondary signal)
  score += SEI_LENGTH_SCORE[Math.min(seiLen, 6)] ?? -0.5;
  score += MEI_LENGTH_SCORE[Math.min(meiLen, 6)] ?? -0.5;

  // Pair bonus: both sides hit
  const seiHit = seiMatch !== "none";
  const meiHit = meiMatch !== "none";

  if (seiHit && meiHit) {
    score += PAIR_BONUS;
  }

  // Both single char penalty (conditional: only if not both exact)
  if (seiLen === 1 && meiLen === 1) {
    if (!(seiMatch === "surface" && meiMatch === "surface")) {
      score += BOTH_SINGLE_CHAR_PENALTY;
    }
  }

  // Single char sei without dict hit is not allowed
  if (seiLen === 1 && !seiHit) {
    score = -Infinity;
  }

  // Script boundary scoring
  if (boundaryIndex !== undefined) {
    if (splitIndex === boundaryIndex) {
      score += BOUNDARY_MATCH_BONUS;
      if (seiMatch === "surface" || seiMatch === "folded") {
        score += BOUNDARY_MATCH_WITH_DICT_BONUS;
      }
    } else if (splitIndex < boundaryIndex) {
      score += BOUNDARY_BEFORE_PENALTY;
    } else {
      score += BOUNDARY_AFTER_PENALTY;
    }
  }

  // OOV surname mixed-script penalty (mei side is not penalized —
  // names like よね子, ルミ子, 美つ子 naturally mix scripts)
  score += seiMixedScriptPenalty(sei, seiMatch);

  return score;
}
