import { readFileSync } from "node:fs";
import { split, setLexicon } from "../../packages/core/src/splitter.js";
import { lexicon } from "../../packages/data-unidic/src/generated/lexicon.js";

interface TestCase {
  input: string;
  sei: string;
  mei: string;
}

interface EvalResult {
  total: number;
  correct: number;
  wrong: number;
  unsplit: number;
  accuracy: number;
  wrongRate: number;
  unsplitRate: number;
  errors: { input: string; expected: string; got: string }[];
}

function loadGold(path: string): TestCase[] {
  const content = readFileSync(path, "utf-8");
  const lines = content.trim().split("\n");
  return lines.slice(1).map((line) => {
    const [input, sei, mei] = line.split("\t");
    return { input, sei: sei ?? "", mei: mei ?? "" };
  });
}

function evaluate(cases: TestCase[]): EvalResult {
  let correct = 0;
  let wrong = 0;
  let unsplit = 0;
  const errors: EvalResult["errors"] = [];

  for (const tc of cases) {
    // Skip single-name entries (no expected split)
    if (!tc.mei) {
      continue;
    }

    const result = split(tc.input);
    const expected = `${tc.sei} / ${tc.mei}`;
    const got = `${result.sei} / ${result.mei}`;

    if (result.sei === tc.sei && result.mei === tc.mei) {
      correct++;
    } else if (result.mei === "") {
      unsplit++;
      errors.push({ input: tc.input, expected, got });
    } else {
      wrong++;
      errors.push({ input: tc.input, expected, got });
    }
  }

  const total = correct + wrong + unsplit;
  return {
    total,
    correct,
    wrong,
    unsplit,
    accuracy: total > 0 ? correct / total : 0,
    wrongRate: total > 0 ? wrong / total : 0,
    unsplitRate: total > 0 ? unsplit / total : 0,
    errors,
  };
}

function main(): void {
  setLexicon(lexicon);

  const goldFiles = [
    "eval/gold/mvp.tsv",
  ];

  for (const file of goldFiles) {
    console.log(`\n=== ${file} ===`);
    const cases = loadGold(file);
    const result = evaluate(cases);

    console.log(`Total:    ${result.total}`);
    console.log(`Correct:  ${result.correct} (${(result.accuracy * 100).toFixed(1)}%)`);
    console.log(`Wrong:    ${result.wrong} (${(result.wrongRate * 100).toFixed(1)}%)`);
    console.log(`Unsplit:  ${result.unsplit} (${(result.unsplitRate * 100).toFixed(1)}%)`);

    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      for (const err of result.errors) {
        console.log(`  ${err.input}: expected [${err.expected}] got [${err.got}]`);
      }
    }
  }
}

main();
