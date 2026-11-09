import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { foldVariants } from "../../src/core/normalize";
import { lexicon } from "../../src/data/bundled";
import { reading } from "../../src/reading";

describe("生成した辞書の folded", () => {
  const entries = Object.entries(lexicon.folded);

  it("キーが foldVariants の不動点である", () => {
    expect(entries.filter(([key]) => foldVariants(key) !== key)).toEqual([]);
  });

  it("元の表記はキーと異なり、畳み込むとキーになる", () => {
    const invalid = entries.filter(([key, surfaces]) =>
      surfaces.some((surface) => surface === key || foldVariants(surface) !== key),
    );
    expect(invalid).toEqual([]);
  });

  it("異体字を含む表記がすべて登録されている", () => {
    const missing = [...lexicon.sei, ...lexicon.mei].filter((surface) => {
      const key = foldVariants(surface);
      return key !== surface && !lexicon.folded[key]?.includes(surface);
    });
    expect(missing).toEqual([]);
  });
});

describe("生成した読みデータ", () => {
  const extractedPath = resolve(__dirname, "../../internal/.cache/unidic.tsv");

  it.skipIf(!existsSync(extractedPath))("読みの種類数が抽出結果と一致する", () => {
    const rows = readFileSync(extractedPath, "utf-8")
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => {
        const [kind, , reading] = line.split("\t");
        return { kind, reading };
      });
    const distinct = (kind: string) =>
      new Set(rows.filter((row) => row.kind === kind && row.reading).map((row) => row.reading)).size;

    expect(Object.keys(reading.sei)).toHaveLength(distinct("sei"));
    expect(Object.keys(reading.mei)).toHaveLength(distinct("mei"));
  });
});
