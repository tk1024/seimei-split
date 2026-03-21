// Core API without bundled dictionary
// Use setLexicon() to load your own dictionary data
export { split, analyze, setLexicon, getLexicon } from "./core/splitter.js";
export type {
  SeimeiResult,
  SeimeiCandidate,
  AnalyzeResult,
  SplitOptions,
  PackedLexicon,
  MatchType,
} from "./core/types.js";
