import type { NameKind } from "../../../src/core/types.js";

export interface ExtractedEntry {
  kind: NameKind;
  surface: string;
  reading: string;
  source: "unidic";
  sourceId: string;
  sourceFlags: number;
}

// Source flag bitmask
export const SOURCE_FLAGS = {
  UNIDIC: 1,
} as const;
