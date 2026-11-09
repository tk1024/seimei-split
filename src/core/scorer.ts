import type { MatchType, NameKind, PackedLexicon, ReadingData } from "./types.js";
import { foldVariants, hiraganaToKatakana, scriptOf } from "./normalize.js";

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

// Surname hit is stronger evidence than given name hit,
// because surnames are a finite known set while given names are creative
const SEI_HIT_BONUS = 0.5;

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
  const suffix = /^K+([HT]+)$/.exec(p)?.[1];
  if (!suffix) return 0;

  if (suffix.length === 1) {
    return suffix[0] === "T"
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
  kind: NameKind,
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
  if (dict.has(folded) || lexicon.folded[folded]?.some((surface) => dict.has(surface))) {
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

  // Surname hit bonus: surnames are a known finite set,
  // so a dictionary hit on sei is stronger evidence than on mei
  if (seiMatch === "surface" || seiMatch === "folded") {
    score += SEI_HIT_BONUS;
  }

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
