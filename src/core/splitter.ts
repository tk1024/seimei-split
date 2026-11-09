import type {
  AnalyzeResult,
  PackedLexicon,
  ReadingData,
  SeimeiCandidate,
  SeimeiResult,
  SplitOptions,
} from "./types.js";
import {
  findSingleScriptBoundary,
  isAllHiragana,
  isAllKatakana,
  isNonJapanese,
} from "./normalize.js";
import type { ScriptBoundary } from "./normalize.js";
import { calcScore, isWrittenFormMatch, lookupMatch } from "./scorer.js";
import {
  BOUNDARY_CONFIDENCE,
  BOUNDARY_CONFIDENCE_GAP,
  CONFIDENCE_GAP,
  CONFIDENCE_THRESHOLD,
} from "./weights.js";

// Words that follow a surname but are not a given name: titles and common
// business words. This is a short list of frequent words, not a full dictionary.
const NON_NAME_MEI = new Set([
  "さん", "さま", "様", "くん", "君", "ちゃん", "殿", "氏", "先生",
  "サン", "サマ", "クン", "チャン",
  "ビル", "マンション", "アパート", "ホテル", "商店", "病院", "医院",
  "銀行", "会社", "学校", "大学", "工業", "製薬", "電器", "食堂",
  "うどん", "そば", "ラーメン", "カレー",
]);

/** What the candidate enumeration and the decision need to know about the input. */
export interface AnalysisContext {
  name: string;
  lexicon: PackedLexicon;
  isKana: boolean;
  readingData: ReadingData | undefined;
  boundary: ScriptBoundary | undefined;
  allowLowConfidence: boolean;
}

function isSingleDictionaryWord({ name, lexicon, isKana, readingData }: AnalysisContext): boolean {
  return lookupMatch(name, "sei", lexicon, isKana, readingData) !== "none"
    || lookupMatch(name, "mei", lexicon, isKana, readingData) !== "none";
}

function splitsAt(candidate: SeimeiCandidate, boundary: ScriptBoundary): boolean {
  return [...candidate.sei].length === boundary.index;
}

function unsplit(name: string, candidates: SeimeiCandidate[] = []): AnalyzeResult {
  return { best: { sei: name, mei: "" }, confidence: 0, candidates };
}

/**
 * List every split position with its score, best first.
 */
function enumerateCandidates(context: AnalysisContext): SeimeiCandidate[] {
  const { name, lexicon, isKana, readingData, boundary } = context;
  const chars = [...name];
  const maxSplit = Math.min(lexicon.maxSeiLen, chars.length - 1);
  const candidates: SeimeiCandidate[] = [];

  for (let seiLen = 1; seiLen <= maxSplit; seiLen++) {
    const meiLen = chars.length - seiLen;
    if (meiLen > lexicon.maxMeiLen) continue;

    const sei = chars.slice(0, seiLen).join("");
    const mei = chars.slice(seiLen).join("");
    const seiMatch = lookupMatch(sei, "sei", lexicon, isKana, readingData);
    const meiMatch = lookupMatch(mei, "mei", lexicon, isKana, readingData);
    const score = calcScore({
      sei,
      seiMatch,
      meiMatch,
      seiLen,
      meiLen,
      boundaryIndex: boundary?.index,
    });

    candidates.push({ sei, mei, score, seiMatch, meiMatch });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Decide whether to adopt a split from candidates sorted best first.
 */
export function decide(candidates: SeimeiCandidate[], context: AnalysisContext): AnalyzeResult {
  const { name, lexicon, readingData, boundary, allowLowConfidence } = context;
  const best = candidates[0];
  if (!best) return unsplit(name);

  // Not a full name: never split, even in low confidence mode
  if (isSingleDictionaryWord(context) || NON_NAME_MEI.has(best.mei)) {
    return unsplit(name, candidates);
  }

  const accept = (candidate: SeimeiCandidate, confidence: number): AnalyzeResult => ({
    best: { sei: candidate.sei, mei: candidate.mei },
    confidence,
    candidates,
  });

  const second = candidates[1];
  const gap = second ? best.score - second.score : Infinity;
  const meetsThreshold = best.score >= CONFIDENCE_THRESHOLD;

  // 1. Normal confidence: dictionary-based high score
  if (meetsThreshold && gap >= CONFIDENCE_GAP) {
    return accept(best, 1.0);
  }

  // 2. Boundary confidence: best candidate aligns with script boundary
  //    and has dictionary evidence on the appropriate side
  if (boundary && splitsAt(best, boundary)) {
    const evidence = boundary.direction === "kanji-to-kana" ? best.seiMatch : best.meiMatch;
    if (isWrittenFormMatch(evidence) && meetsThreshold && gap >= BOUNDARY_CONFIDENCE_GAP) {
      return accept(best, BOUNDARY_CONFIDENCE);
    }
  }

  // 3. Katakana-sei exception: real Japanese surnames are never pure katakana
  //    (e.g. ジャガー/横田), so look up the kanji part in the surname dictionary.
  if (boundary?.direction === "kana-to-kanji") {
    const candidate = candidates.find(
      (c) => splitsAt(c, boundary) && isAllKatakana(c.sei),
    );
    if (candidate && isWrittenFormMatch(lookupMatch(candidate.mei, "sei", lexicon, false, readingData))) {
      return accept(candidate, BOUNDARY_CONFIDENCE);
    }
  }

  // 4. Low confidence mode
  if (allowLowConfidence) {
    return accept(best, best.score / CONFIDENCE_THRESHOLD);
  }

  return unsplit(name, candidates);
}

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

  if (!trimmed) return unsplit(trimmed);

  // Space-delimited: split directly
  const parts = trimmed.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    return { best: { sei: parts[0], mei: parts.slice(1).join(" ") }, confidence: 1.0, candidates: [] };
  }

  const lexicon = options?.lexicon ?? defaultLexicon;
  if (isNonJapanese(trimmed) || !lexicon) return unsplit(trimmed);

  const context: AnalysisContext = {
    name: trimmed,
    lexicon,
    isKana: isAllHiragana(trimmed) || isAllKatakana(trimmed),
    readingData: options?.readingData ?? defaultReading,
    boundary: findSingleScriptBoundary(trimmed),
    allowLowConfidence: options?.allowLowConfidence ?? false,
  };
  return decide(enumerateCandidates(context), context);
}
