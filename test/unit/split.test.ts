import { describe, it, expect, beforeAll } from "vitest";
import { split, analyze, setLexicon } from "../../src/core/splitter";
import type { PackedLexicon } from "../../src/core/types";

// Minimal test lexicon
// Note: 夏色 and 白銀 are NOT included as surnames — they must be resolved
// by script boundary heuristic, not dictionary lookup
const testLexicon: PackedLexicon = {
  sei: ["田中", "佐藤", "大瀬良", "林", "勅使河原", "小鳥遊", "西園寺", "齋藤", "綾瀬", "夏", "周防"],
  mei: ["太郎", "花子", "大地", "健太", "公望", "翔", "一郎"],
  folded: {
    "斎藤": ["齋藤"],
  },
  maxSeiLen: 4,
  maxMeiLen: 3,
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

    it("allowLowConfidence: 辞書未登録でも境界位置が最高スコアになる（夏色まつり）", () => {
      // 夏色 is NOT in the dictionary, but boundary scoring should
      // make 夏色/まつり rank higher than 夏/色まつり
      const result = analyze("夏色まつり", { allowLowConfidence: true });
      expect(result.best).toEqual({ sei: "夏色", mei: "まつり" });
    });

    it("allowLowConfidence: 漢字→カタカナ境界が勝つ（白銀ノエル）", () => {
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

    it("1文字姓の正当な辞書ヒットは境界がなければ維持される（林一郎）", () => {
      expect(split("林一郎")).toEqual({ sei: "林", mei: "一郎" });
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
