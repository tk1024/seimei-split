import type { MatchType, NameKind, PackedLexicon, ReadingData } from "./types.js";
import { foldVariants, hiraganaToKatakana, scriptOf } from "./normalize.js";
import { positionLogRatio } from "./charStats.js";
import {
  BOTH_SINGLE_CHAR_PENALTY,
  BOUNDARY_AFTER_PENALTY,
  BOUNDARY_BEFORE_PENALTY,
  BOUNDARY_MATCH_BONUS,
  BOUNDARY_MATCH_WITH_DICT_BONUS,
  MATCH_SCORE,
  MEI_LENGTH_SCORE,
  lengthBucket,
  ONE_SIDED_SINGLE_CHAR_PENALTY,
  PAIR_BONUS,
  POSITION_WEIGHT,
  SEI_HIT_BONUS,
  SEI_LENGTH_SCORE,
  SEI_MIXED_MULTI_KANA_PENALTY,
  SEI_MIXED_SINGLE_HIRA_PENALTY,
  SEI_MIXED_SINGLE_KATA_PENALTY,
} from "./weights.js";

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

/** True for a match on the written form: surface or folded, not reading. */
export function isWrittenFormMatch(match: MatchType): boolean {
  return match === "surface" || match === "folded";
}

interface ScoreInput {
  sei: string;
  mei: string;
  seiMatch: MatchType;
  meiMatch: MatchType;
  seiLen: number;
  meiLen: number;
  /** The unique script boundary position, or undefined if none. */
  boundaryIndex: number | undefined;
  lexicon: PackedLexicon;
}

/**
 * Calculate the score for a split candidate.
 */
export function calcScore({
  sei,
  mei,
  seiMatch,
  meiMatch,
  seiLen,
  meiLen,
  boundaryIndex,
  lexicon,
}: ScoreInput): number {
  let score = 0;

  // Match scores (primary signal)
  score += MATCH_SCORE[seiMatch];
  score += MATCH_SCORE[meiMatch];

  // Surname hit bonus: surnames are a known finite set,
  // so a dictionary hit on sei is stronger evidence than on mei
  if (isWrittenFormMatch(seiMatch)) {
    score += SEI_HIT_BONUS;
  }

  // Length scores (secondary signal)
  score += SEI_LENGTH_SCORE[lengthBucket(seiLen)];
  score += MEI_LENGTH_SCORE[lengthBucket(meiLen)];

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
  if (seiLen === 1 && !seiHit) return -Infinity;

  // Names with a script boundary already have a stronger signal,
  // so these two adjustments apply only without one.
  if (boundaryIndex === undefined) {
    if ((seiLen === 1 && seiHit && !meiHit) || (meiLen === 1 && meiHit && !seiHit)) {
      score += ONE_SIDED_SINGLE_CHAR_PENALTY;
    }

    // Character statistics adjust the side not in the dictionary
    if (!seiHit) score += POSITION_WEIGHT * positionLogRatio(sei, "sei", lexicon);
    if (!meiHit) score += POSITION_WEIGHT * positionLogRatio(mei, "mei", lexicon);
  } else {
    if (seiLen === boundaryIndex) {
      score += BOUNDARY_MATCH_BONUS;
      if (isWrittenFormMatch(seiMatch)) {
        score += BOUNDARY_MATCH_WITH_DICT_BONUS;
      }
    } else if (seiLen < boundaryIndex) {
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
