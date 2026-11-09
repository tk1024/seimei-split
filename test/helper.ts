import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { analyze, split, setLexicon } from "../src/core/splitter";
import type { AnalyzeResult } from "../src/core/types";

const LOCAL_LEXICON_PATH = resolve(__dirname, "../src/data/generated/unidic.ts");

interface TestCase {
  input: string;
  sei: string;
  mei: string;
}

function loadTsv(tsvPath: string): TestCase[] {
  const content = readFileSync(tsvPath, "utf-8");
  const lines = content.trim().split("\n");
  return lines.slice(1).map((line) => {
    const [input, sei, mei] = line.split("\t");
    return { input, sei: sei ?? "", mei: mei ?? "" };
  });
}

function formatResult(result: AnalyzeResult): string {
  const split = result.best.mei === "" ? "(unsplit)" : `${result.best.sei}/${result.best.mei}`;
  return `${split}\t${Number(result.confidence.toFixed(4))}\t${result.reason}`;
}

/**
 * Render every input's result in both modes, one input per line,
 * so that a behavior change shows up as a readable per-input diff.
 */
function renderBaseline(cases: TestCase[]): string {
  const header = "input\tnormal\tnormal_confidence\tnormal_reason\tlow_confidence\tlow_confidence_confidence\tlow_confidence_reason";
  const rows = cases.map((tc) => {
    const normal = analyze(tc.input);
    const low = analyze(tc.input, { allowLowConfidence: true });
    return `${tc.input}\t${formatResult(normal)}\t${formatResult(low)}`;
  });
  return [header, ...rows].join("\n") + "\n";
}

let lexiconLoaded = false;

async function ensureLexicon(): Promise<boolean> {
  if (lexiconLoaded) return true;
  if (!existsSync(LOCAL_LEXICON_PATH)) return false;

  const { lexicon } = await import("../src/data/generated/unidic.ts");
  setLexicon(lexicon);
  lexiconLoaded = true;
  return true;
}

function runAccuracyReport(
  suiteName: string,
  cases: TestCase[],
  mode: "normal" | "lowConfidence",
): void {
  let correct = 0;
  let wrong = 0;
  let unsplit = 0;

  const opts = mode === "lowConfidence" ? { allowLowConfidence: true } : {};

  for (const tc of cases) {
    const result = split(tc.input, opts);
    if (result.sei === tc.sei && result.mei === tc.mei) {
      correct++;
    } else if (result.mei === "") {
      unsplit++;
    } else {
      wrong++;
    }
  }

  const total = correct + wrong + unsplit;
  const label = mode === "lowConfidence" ? `${suiteName} [lowConf]` : suiteName;
  console.log(
    `${label}: ${correct}/${total} correct (${((correct / total) * 100).toFixed(1)}%), ${wrong} wrong, ${unsplit} unsplit`
  );
}

/**
 * Run a data-driven test suite from a TSV file using the bundled dictionary.
 * Tests both normal mode and allowLowConfidence mode.
 *
 * Each suite compares every input's result with `baseline.tsv` next to its
 * data file. After an intended behavior change, run `npm run test:update`
 * and review the baseline diff.
 */
export function runTsvTest(suiteName: string, tsvPath: string): void {
  describe(suiteName, () => {
    let cases: TestCase[] = [];
    let available = false;

    beforeAll(async () => {
      available = await ensureLexicon();
      if (!available) return;
      cases = loadTsv(tsvPath);
    });

    it("dictionary is available", () => {
      if (!available) {
        console.warn(
          "No dictionary available. Run `npm run download:data && npm run generate:data`."
        );
      }
      expect(available).toBe(true);
    });

    it("matches the per-input baseline", async () => {
      if (!available) return;
      await expect(renderBaseline(cases)).toMatchFileSnapshot(
        resolve(dirname(tsvPath), "baseline.tsv"),
      );
    });

    it("should not produce wrong splits (may unsplit)", () => {
      if (!available) return;

      const errors: string[] = [];
      for (const tc of cases) {
        const result = split(tc.input);
        if (result.mei === "") continue;
        if (result.sei !== tc.sei || result.mei !== tc.mei) {
          errors.push(
            `${tc.input}: expected [${tc.sei} / ${tc.mei}] got [${result.sei} / ${result.mei}]`
          );
        }
      }
      if (errors.length > 0) {
        throw new Error(`Wrong splits:\n${errors.join("\n")}`);
      }
    });

    it("reports accuracy (normal)", () => {
      if (!available) return;
      runAccuracyReport(suiteName, cases, "normal");
    });

    it("reports accuracy (allowLowConfidence)", () => {
      if (!available) return;
      runAccuracyReport(suiteName, cases, "lowConfidence");
    });
  });
}
