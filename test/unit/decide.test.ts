import { describe, it, expect } from "vitest";
import { decide } from "../../src/core/splitter";
import type { AnalysisContext } from "../../src/core/splitter";
import type { MatchType, PackedLexicon, SeimeiCandidate } from "../../src/core/types";

const lexicon: PackedLexicon = {
  sei: ["田中", "横田"],
  mei: ["太郎"],
  folded: {},
  maxSeiLen: 4,
  maxMeiLen: 4,
};

function context(name: string, overrides: Partial<AnalysisContext> = {}): AnalysisContext {
  return {
    name,
    lexicon,
    isKana: false,
    readingData: undefined,
    boundary: undefined,
    allowLowConfidence: false,
    ...overrides,
  };
}

function candidate(
  sei: string,
  mei: string,
  score: number,
  seiMatch: MatchType = "surface",
  meiMatch: MatchType = "surface",
): SeimeiCandidate {
  return { sei, mei, score, seiMatch, meiMatch };
}

describe("decide", () => {
  it("候補がなければ未分割", () => {
    expect(decide([], context("田"))).toEqual({
      best: { sei: "田", mei: "" },
      confidence: 0,
      candidates: [],
    });
  });

  it("閾値と差を満たせば信頼度 1.0 で採用する", () => {
    const candidates = [candidate("田中", "花", 6.0), candidate("田", "中花", 5.0)];
    expect(decide(candidates, context("田中花"))).toEqual({
      best: { sei: "田中", mei: "花" },
      confidence: 1.0,
      candidates,
    });
  });

  it("候補が 1 つなら差の条件を満たす", () => {
    expect(decide([candidate("佐", "藤", 6.0)], context("佐藤")).confidence).toBe(1.0);
  });

  it("差が足りなければ未分割", () => {
    const candidates = [candidate("田中", "花", 6.0), candidate("田", "中花", 5.5)];
    expect(decide(candidates, context("田中花"))).toMatchObject({
      best: { sei: "田中花", mei: "" },
      confidence: 0,
    });
  });

  it("全体が辞書語なら候補の点数によらず未分割", () => {
    const result = decide([candidate("田", "中", 9.0)], context("田中", { allowLowConfidence: true }));
    expect(result).toMatchObject({ best: { sei: "田中", mei: "" }, confidence: 0 });
  });

  it("最良候補の名が敬称なら未分割", () => {
    const result = decide([candidate("佐藤", "さん", 9.0)], context("佐藤さん", { allowLowConfidence: true }));
    expect(result).toMatchObject({ best: { sei: "佐藤さん", mei: "" }, confidence: 0 });
  });

  describe("文字種境界", () => {
    const candidates = [candidate("夏目", "はな", 6.0), candidate("夏", "目はな", 5.5)];
    const boundary = { index: 2, direction: "kanji-to-kana" } as const;

    it("境界と一致し根拠があれば信頼度 0.8 で採用する", () => {
      expect(decide(candidates, context("夏目はな", { boundary })).confidence).toBe(0.8);
    });

    it("差の条件は通常より緩い 0.5 まで", () => {
      const close = [candidate("夏目", "はな", 6.0), candidate("夏", "目はな", 5.6)];
      expect(decide(close, context("夏目はな", { boundary })).confidence).toBe(0);
    });

    it("かな→漢字では名の根拠を見る", () => {
      const kanaToKanji = { index: 2, direction: "kana-to-kanji" } as const;
      const noMei = [candidate("かた", "梨乃", 6.0, "surface", "none"), candidate("か", "た梨乃", 5.5)];
      expect(decide(noMei, context("かた梨乃", { boundary: kanaToKanji })).confidence).toBe(0);

      const hasMei = [candidate("かた", "梨乃", 6.0, "none", "surface"), candidate("か", "た梨乃", 5.5)];
      expect(decide(hasMei, context("かた梨乃", { boundary: kanaToKanji })).confidence).toBe(0.8);
    });
  });

  it("カタカナ＋姓の辞書語は最良候補でなくても採用する", () => {
    const boundary = { index: 4, direction: "kana-to-kanji" } as const;
    const candidates = [
      candidate("ジャガ", "ー横田", 3.0, "none", "none"),
      candidate("ジャガー", "横田", 2.0, "none", "none"),
    ];
    expect(decide(candidates, context("ジャガー横田", { boundary }))).toEqual({
      best: { sei: "ジャガー", mei: "横田" },
      confidence: 0.8,
      candidates,
    });
  });

  it("低信頼モードは最良候補を点数比の信頼度で採用する", () => {
    const candidates = [candidate("山川", "花", 3.0, "none", "none")];
    expect(decide(candidates, context("山川花", { allowLowConfidence: true }))).toEqual({
      best: { sei: "山川", mei: "花" },
      confidence: 0.5,
      candidates,
    });
  });
});
