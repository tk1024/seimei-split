// Default API with bundled UniDic dictionary
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

import { setLexicon } from "./core/splitter.js";
import { lexicon } from "./data/bundled.js";

// Auto-load bundled dictionary
setLexicon(lexicon);
