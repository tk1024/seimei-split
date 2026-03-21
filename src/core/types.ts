export interface SeimeiResult {
  sei: string;
  mei: string;
}

export interface SeimeiCandidate {
  sei: string;
  mei: string;
  score: number;
  seiMatch: MatchType;
  meiMatch: MatchType;
}

export interface AnalyzeResult {
  best: SeimeiResult;
  confidence: number;
  candidates: SeimeiCandidate[];
}

export type MatchType = "surface" | "folded" | "reading" | "none";

export interface PackedLexicon {
  sei: string[];
  mei: string[];
  folded: Record<string, string[]>;
  maxSeiLen: number;
  maxMeiLen: number;
}

export interface ReadingData {
  sei: Record<string, number>;
  mei: Record<string, number>;
}

export interface SplitOptions {
  /** Allow low-confidence results instead of returning unsplit */
  allowLowConfidence?: boolean;
  /** Custom lexicon to use */
  lexicon?: PackedLexicon;
  /** Reading data for kana-based matching */
  readingData?: ReadingData;
}
