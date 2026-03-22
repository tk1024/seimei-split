import { describe, it, expect, beforeAll } from "vitest";
import { split, analyze, setLexicon } from "../../src/core/splitter";
import { findSingleScriptBoundary } from "../../src/core/normalize";
import type { PackedLexicon } from "../../src/core/types";

const testLexicon: PackedLexicon = {
  sei: ["田中", "佐藤", "大瀬良", "林", "勅使河原", "小鳥遊", "西園寺", "齋藤", "綾瀬", "夏", "周防", "横田", "池田", "秋山", "松村", "高峰"],
  mei: ["太郎", "花子", "大地", "健太", "公望", "翔", "一郎", "リン", "田"],
  folded: {
    "斎藤": ["齋藤"],
  },
  maxSeiLen: 4,
  maxMeiLen: 5,
};

describe("split", () => {
  beforeAll(() => {
    setLexicon(testLexicon);
  });

  describe("スペース区切り", () => {
    it("半角スペース区切りの姓名を分離する", () => {
      expect(split("田中 太郎")).toEqual({ sei: "田中", mei: "太郎" });
    });

    it("全角スペース区切りの姓名を分離する", () => {
      expect(split("田中　太郎")).toEqual({ sei: "田中", mei: "太郎" });
    });

    it("空文字の場合は空を返す", () => {
      expect(split("")).toEqual({ sei: "", mei: "" });
    });

    it("前後の空白をトリムする", () => {
      expect(split("  田中 太郎  ")).toEqual({ sei: "田中", mei: "太郎" });
    });
  });

  describe("辞書ベース分離", () => {
    it("2文字姓 + 2文字名を分離する", () => {
      expect(split("田中太郎")).toEqual({ sei: "田中", mei: "太郎" });
    });

    it("2文字姓 + 2文字名（佐藤花子）", () => {
      expect(split("佐藤花子")).toEqual({ sei: "佐藤", mei: "花子" });
    });

    it("3文字姓を分離する（大瀬良大地）", () => {
      expect(split("大瀬良大地")).toEqual({ sei: "大瀬良", mei: "大地" });
    });

    it("1文字姓を辞書ヒットで分離する（林一郎）", () => {
      expect(split("林一郎")).toEqual({ sei: "林", mei: "一郎" });
    });

    it("4文字姓を分離する（勅使河原健太）", () => {
      expect(split("勅使河原健太")).toEqual({ sei: "勅使河原", mei: "健太" });
    });
  });

  describe("エッジケース", () => {
    it("1文字の入力はunsplitで返す", () => {
      expect(split("林")).toEqual({ sei: "林", mei: "" });
    });

    it("英字を含む場合はunsplitで返す", () => {
      expect(split("John田中")).toEqual({ sei: "John田中", mei: "" });
    });

    it("辞書なしの場合はunsplitで返す", () => {
      const emptyLexicon: PackedLexicon = {
        sei: [], mei: [],
        folded: {}, maxSeiLen: 6, maxMeiLen: 6,
      };
      expect(split("田中太郎", { lexicon: emptyLexicon })).toEqual({
        sei: "田中太郎",
        mei: "",
      });
    });
  });

  describe("findSingleScriptBoundary", () => {
    it("漢字→ひらがな境界を検出する", () => {
      expect(findSingleScriptBoundary("夏色まつり")).toEqual({ index: 2, direction: "kanji-to-kana" });
    });

    it("漢字→カタカナ境界を検出する", () => {
      expect(findSingleScriptBoundary("白銀ノエル")).toEqual({ index: 2, direction: "kanji-to-kana" });
    });

    it("カタカナ→漢字境界を検出する", () => {
      expect(findSingleScriptBoundary("ジャガー横田")).toEqual({ index: 4, direction: "kana-to-kanji" });
    });

    it("ひらがな→漢字境界を検出する", () => {
      expect(findSingleScriptBoundary("かたせ梨乃")).toEqual({ index: 3, direction: "kana-to-kanji" });
    });

    it("全漢字は undefined", () => {
      expect(findSingleScriptBoundary("田中太郎")).toBeUndefined();
    });

    it("遷移2回は undefined", () => {
      expect(findSingleScriptBoundary("もこ田めめめ")).toBeUndefined();
    });

    it("全ひらがなは undefined", () => {
      expect(findSingleScriptBoundary("たなかたろう")).toBeUndefined();
    });
  });

  describe("文字種境界スコアリング", () => {
    it("辞書ヒット姓 + かな名を境界で分離する（綾瀬はるか）", () => {
      const result = analyze("綾瀬はるか");
      expect(result.best).toEqual({ sei: "綾瀬", mei: "はるか" });
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it("辞書ヒット姓 + カタカナ名を境界で分離する（周防パトラ）", () => {
      const result = analyze("周防パトラ");
      expect(result.best).toEqual({ sei: "周防", mei: "パトラ" });
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it("allowLowConfidence: 辞書未登録でも境界位置が最高スコアになる", () => {
      const result = analyze("夏色まつり", { allowLowConfidence: true });
      expect(result.best).toEqual({ sei: "夏色", mei: "まつり" });
    });

    it("allowLowConfidence: 漢字→カタカナ境界が勝つ", () => {
      const result = analyze("白銀ノエル", { allowLowConfidence: true });
      expect(result.best).toEqual({ sei: "白銀", mei: "ノエル" });
    });

    it("辞書根拠がない場合は通常モードで unsplit", () => {
      expect(split("東京はなこ")).toEqual({ sei: "東京はなこ", mei: "" });
    });

    it("文字種遷移が2回以上ある場合は境界ボーナスなし", () => {
      expect(split("夢野あき子")).toEqual({ sei: "夢野あき子", mei: "" });
    });

    it("全漢字名は境界スコアの影響を受けない", () => {
      const result = analyze("田中太郎");
      expect(result.best).toEqual({ sei: "田中", mei: "太郎" });
      expect(result.confidence).toBe(1.0);
    });

    it("1文字姓の正当な辞書ヒットは境界がなければ維持される", () => {
      expect(split("林一郎")).toEqual({ sei: "林", mei: "一郎" });
    });
  });

  describe("OOV姓の混在ペナルティ", () => {
    it("漢字+カタカナ1文字の姓は大きく減点される", () => {
      // 宝鐘マ/リン より 宝鐘/マリン が勝つべき
      const result = analyze("宝鐘マリン", { allowLowConfidence: true });
      expect(result.best).toEqual({ sei: "宝鐘", mei: "マリン" });
    });

    it("漢字+ひらがなの姓も減点される", () => {
      const result = analyze("星街すいせい", { allowLowConfidence: true });
      expect(result.best).toEqual({ sei: "星街", mei: "すいせい" });
    });

    it("辞書ヒットする姓には混在ペナルティが適用されない", () => {
      // 綾瀬 is in dict — no penalty
      const result = analyze("綾瀬はるか");
      expect(result.best).toEqual({ sei: "綾瀬", mei: "はるか" });
    });
  });

  describe("姓ヒットボーナス", () => {
    it("姓辞書ヒットは名辞書ヒットより優先される", () => {
      // 松村/沙友理 (sei=surface) vs 松村沙/友理 (mei=surface)
      const result = analyze("松村沙友理", { allowLowConfidence: true });
      expect(result.best.sei).toBe("松村");
    });
  });

  describe("カタカナ姓の例外フロー", () => {
    it("全カタカナ姓 + 漢字名は後半を姓辞書で照合する", () => {
      // ジャガー/横田: 横田が姓辞書にヒット → 例外フローで採用
      const result = analyze("ジャガー横田");
      expect(result.best).toEqual({ sei: "ジャガー", mei: "横田" });
      expect(result.confidence).toBe(0.8);
    });

    it("ダン/池田も例外フローで分離する", () => {
      const result = analyze("ダン池田");
      expect(result.best).toEqual({ sei: "ダン", mei: "池田" });
      expect(result.confidence).toBe(0.8);
    });

    it("漢字姓+漢字名には例外フローが適用されない", () => {
      const result = analyze("田中太郎");
      expect(result.confidence).toBe(1.0);
    });
  });

  describe("analyze", () => {
    it("候補リストとconfidenceを返す", () => {
      const result = analyze("田中太郎");
      expect(result.best).toEqual({ sei: "田中", mei: "太郎" });
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it("スペース区切りの場合はconfidence 1.0", () => {
      const result = analyze("田中 太郎");
      expect(result.confidence).toBe(1.0);
    });
  });
});
