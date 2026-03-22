import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { split, setLexicon } from "../src/core/splitter";
import type { PackedLexicon } from "../src/core/types";

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
  }).filter((tc) => tc.mei);
}

let lexiconLoaded = false;

async function ensureLexicon(): Promise<boolean> {
  if (lexiconLoaded) return true;

  // 1. Try locally generated data first
  if (existsSync(LOCAL_LEXICON_PATH)) {
    const { lexicon } = await import("../src/data/generated/unidic.ts");
    setLexicon(lexicon);
    lexiconLoaded = true;
    return true;
  }

  // 2. Fall back to published npm package
  try {
    const pkg = await import("seimei-split") as { split: typeof split; getLexicon: () => PackedLexicon | undefined };
    const lexicon = pkg.getLexicon();
    if (lexicon) {
      setLexicon(lexicon);
      lexiconLoaded = true;
      return true;
    }
  } catch {
    // package not installed
  }

  return false;
}

/**
 * Run a data-driven test suite from a TSV file using the bundled dictionary.
 * Uses locally generated data if available, otherwise falls back to the
 * published npm package (seimei-split).
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
          "Skipping: no dictionary available.\n" +
          "  - Run `npm run generate:data` to generate locally, or\n" +
          "  - Run `npm install seimei-split` to use the published package."
        );
      }
      expect(available).toBe(true);
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

    it("reports accuracy", () => {
      if (!available) return;

      let correct = 0;
      let wrong = 0;
      let unsplit = 0;

      for (const tc of cases) {
        const result = split(tc.input);
        if (result.sei === tc.sei && result.mei === tc.mei) {
          correct++;
        } else if (result.mei === "") {
          unsplit++;
        } else {
          wrong++;
        }
      }

      const total = correct + wrong + unsplit;
      console.log(
        `${suiteName}: ${correct}/${total} correct (${((correct / total) * 100).toFixed(1)}%), ${wrong} wrong, ${unsplit} unsplit`
      );
    });
  });
}
