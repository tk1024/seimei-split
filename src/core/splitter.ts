import type {
  AnalyzeReason,
  AnalyzeResult,
  PackedLexicon,
  ReadingData,
  SeimeiCandidate,
  SeimeiResult,
  SplitOptions,
} from "./types.js";
import {
  findSingleScriptBoundary,
  foldVariants,
  isAllHiragana,
  isAllKatakana,
  isNonJapanese,
} from "./normalize.js";
import type { ScriptBoundary } from "./normalize.js";
import { hasNameLikeEnds } from "./charStats.js";
import { calcScore, isWrittenFormMatch, lookupMatch } from "./scorer.js";
import {
  BOUNDARY_CONFIDENCE,
  BOUNDARY_CONFIDENCE_GAP,
  CONFIDENCE_GAP,
  CONFIDENCE_THRESHOLD,
  LOW_CONFIDENCE_MAX,
  LOW_CONFIDENCE_MIN,
  READING_CONFIDENCE,
  SEI_MATCH_CONFIDENCE,
  SEI_MATCH_GAP,
  SEI_MATCH_MIN_SCORE,
} from "./weights.js";

// Words that follow a surname but are not a given name: titles and common
// business words. These are short lists of frequent words, not full dictionaries.
const TITLES = new Set([
  "さん", "さま", "様", "くん", "君", "ちゃん", "殿", "氏", "先生",
  "サン", "サマ", "クン", "チャン",
]);

