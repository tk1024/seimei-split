import { describe, it, expect } from "vitest";
import { hasNameLikeEnds, positionLogRatio } from "../../src/core/charStats";
import type { PackedLexicon } from "../../src/core/types";

const lexicon: PackedLexicon = {
  sei: ["井戸", "山戸", "瀬戸", "木戸", "青戸"],
  mei: ["潤一", "潤二", "潤三", "潤吾", "潤治", "直人", "雅人", "正人", "和人", "優人"],
  folded: {},
  maxSeiLen: 2,
  maxMeiLen: 2,
};

describe("positionLogRatio", () => {
  it("その種別らしい字は正、反対の種別らしい字は負になる", () => {
    expect(positionLogRatio("潤人", "mei", lexicon)).toBeGreaterThan(0);
    expect(positionLogRatio("井戸", "mei", lexicon)).toBeLessThan(0);
  });

  it("種別を入れ替えると符号が反転する", () => {
    expect(positionLogRatio("潤人", "sei", lexicon)).toBeCloseTo(-positionLogRatio("潤人", "mei", lexicon));
  });

  it("どちらの種別にも現れない字は 0", () => {
    expect(positionLogRatio("工場", "mei", lexicon)).toBeCloseTo(0);
  });

  it("かなを含む語は 0", () => {
    expect(positionLogRatio("じゅん", "mei", lexicon)).toBe(0);
  });

  it("1 文字の語は先頭字だけを見る", () => {
    expect(positionLogRatio("潤", "mei", lexicon)).toBeGreaterThan(0);
  });
});

describe("hasNameLikeEnds", () => {
  it("先頭字と末尾字がともに十分あれば true", () => {
    expect(hasNameLikeEnds("潤人", lexicon)).toBe(true);
  });

  it("どちらかが足りなければ false", () => {
    expect(hasNameLikeEnds("潤店", lexicon)).toBe(false);
    expect(hasNameLikeEnds("工人", lexicon)).toBe(false);
  });

  it("1 文字なら false", () => {
    expect(hasNameLikeEnds("潤", lexicon)).toBe(false);
  });

  it("4 文字以上なら false", () => {
    expect(hasNameLikeEnds("潤太郎人", lexicon)).toBe(false);
  });

  it("異体字を畳み込んで数える", () => {
    const variants: PackedLexicon = { ...lexicon, mei: ["廣一", "広二", "廣三", "広吾", "廣治", ...lexicon.mei] };
    expect(hasNameLikeEnds("廣人", variants)).toBe(true);
    expect(hasNameLikeEnds("広人", variants)).toBe(true);
  });

  it("記号を含めば false", () => {
    expect(hasNameLikeEnds("潤☆人", lexicon)).toBe(false);
  });

  it("名より姓に多い字で始まり終わるなら false", () => {
    const shared: PackedLexicon = {
      ...lexicon,
      sei: ["潤山", "潤川", "潤田", "潤村", "潤本", "潤岡", "潤野", "潤沢", "潤井", "潤木", "山人", "川人", "田人", "村人", "本人", "岡人", "野人", "沢人", "井人", "木人"],
    };
    expect(hasNameLikeEnds("潤人", shared)).toBe(false);
  });
});
