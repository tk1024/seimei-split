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

/** Why `analyze` split the name or left it unsplit. */
export type AnalyzeReason =
  /** Split at the whitespace in the input */
  | "space"
  /** Dictionary evidence is strong enough */
  | "dictionary"
  /** The surname is in the dictionary and the given name is shaped like one */
  | "sei-match"
  /** One side matched as written and the other only by reading (needs reading data) */
  | "reading"
  /** The best split matches a script boundary and has dictionary evidence */
  | "boundary"
  /** Katakana stage name followed by a known surname */
  | "katakana-sei"
  /** Best guess from `allowLowConfidence` */
  | "low-confidence"
  /** A single dictionary word, or a name followed by a title or business word */
  | "not-full-name"
  /** The best candidate does not have enough evidence */
  | "insufficient"
  /** No split position to consider: empty, single-character, non-Japanese, or too long for the dictionary */
  | "no-candidate"
  /** No dictionary is set: call `setLexicon` or pass `lexicon` */
  | "no-dictionary";

export interface AnalyzeResult {
  best: SeimeiResult;
  /**
   * Always between 0 and 1.
   * - 1: split at whitespace or by strong dictionary evidence
   * - 0.8: split by a script boundary or the katakana surname rule
   * - 0.75: surname in the dictionary, given name not in it but shaped like one
   * - 0.7: one side matched as written, the other only by reading
   * - above 0 and at most 0.7: best guess from `allowLowConfidence`
   * - 0: not split
   */
  confidence: number;
  reason: AnalyzeReason;
  /** Best score first. With `katakana-sei`, `best` may not be the first candidate. */
  candidates: SeimeiCandidate[];
}

export type MatchType = "surface" | "folded" | "reading" | "none";

export type NameKind = "sei" | "mei";

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
