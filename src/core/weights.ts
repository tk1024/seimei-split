import type { MatchType } from "./types.js";

// Score weights: dictionary evidence is primary, length is secondary
export const MATCH_SCORE: Record<MatchType, number> = {
  surface: 4.0,
  folded: 2.5,
  reading: 1.0,
  none: 0,
};

export const SEI_LENGTH_SCORE: Record<number, number> = {
  1: 0.1,
  2: 0.5,
  3: 0.3,
  4: 0.0,
  5: -0.2,
  6: -0.4,
};

export const MEI_LENGTH_SCORE: Record<number, number> = {
  1: 0.3,
  2: 0.5,
  3: 0.2,
  4: 0.0,
  5: -0.2,
  6: -0.4,
};

export const PAIR_BONUS = 0.8;
export const BOTH_SINGLE_CHAR_PENALTY = -1.0;

// Surname hit is stronger evidence than given name hit,
// because surnames are a finite known set while given names are creative
export const SEI_HIT_BONUS = 0.5;

// Script boundary scoring
export const BOUNDARY_MATCH_BONUS = 1.2;
export const BOUNDARY_MATCH_WITH_DICT_BONUS = 0.8;
export const BOUNDARY_BEFORE_PENALTY = -3.0;
export const BOUNDARY_AFTER_PENALTY = -1.8;

// Sei mixed-script penalty: OOV surname containing kana is unnatural
export const SEI_MIXED_SINGLE_HIRA_PENALTY = -2.5;
export const SEI_MIXED_SINGLE_KATA_PENALTY = -3.0;
export const SEI_MIXED_MULTI_KANA_PENALTY = -1.5;

// Acceptance thresholds
export const CONFIDENCE_THRESHOLD = 6.0;
export const CONFIDENCE_GAP = 1.0;

// Boundary confidence: when the best candidate aligns with a script boundary
// and has dictionary evidence, grant confidence 0.8
export const BOUNDARY_CONFIDENCE = 0.8;
export const BOUNDARY_CONFIDENCE_GAP = 0.5;
