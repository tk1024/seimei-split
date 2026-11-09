import { foldVariants, scriptOf } from "./normalize.js";
import type { NameKind, PackedLexicon } from "./types.js";
import {
  POSITION_LOG_RATIO_LIMIT,
  POSITION_SMOOTHING,
  SEI_MATCH_MAX_MEI_LEN,
  SEI_MATCH_MIN_CHAR_COUNT,
  SEI_MATCH_MIN_LOG_RATIO,
} from "./weights.js";

interface PositionCounts {
  first: Map<string, number>;
  last: Map<string, number>;
  total: number;
}

type CharStats = Record<NameKind, PositionCounts>;

function increment(counts: Map<string, number>, char: string): void {
  counts.set(char, (counts.get(char) ?? 0) + 1);
}

function countPositions(words: string[]): PositionCounts {
  const first = new Map<string, number>();
  const last = new Map<string, number>();
  for (const word of words) {
    const chars = [...word];
    increment(first, foldVariants(chars[0]));
    increment(last, foldVariants(chars[chars.length - 1]));
  }
  return { first, last, total: Math.max(words.length, 1) };
}

// Built on first use from the lexicon, so it adds nothing to the bundle
const statsCache = new WeakMap<PackedLexicon, CharStats>();

function getStats(lexicon: PackedLexicon): CharStats {
  let stats = statsCache.get(lexicon);
  if (!stats) {
    stats = { sei: countPositions(lexicon.sei), mei: countPositions(lexicon.mei) };
    statsCache.set(lexicon, stats);
  }
  return stats;
}

/** Positive when the character is more common in given names than in surnames. */
function meiLogRatio(char: string, position: "first" | "last", stats: CharStats): number {
  const rate = (counts: PositionCounts) =>
    (counts[position].get(foldVariants(char)) ?? 0) / counts.total + POSITION_SMOOTHING;
  const ratio = Math.log(rate(stats.mei) / rate(stats.sei));
  return Math.max(-POSITION_LOG_RATIO_LIMIT, Math.min(POSITION_LOG_RATIO_LIMIT, ratio));
}

/**
 * How much more a kanji word's first and last characters look like `kind`
 * than the other kind. Positive means more like `kind`; kana words score 0.
 */
export function positionLogRatio(word: string, kind: NameKind, lexicon: PackedLexicon): number {
  const chars = [...word];
  if (!chars.every((ch) => scriptOf(ch) === "K")) return 0;

  const stats = getStats(lexicon);
  const first = meiLogRatio(chars[0], "first", stats);
  const ratio = chars.length === 1
    ? first
    : first + meiLogRatio(chars[chars.length - 1], "last", stats);
  return kind === "mei" ? ratio : -ratio;
}

/**
 * True when a word looks like a given name: two or three kanji or kana characters
 * whose first and last characters are common in given names and, taken together,
 * more typical of given names than of surnames.
 */
export function hasNameLikeEnds(mei: string, lexicon: PackedLexicon): boolean {
  const chars = [...mei];
  if (chars.length < 2 || chars.length > SEI_MATCH_MAX_MEI_LEN) return false;
  if (chars.some((ch) => scriptOf(ch) === "O")) return false;


  const stats = getStats(lexicon);
  const head = chars[0];
  const tail = chars[chars.length - 1];
  if (
    (stats.mei.first.get(foldVariants(head)) ?? 0) < SEI_MATCH_MIN_CHAR_COUNT
    || (stats.mei.last.get(foldVariants(tail)) ?? 0) < SEI_MATCH_MIN_CHAR_COUNT
  ) {
    return false;
  }

  const kanjiRatio = (ch: string, position: "first" | "last") =>
    scriptOf(ch) === "K" ? meiLogRatio(ch, position, stats) : 0;
  return kanjiRatio(head, "first") + kanjiRatio(tail, "last") >= SEI_MATCH_MIN_LOG_RATIO;
}
