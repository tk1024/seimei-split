export type NameKind = "sei" | "mei";

export interface ExtractedEntry {
  kind: NameKind;
  surface: string;
  reading: string;
  normalized: string;
  source: "unidic";
  sourceId: string;
  sourceFlags: number;
}

// Source flag bitmask
export const SOURCE_FLAGS = {
  UNIDIC: 1,
  MANUAL: 8,
} as const;

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
