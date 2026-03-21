import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

/**
 * Read a CSV file line by line, yielding parsed fields.
 * Handles basic CSV (no quoted fields with commas inside).
 */
export async function* readCsvLines(
  filePath: string,
  delimiter = ","
): AsyncGenerator<string[]> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    yield line.split(delimiter);
  }
}

/**
 * Read a TSV file line by line, yielding parsed fields.
 */
export async function* readTsvLines(
  filePath: string
): AsyncGenerator<string[]> {
  yield* readCsvLines(filePath, "\t");
}
