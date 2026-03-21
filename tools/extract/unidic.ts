import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { normalizeReading, normalizeSurface } from "../shared/normalize.js";
import type { ExtractedEntry, NameKind } from "../shared/types.js";
import { SOURCE_FLAGS } from "../shared/types.js";

const LEX_CSV_PATH = "vendor/src/unidic/current/lex.csv";
const OUTPUT_PATH = "tmp/extracted/unidic.tsv";

// UniDic lex.csv column indices
const COL = {
  SURFACE: 0,
  POS1: 4,    // 名詞
  POS2: 5,    // 固有名詞
  POS3: 6,    // 人名
  POS4: 7,    // 姓 / 名
  READING: 10,
  PRON: 11,
  ORTH_BASE: 12,
  ORTH: 14,
} as const;

async function extract(): Promise<void> {
  const entries: ExtractedEntry[] = [];

  const rl = createInterface({
    input: createReadStream(LEX_CSV_PATH, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    const cols = line.split(",");
    if (cols.length < 15) continue;

    // Filter: 名詞,固有名詞,人名,{姓|名}
    if (
      cols[COL.POS1] !== "名詞" ||
      cols[COL.POS2] !== "固有名詞" ||
      cols[COL.POS3] !== "人名"
    ) {
      continue;
    }

    const pos4 = cols[COL.POS4];
    let kind: NameKind;
    if (pos4 === "姓") {
      kind = "sei";
    } else if (pos4 === "名") {
      kind = "mei";
    } else {
      continue;
    }

    const surface = normalizeSurface(cols[COL.SURFACE]);
    const reading = normalizeReading(cols[COL.READING] || cols[COL.PRON] || "");
    const normalized = cols[COL.ORTH_BASE] || cols[COL.ORTH] || surface;

    if (!surface) continue;

    entries.push({
      kind,
      surface,
      reading,
      normalized,
      source: "unidic",
      sourceId: `unidic:line=${lineNum}`,
      sourceFlags: SOURCE_FLAGS.UNIDIC,
    });
  }

  // Deduplicate by kind + surface + reading
  const seen = new Set<string>();
  const deduped: ExtractedEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.kind}\t${entry.surface}\t${entry.reading}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(entry);
    }
  }

  // Write TSV
  mkdirSync("tmp/extracted", { recursive: true });
  const header = "kind\tsurface\treading\tnormalized\tsource\tsource_id\tsource_flags";
  const lines = deduped.map(
    (e) =>
      `${e.kind}\t${e.surface}\t${e.reading}\t${e.normalized}\t${e.source}\t${e.sourceId}\t${e.sourceFlags}`
  );
  writeFileSync(OUTPUT_PATH, [header, ...lines].join("\n") + "\n", "utf-8");

  const seiCount = deduped.filter((e) => e.kind === "sei").length;
  const meiCount = deduped.filter((e) => e.kind === "mei").length;
  console.log(`Extracted ${deduped.length} entries (sei: ${seiCount}, mei: ${meiCount})`);
  console.log(`Written to ${OUTPUT_PATH}`);
}

extract().catch((err) => {
  console.error(err);
  process.exit(1);
});
