import { describe, it, expect } from "vitest";
import { foldVariants } from "../../src/core/normalize";
import { lexicon } from "../../src/data/bundled";

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