const BUSINESS_WORDS = new Set([
  "ビル", "マンション", "アパート", "ホテル", "商店", "病院", "医院",
  "銀行", "会社", "学校", "大学", "工業", "製薬", "電器", "食堂",
  "精機", "興業", "通運", "光学", "法人", "物産", "産業", "商事", "建設", "不動産",
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

// Job titles after a surname. Checked only when the given name is not in the
// dictionary, because some of these are real given names (博士, for example).
const ROLE_WORDS = [
  "社長", "会長", "部長", "課長", "係長", "店長", "院長", "校長", "園長",
  "市長", "町長", "村長", "知事", "総理", "大臣", "議員",
  "選手", "監督", "教授", "博士", "医師", "弁護士", "税理士", "先輩",
  "主任", "学長", "総長", "代議士", "親方", "和尚", "夫人",
];
const NON_NAME_ENDINGS = [...TITLES, ...ROLE_WORDS];

function isSingleDictionaryWord({ name, lexicon, isKana, readingData }: AnalysisContext): boolean {
  return lookupMatch(name, "sei", lexicon, isKana, readingData) !== "none"
    || lookupMatch(name, "mei", lexicon, isKana, readingData) !== "none";
}

function splitsAt(candidate: SeimeiCandidate, boundary: ScriptBoundary): boolean {
  return [...candidate.sei].length === boundary.index;
}

function unsplit(
  name: string,
  reason: AnalyzeReason,
  candidates: SeimeiCandidate[] = [],
): AnalyzeResult {
  return { best: { sei: name, mei: "" }, confidence: 0, reason, candidates };
}

function lowConfidence(score: number): number {
  const scaled = (score / CONFIDENCE_THRESHOLD) * LOW_CONFIDENCE_MAX;
  return Math.min(Math.max(scaled, LOW_CONFIDENCE_MIN), LOW_CONFIDENCE_MAX);
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
      mei,
      seiMatch,
      meiMatch,
      seiLen,
      meiLen,
      boundaryIndex: boundary?.index,
      lexicon,
    });

    candidates.push({ sei, mei, score, seiMatch, meiMatch });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Decide whether to adopt a split from candidates sorted best first.
 */
export function decide(candidates: SeimeiCandidate[], context: AnalysisContext): AnalyzeResult {
  const { name, lexicon, isKana, readingData, boundary, allowLowConfidence } = context;
  const best = candidates[0];
  if (!best) return unsplit(name, "no-candidate");

  // Not a full name: never split, even in low confidence mode
  // Titles are checked on the best split only: 尊氏 ends with 氏 but is a given name.
  // Business words are checked on every split, since statistics can reorder them.
  if (
    isSingleDictionaryWord(context)
    || TITLES.has(foldVariants(best.mei))
    || candidates.some((c) => BUSINESS_WORDS.has(foldVariants(c.mei)))
  ) {
    return unsplit(name, "not-full-name", candidates);
  }

  // A forbidden split (score -Infinity) is never adopted, even in low confidence mode
  const adoptable = candidates.filter((c) => Number.isFinite(c.score));
  if (adoptable.length === 0) return unsplit(name, "insufficient", candidates);

  const accept = (
    candidate: SeimeiCandidate,
    confidence: number,
    reason: AnalyzeReason,
  ): AnalyzeResult => ({
    best: { sei: candidate.sei, mei: candidate.mei },
    confidence,
    reason,
    candidates,
  });

  const second = candidates[1];
  const gap = second ? best.score - second.score : Infinity;
  const meetsThreshold = best.score >= CONFIDENCE_THRESHOLD;

  // 1. Normal confidence: both sides written in the dictionary, or a script boundary
  //    (the character statistics alone must not reach this tier)
  const hasStrongEvidence = boundary !== undefined
    || (isWrittenFormMatch(best.seiMatch) && isWrittenFormMatch(best.meiMatch));
  if (meetsThreshold && gap >= CONFIDENCE_GAP) {
    if (hasStrongEvidence) return accept(best, 1.0, "dictionary");

    // 2. Reading confidence: one side matched only by reading
    //    (two readings score too low to reach the threshold)
    if (best.seiMatch !== "none" && best.meiMatch !== "none") {
      return accept(best, READING_CONFIDENCE, "reading");
    }
  }

  // 3. Boundary confidence: best candidate aligns with script boundary
  //    and has dictionary evidence on the appropriate side
  if (boundary && splitsAt(best, boundary)) {
    const evidence = boundary.direction === "kanji-to-kana" ? best.seiMatch : best.meiMatch;
    if (isWrittenFormMatch(evidence) && meetsThreshold && gap >= BOUNDARY_CONFIDENCE_GAP) {
      return accept(best, BOUNDARY_CONFIDENCE, "boundary");
    }
  }

  // 4. Katakana-sei exception: real Japanese surnames are never pure katakana
  //    (e.g. ジャガー/横田), so look up the kanji part in the surname dictionary.
  if (boundary?.direction === "kana-to-kanji") {
    const candidate = adoptable.find((c) => splitsAt(c, boundary) && isAllKatakana(c.sei));
    if (candidate && isWrittenFormMatch(lookupMatch(candidate.mei, "sei", lexicon, false, readingData))) {
      return accept(candidate, BOUNDARY_CONFIDENCE, "katakana-sei");
    }
  }

  // 5. Surname match: the given name is unknown but shaped like one
  if (
    boundary === undefined
    && !isKana
    && isWrittenFormMatch(best.seiMatch)
    && best.meiMatch === "none"
    && best.score >= SEI_MATCH_MIN_SCORE
    && gap >= SEI_MATCH_GAP
    && !NON_NAME_ENDINGS.some((word) => foldVariants(best.mei).endsWith(word))
    && hasNameLikeEnds(best.mei, lexicon)
  ) {
    return accept(best, SEI_MATCH_CONFIDENCE, "sei-match");
  }

  // 6. Low confidence mode
  if (allowLowConfidence) {
    return accept(best, lowConfidence(best.score), "low-confidence");
  }

  return unsplit(name, "insufficient", candidates);
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

  if (!trimmed) return unsplit(trimmed, "no-candidate");

  // Space-delimited: split directly
  const parts = trimmed.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    return {
      best: { sei: parts[0], mei: parts.slice(1).join(" ") },
      confidence: 1.0,
      reason: "space",
      candidates: [],
    };
  }

  const lexicon = options?.lexicon ?? defaultLexicon;
  if (!lexicon) return unsplit(trimmed, "no-dictionary");
  if (isNonJapanese(trimmed)) return unsplit(trimmed, "no-candidate");

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
