// Core API without bundled dictionary
// Use setLexicon() to load your own dictionary data
export { split, analyze, setLexicon, setReading, getLexicon } from "./core/splitter.js";
export type {
  SeimeiResult,
  SeimeiCandidate,
  AnalyzeResult,
  SplitOptions,
  PackedLexicon,
  ReadingData,
  MatchType,
} from "./core/types.js";
