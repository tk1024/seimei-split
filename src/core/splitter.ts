import type {
  AnalyzeResult,
  PackedLexicon,
  ReadingData,
  SeimeiCandidate,
  SeimeiResult,
  SplitOptions,
} from "./types.js";
import { isAllHiragana, isAllKatakana, isNonJapanese } from "./normalize.js";
import { calcScore, lookupMatch } from "./scorer.js";

const CONFIDENCE_THRESHOLD = 6.0;
const CONFIDENCE_GAP = 1.0;

let defaultLexicon: PackedLexicon | undefined;
let defaultReading: ReadingData | undefined;

/**
 * Set the default lexicon for all split/analyze calls.
 */
export function setLexicon(lexicon: PackedLexicon): void {
  defaultLexicon = lexicon;
}

/**
 * Set the reading data for kana-based name splitting.
 * This is optional — without it, kana input will not be matched by reading.
 */
export function setReading(reading: ReadingData): void {
  defaultReading = reading;
}

/**
 * Get the currently loaded lexicon.
 */
export function getLexicon(): PackedLexicon | undefined {
  return defaultLexicon;
}

/**
 * Split a Japanese full name into sei (family name) and mei (given name).
 */
export function split(fullName: string, options?: SplitOptions): SeimeiResult {
  const result = analyze(fullName, options);
  return result.best;
}

/**
 * Analyze a Japanese full name, returning candidates with confidence scores.
 */
export function analyze(fullName: string, options?: SplitOptions): AnalyzeResult {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { best: { sei: "", mei: "" }, confidence: 0, candidates: [] };
  }

  // Space-delimited: split directly
  const parts = trimmed.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    const best = { sei: parts[0], mei: parts.slice(1).join(" ") };
    return { best, confidence: 1.0, candidates: [] };
  }

  // Non-Japanese characters: return unsplit
  if (isNonJapanese(trimmed)) {
    return {
      best: { sei: trimmed, mei: "" },
      confidence: 0,
      candidates: [],
    };
  }

  const lexicon = options?.lexicon ?? defaultLexicon;
  if (!lexicon) {
    // No lexicon loaded: return unsplit
    return {
      best: { sei: trimmed, mei: "" },
      confidence: 0,
      candidates: [],
    };
  }

  const chars = [...trimmed];
  const n = chars.length;

  if (n < 2) {
    return {
      best: { sei: trimmed, mei: "" },
      confidence: 0,
      candidates: [],
    };
  }

  const isKana = isAllHiragana(trimmed) || isAllKatakana(trimmed);
  const maxSplit = Math.min(lexicon.maxSeiLen, n - 1);
  const candidates: SeimeiCandidate[] = [];

  for (let i = 1; i <= maxSplit; i++) {
    const sei = chars.slice(0, i).join("");
    const mei = chars.slice(i).join("");
    const seiLen = i;
    const meiLen = n - i;

    if (meiLen > lexicon.maxMeiLen) continue;

    const readingData = options?.readingData ?? defaultReading;
    const seiMatch = lookupMatch(sei, "sei", lexicon, isKana, readingData);
    const meiMatch = lookupMatch(mei, "mei", lexicon, isKana, readingData);
    const score = calcScore(seiMatch, meiMatch, seiLen, meiLen);

    candidates.push({ sei, mei, score, seiMatch, meiMatch });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      best: { sei: trimmed, mei: "" },
      confidence: 0,
      candidates: [],
    };
  }

  const best = candidates[0];
  const second = candidates[1];
  const gap = second ? best.score - second.score : Infinity;
  const confident =
    best.score >= CONFIDENCE_THRESHOLD && gap >= CONFIDENCE_GAP;

  if (confident || options?.allowLowConfidence) {
    return {
      best: { sei: best.sei, mei: best.mei },
      confidence: confident ? 1.0 : best.score / CONFIDENCE_THRESHOLD,
      candidates,
    };
  }

  // Not confident enough: return unsplit
  return {
    best: { sei: trimmed, mei: "" },
    confidence: 0,
    candidates,
  };
}
