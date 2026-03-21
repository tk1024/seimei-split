import { describe, it, expect } from "vitest";
import { split } from "../index";

describe("split", () => {
  it("半角スペース区切りの姓名を分離する", () => {
    expect(split("田中 太郎")).toEqual({ sei: "田中", mei: "太郎" });
  });

  it("全角スペース区切りの姓名を分離する", () => {
    expect(split("田中　太郎")).toEqual({ sei: "田中", mei: "太郎" });
  });

  it("空文字の場合は空を返す", () => {
    expect(split("")).toEqual({ sei: "", mei: "" });
  });

  it("姓のみの場合はmeiを空にする", () => {
    expect(split("田中")).toEqual({ sei: "田中", mei: "" });
  });

  it("前後の空白をトリムする", () => {
    expect(split("  田中 太郎  ")).toEqual({ sei: "田中", mei: "太郎" });
  });
});
