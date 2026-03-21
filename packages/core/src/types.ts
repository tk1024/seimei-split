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

export type PackedEntry = readonly [
  flags: number,
  reading: string,
  normalized: string,
];

export interface PackedLexicon {
  sei: Record<string, PackedEntry>;
  mei: Record<string, PackedEntry>;
  reading: {
    sei: Record<string, number>;
    mei: Record<string, number>;
  };
  folded: Record<string, string[]>;
  maxSeiLen: number;
  maxMeiLen: number;
}

export interface SplitOptions {
  /** Allow low-confidence results instead of returning unsplit */
  allowLowConfidence?: boolean;
  /** Custom lexicon to use */
  lexicon?: PackedLexicon;
}
