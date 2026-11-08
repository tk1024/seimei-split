import { describe, expect, it } from "vitest";

describe("public entry points", () => {
  it("core has no dictionary until the bundled entry loads one", async () => {
    const core = await import("../../src/core.ts");
    expect(core.getLexicon()).toBeUndefined();
    expect(core.split("田中太郎")).toEqual({ sei: "田中太郎", mei: "" });

    const bundled = await import("../../src/index.ts");
    expect(bundled.getLexicon()).toBeDefined();
    expect(bundled.split("田中太郎")).toEqual({ sei: "田中", mei: "太郎" });
  });
});
