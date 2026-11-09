import { describe, it, expect, vi } from "vitest";
import { decide } from "../../src/core/splitter";
import type { AnalysisContext } from "../../src/core/splitter";
import type { MatchType, PackedLexicon, SeimeiCandidate } from "../../src/core/types";

const lexicon: PackedLexicon = {
  sei: ["田中", "横田"],
  mei: ["太郎", "賢一", "賢二", "賢三", "賢吾", "賢治", "直人", "雅人", "正人", "和人", "優人"],
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

  describe("ひらがな→漢字の境界で閾値に届かない候補", () => {
    const boundary = { index: 3, direction: "kana-to-kanji" } as const;
    const ctx = (name: string) => context(name, { boundary });
    const kana = (mei: string, score: number, match: MatchType = "surface") =>
      candidate("ぺこら", mei, score, "none", match);
    const other = candidate("ぺ", "こら美奈子", 1.0, "none", "none");

    it("スコア 5.2 以上で信頼度 0.8 の boundary として採用する", () => {
      const result = decide([kana("美奈子", 5.2), other], ctx("ぺこら美奈子"));
      expect(result.best).toEqual({ sei: "ぺこら", mei: "美奈子" });
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toBe("boundary");
    });

    it("スコアが 5.2 未満なら採用しない", () => {
      expect(decide([kana("美奈子", 5.1), other], ctx("ぺこら美奈子")).reason).toBe("insufficient");
    });

    it("次点との差が 0.5 未満なら採用しない", () => {
      const close = candidate("ぺ", "こら美奈子", 5.0, "none", "none");
      expect(decide([kana("美奈子", 5.2), close], ctx("ぺこら美奈子")).reason).toBe("insufficient");
    });

    it("名が 1 文字なら採用しない", () => {
      expect(decide([kana("美", 5.5), other], ctx("ぺこら美")).reason).toBe("insufficient");
    });

    it("名が異体字の一致なら採用しない", () => {
      expect(decide([kana("美奈子", 5.5, "folded"), other], ctx("ぺこら美奈子")).reason).toBe("insufficient");
    });

    it("前半がカタカナだけなら採用しない", () => {
      const katakana = candidate("ペコラ", "美奈子", 5.5, "none", "surface");
      expect(decide([katakana, other], ctx("ペコラ美奈子")).reason).toBe("insufficient");
    });

    it("かなの先頭が 2 文字以上の辞書の姓なら採用しない", () => {
      const shorter = candidate("ぺこ", "ら美奈子", 1.0, "surface", "none");
      expect(decide([kana("美奈子", 5.5), shorter], ctx("ぺこら美奈子")).reason).toBe("insufficient");
    });

    it("かなの先頭が 1 文字の辞書の姓なら採用する", () => {
      const shorter = candidate("ぺ", "こら美奈子", 1.0, "surface", "none");
      expect(decide([kana("美奈子", 5.5), shorter], ctx("ぺこら美奈子")).reason).toBe("boundary");
    });

    it("名が役職語なら採用しない", () => {
      expect(decide([kana("博士", 5.5), other], ctx("ぺこら博士")).reason).toBe("insufficient");
    });
  });

  it("片側でも読みだけの一致なら信頼度 0.7 の reading で採用する", () => {
    const readingOnly = [candidate("アメ", "リカ", 6.8, "reading", "surface"), candidate("ア", "メリカ", 4.0)];
    const result = decide(readingOnly, context("アメリカ", { isKana: true }));
    expect(result.best).toEqual({ sei: "アメ", mei: "リカ" });
    expect(result.confidence).toBe(0.7);
    expect(result.reason).toBe("reading");
  });

  it("読みの一致でも差が足りなければ採用しない", () => {
    const close = [candidate("アメ", "リカ", 6.8, "reading", "surface"), candidate("ア", "メリカ", 6.5)];
    expect(decide(close, context("アメリカ", { isKana: true })).reason).toBe("insufficient");
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

  describe("姓の辞書一致", () => {
    const seiOnly = (mei: string, score = 5.5, second = 3.0) => [
      candidate("山崎", mei, score, "surface", "none"),
      candidate("山", "崎" + mei, second, "none", "none"),
    ];

    it("名が名らしく差が十分なら信頼度 0.75 で採用する", () => {
      expect(decide(seiOnly("賢人"), context("山崎賢人"))).toMatchObject({
        best: { sei: "山崎", mei: "賢人" },
        confidence: 0.75,
        reason: "sei-match",
      });
    });

    it("閾値を超えても片側一致は信頼度 1.0 にならない", () => {
      expect(decide(seiOnly("賢人", 7.0), context("山崎賢人")).reason).toBe("sei-match");
    });

    it("差が足りなければ未分割", () => {
      expect(decide(seiOnly("賢人", 5.5, 3.6), context("山崎賢人")).reason).toBe("insufficient");
    });

    it("名の先頭字や末尾字が名の辞書に少なければ未分割", () => {
      expect(decide(seiOnly("工務店"), context("山崎工務店")).reason).toBe("insufficient");
    });

    it("全かなの入力には適用しない", () => {
      expect(decide(seiOnly("賢人"), context("やまざきけんと", { isKana: true })).reason).toBe("insufficient");
    });

    it("名の末尾が敬称や役職語なら、字の統計を満たしても未分割", () => {
      const withEndings: PackedLexicon = {
        ...lexicon,
        mei: [...lexicon.mei, "一氏", "二氏", "三氏", "四氏", "五氏", "一長", "二長", "三長", "四長", "五長"],
      };
      expect(decide(seiOnly("賢氏"), context("山崎賢氏", { lexicon: withEndings })).reason).toBe("insufficient");
      expect(decide(seiOnly("賢社長"), context("山崎賢社長", { lexicon: withEndings })).reason).toBe("insufficient");
      expect(decide(seiOnly("賢一長"), context("山崎賢一長", { lexicon: withEndings })).reason).toBe("sei-match");
    });

    it("名が 4 文字以上なら未分割", () => {
      expect(decide(seiOnly("賢太賢人"), context("山崎賢太賢人")).reason).toBe("insufficient");
    });

    it("名が 1 文字なら未分割", () => {
      expect(decide(seiOnly("人"), context("山崎人")).reason).toBe("insufficient");
    });

    it("文字種境界のある入力には適用しない", () => {
      const boundary = { index: 3, direction: "kanji-to-kana" } as const;
      expect(decide(seiOnly("賢人"), context("山崎賢人", { boundary })).reason).toBe("insufficient");
    });

    it("名だけの一致では採用しない", () => {
      const candidates = [candidate("山崎", "賢人", 7.0, "none", "surface"), candidate("山", "崎賢人", 3.0)];
      expect(decide(candidates, context("山崎賢人")).reason).toBe("insufficient");
    });
  });

  it("次点以下の候補の名が組織語でも未分割", () => {
    const candidates = [
      candidate("株式会", "社", 5.0, "none", "none"),
      candidate("株式", "会社", 4.0, "none", "none"),
    ];
    expect(decide(candidates, context("株式会社", { allowLowConfidence: true })).reason).toBe("not-full-name");
  });

  it("次点以下の候補の名が敬称でも、最良候補が氏名なら分割する", () => {
    const candidates = [candidate("足利", "尊氏", 10.0), candidate("足利尊", "氏", 5.0)];
    expect(decide(candidates, context("足利尊氏")).reason).toBe("dictionary");
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
