import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { analyze } from "../../src/core/splitter";
import { reading } from "../../src/reading";
import { ensureLexicon, loadTsv, renderBaseline } from "../helper";

// Results with reading data enabled. An empty sei/mei marks an ordinary word.
describe("読みデータを有効にしたとき", () => {
  const options = { readingData: reading };
  const cases = loadTsv(resolve(__dirname, "data.tsv"));
  const names = cases.filter((tc) => tc.mei !== "");
  const words = cases.filter((tc) => tc.mei === "");

  beforeAll(async () => {
    expect(await ensureLexicon()).toBe(true);
  });

  it("matches the per-input baseline", async () => {
    await expect(renderBaseline(cases, options)).toMatchFileSnapshot(
      resolve(__dirname, "baseline.tsv"),
    );
  });

  it.each(names)("氏名 $input を分割する", ({ input, sei, mei }) => {
    expect(analyze(input, options).best).toEqual({ sei, mei });
  });

  it.each(words)("一般語 $input を高い信頼度で分割しない", ({ input }) => {
    expect(analyze(input, options).confidence).toBeLessThan(0.8);
  });
});
