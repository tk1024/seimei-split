import { describe, it, expect } from "vitest";
import { packWords, unpackWords } from "../../src/data/packedWords";

describe("packWords", () => {
  it("文字数ごとに区切りなしで連結し、添字 + 1 を文字数にする", () => {
    expect(packWords(["田中", "林", "佐々木", "山田"])).toEqual(["林", "山田田中", "佐々木"]);
  });

  it("該当する語がない文字数は空文字列で埋める", () => {
    expect(packWords(["佐々木"])).toEqual(["", "", "佐々木"]);
  });

  it("サロゲートペアを 1 文字として数える", () => {
    expect(packWords(["𠮷田"])).toEqual(["", "𠮷田"]);
  });

  it("語がなければ空配列を返す", () => {
    expect(packWords([])).toEqual([]);
  });
});

describe("unpackWords", () => {
  it("文字数ごとの連結を語に戻す", () => {
    expect(unpackWords(["林", "山田田中", "佐々木"])).toEqual(["林", "山田", "田中", "佐々木"]);
  });

  it("空のグループを読み飛ばす", () => {
    expect(unpackWords(["", "", "佐々木"])).toEqual(["佐々木"]);
  });

  it("サロゲートペアの途中で切らない", () => {
    expect(unpackWords(["", "𠮷田山田"])).toEqual(["𠮷田", "山田"]);
  });

  it("packWords の出力から元の語を復元する", () => {
    const words = ["林", "山田", "𠮷田", "佐々木", "愛新覚羅"];
    expect(unpackWords(packWords(words)).sort()).toEqual([...words].sort());
  });
});
