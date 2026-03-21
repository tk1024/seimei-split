import type { MatchType, PackedLexicon } from "./types.js";
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

/**
 * Look up a candidate string in the lexicon.
 * Returns the match type: surface > folded > reading > none.
 */
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

/**
 * Look up a candidate string in the lexicon.
 * Returns the match type: surface > folded > reading > none.
 */
export function lookupMatch(
  candidate: string,
  kind: "sei" | "mei",
  lexicon: PackedLexicon,
  isKana: boolean,
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

  // Reading match (for kana input)
  if (isKana) {
    const readingDict = kind === "sei" ? lexicon.reading.sei : lexicon.reading.mei;
    const kataReading = hiraganaToKatakana(candidate);
    if (kataReading in readingDict) {
      return "reading";
    }
  }

  return "none";
}

/**
 * Calculate the score for a split candidate.
 */
export function calcScore(
  seiMatch: MatchType,
  meiMatch: MatchType,
  seiLen: number,
  meiLen: number,
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

  return score;
}
