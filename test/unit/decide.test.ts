import { describe, it, expect, vi } from "vitest";
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
      reason: "no-candidate",
      candidates: [],
    });
  });

  it("辞書が未設定なら no-dictionary を返す", async () => {
    vi.resetModules();
    const { analyze } = await import("../../src/core/splitter");
    expect(analyze("田中太郎").reason).toBe("no-dictionary");
  });

  it("閾値と差を満たせば信頼度 1.0 で採用する", () => {
    const candidates = [candidate("田中", "花", 6.0), candidate("田", "中花", 5.0)];
    expect(decide(candidates, context("田中花"))).toEqual({
      best: { sei: "田中", mei: "花" },
      confidence: 1.0,
      reason: "dictionary",
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
      reason: "insufficient",
    });
  });

  it("全体が辞書語なら候補の点数によらず未分割", () => {
    const result = decide([candidate("田", "中", 9.0)], context("田中", { allowLowConfidence: true }));
    expect(result).toMatchObject({ best: { sei: "田中", mei: "" }, confidence: 0, reason: "not-full-name" });
  });

  it("最良候補の名が敬称なら未分割", () => {
    const result = decide([candidate("佐藤", "さん", 9.0)], context("佐藤さん", { allowLowConfidence: true }));
    expect(result).toMatchObject({ best: { sei: "佐藤さん", mei: "" }, confidence: 0, reason: "not-full-name" });
  });

  describe("文字種境界", () => {
    const candidates = [candidate("夏目", "はな", 6.0), candidate("夏", "目はな", 5.5)];
    const boundary = { index: 2, direction: "kanji-to-kana" } as const;

    it("境界と一致し根拠があれば信頼度 0.8 で採用する", () => {
      expect(decide(candidates, context("夏目はな", { boundary }))).toMatchObject({
        confidence: 0.8,
        reason: "boundary",
      });
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
      reason: "katakana-sei",
      candidates,
    });
  });

  it("カタカナ姓の規則でも点数が有限でない候補は採用しない", () => {
    const boundary = { index: 1, direction: "kana-to-kanji" } as const;
    const candidates = [
      candidate("ア横", "田", 3.0, "none", "none"),
      candidate("ア", "横田", -Infinity, "none", "none"),
    ];
    expect(decide(candidates, context("ア横田", { boundary }))).toMatchObject({
      best: { sei: "ア横田", mei: "" },
      confidence: 0,
      reason: "insufficient",
    });
  });

  it("最良候補の点数が有限でなければ低信頼モードでも未分割", () => {
    const candidates = [candidate("会", "社", -Infinity, "none", "none")];
    expect(decide(candidates, context("会社", { allowLowConfidence: true }))).toEqual({
      best: { sei: "会社", mei: "" },
      confidence: 0,
      reason: "insufficient",
      candidates,
    });
  });

  it("低信頼モードは最良候補を点数比の信頼度で採用する", () => {
    const candidates = [candidate("山川", "花", 3.0, "none", "none")];
    expect(decide(candidates, context("山川花", { allowLowConfidence: true }))).toEqual({
      best: { sei: "山川", mei: "花" },
      confidence: 0.35,
      reason: "low-confidence",
      candidates,
    });
  });

  it.each([-5, 0, 1, 5.9, 6, 9, 100])("低信頼モードの信頼度は 0 より大きく境界確信より低い（点数 %d）", (score) => {
    const candidates = [candidate("山川", "花", score, "none", "none"), candidate("山", "川花", score - 0.1, "none", "none")];
    const { confidence } = decide(candidates, context("山川花", { allowLowConfidence: true }));
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThan(0.8);
  });
});
