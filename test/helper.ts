import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { split, setLexicon } from "../src/core/splitter";

const LEXICON_PATH = resolve(__dirname, "../src/data/generated/unidic.ts");

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
  }).filter((tc) => tc.mei); // skip entries without expected mei
}

let lexiconLoaded = false;

async function ensureLexicon(): Promise<boolean> {
  if (lexiconLoaded) return true;
  if (!existsSync(LEXICON_PATH)) return false;
  const { lexicon } = await import("../src/data/generated/unidic.ts");
  setLexicon(lexicon);
  lexiconLoaded = true;
  return true;
}

/**
 * Run a data-driven test suite from a TSV file using the bundled dictionary.
 * Skips if the dictionary has not been generated.
 */
export function runTsvTest(suiteName: string, tsvPath: string): void {
  describe(suiteName, () => {
    let cases: TestCase[] = [];

    beforeAll(async () => {
      const loaded = await ensureLexicon();
      if (!loaded) return;
      cases = loadTsv(tsvPath);
    });

    it("dictionary is available", async () => {
      const loaded = await ensureLexicon();
      if (!loaded) {
        console.warn("Skipping: dictionary not generated. Run `npm run generate:data` first.");
        return;
      }
      expect(loaded).toBe(true);
    });

    it("should not produce wrong splits (may unsplit)", async () => {
      const loaded = await ensureLexicon();
      if (!loaded) return;

      const errors: string[] = [];
      for (const tc of cases) {
        const result = split(tc.input);
        if (result.mei === "") continue; // unsplit is acceptable
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

    it("reports accuracy", async () => {
      const loaded = await ensureLexicon();
      if (!loaded) return;

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
