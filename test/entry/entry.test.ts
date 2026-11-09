import { beforeEach, describe, expect, it, vi } from "vitest";

describe("public entry points", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("core has no dictionary until the bundled entry loads one", async () => {
    const core = await import("../../src/core.ts");
    expect(core.getLexicon()).toBeUndefined();
    expect(core.split("田中太郎")).toEqual({ sei: "田中太郎", mei: "" });

    const bundled = await import("../../src/index.ts");
    expect(bundled.getLexicon()).toBeDefined();
    expect(bundled.split("田中太郎")).toEqual({ sei: "田中", mei: "太郎" });
  });

  it("reading entry improves kana input as documented", async () => {
    const { split, setReading } = await import("../../src/index.ts");
    const { reading } = await import("../../src/reading.ts");
    expect(split("はいだしょうこ")).toEqual({ sei: "はいだしょうこ", mei: "" });

    setReading(reading);
    expect(split("はいだしょうこ")).toEqual({ sei: "はいだ", mei: "しょうこ" });
    expect(split("くまだまさし")).toEqual({ sei: "くまだ", mei: "まさし" });
  });
});
