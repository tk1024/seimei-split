import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { loadSeimei, split, analyze, isLoaded } from "../lib/seimei";
import { sampleCategories } from "../lib/samples";

interface SearchParams {
  name?: string;
}

interface LineResult {
  input: string;
  result: { sei: string; mei: string };
  analyzeResult: {
    best: { sei: string; mei: string };
    confidence: number;
    candidates: { sei: string; mei: string; score: number; seiMatch: string; meiMatch: string }[];
  };
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: PlaygroundPage,
});

const DEFAULT_INPUT = `田中太郎
佐藤花子
綾瀬はるか
宝鐘マリン
ジャガー横田`;

function PlaygroundPage() {
  const { name: queryName } = Route.useSearch();
  const [input, setInput] = useState(queryName || DEFAULT_INPUT);
  const [allowLowConfidence, setAllowLowConfidence] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<LineResult[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);

  useEffect(() => {
    loadSeimei().then(() => setLoading(false));
  }, []);

  const runAnalysis = useCallback(() => {
    if (!isLoaded()) {
      setResults([]);
      return;
    }
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    const newResults: LineResult[] = [];
    for (const line of lines) {
      try {
        const r = split(line, { allowLowConfidence });
        const a = analyze(line, { allowLowConfidence });
        newResults.push({ input: line, result: r, analyzeResult: a });
      } catch {
        // skip
      }
    }
    setResults(newResults);
  }, [input, allowLowConfidence]);

  useEffect(() => {
    if (!loading) runAnalysis();
  }, [loading, runAnalysis]);

  const loadSample = (categoryId: string) => {
    const cat = sampleCategories.find((c) => c.id === categoryId);
    if (cat) {
      setInput(cat.samples.map((s) => s.input).join("\n"));
      setExpandedIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center" style={{ color: "var(--text-secondary)" }}>
        辞書データを読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Playground</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          日本語の氏名を入力すると、リアルタイムで姓名分割の結果を表示します（1行に1名）
        </p>
      </div>

      {/* Sample buttons */}
      <div className="mb-4">
        <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>サンプル</div>
        <div className="flex flex-wrap gap-2">
          {sampleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => loadSample(cat.id)}
              className="sample-btn px-3 py-1.5 rounded-lg border text-xs"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>入力</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--text-secondary)" }}>
            <div
              onClick={() => setAllowLowConfidence(!allowLowConfidence)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                allowLowConfidence ? "bg-blue-500" : ""
              }`}
              style={{ backgroundColor: allowLowConfidence ? undefined : "var(--border)" }}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  allowLowConfidence ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span>allowLowConfidence</span>
            </label>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              辞書未収録でもベストエフォートで分離
            </span>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"氏名を入力（1行に1名）\n例:\n田中太郎\n佐藤花子"}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border text-sm font-mono outline-none transition-colors resize-y"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => { setInput(""); setExpandedIndex(null); }}
            className="btn text-xs px-3 py-1 rounded border"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-tertiary)",
            }}
          >
            クリア
          </button>
        </div>
      </div>

      {/* Toolbar + Results */}
      {results.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>表示</span>
              <button onClick={() => setShowRaw(false)} className="btn text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: !showRaw ? "var(--bg-secondary)" : "transparent" }}>
                テーブル
              </button>
              <button onClick={() => setShowRaw(true)} className="btn text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: showRaw ? "var(--bg-secondary)" : "transparent" }}>
                テキスト
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>オプション</span>
              <button onClick={() => setShowConfidence(!showConfidence)} className="btn text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: showConfidence ? "var(--bg-secondary)" : "transparent" }}>
                信頼度
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>エクスポート</span>
              <button onClick={() => downloadFile(results, "tsv", showConfidence)} className="btn text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                TSV
              </button>
              <button onClick={() => downloadFile(results, "csv", showConfidence)} className="btn text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                CSV
              </button>
            </div>
          </div>

          {showRaw ? (
            <pre
              className="rounded-xl border p-4 text-xs font-mono overflow-x-auto whitespace-pre"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {showConfidence ? toTsv(results) : toTsvNoConf(results)}
            </pre>
          ) : (
            <div className="rounded-xl border overflow-x-auto" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b whitespace-nowrap" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-tertiary)" }}>入力</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-tertiary)" }}>姓 (sei)</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-tertiary)" }}>名 (mei)</th>
                    {showConfidence && <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-tertiary)" }}>信頼度</th>}
                    <th className="py-3 px-4 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <ResultRow
                      key={`${r.input}-${i}`}
                      lineResult={r}
                      expanded={expandedIndex === i}
                      onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                      showConfidence={showConfidence}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function toTsv(results: LineResult[]): string {
  const header = "input\tsei\tmei\tconfidence";
  const rows = results.map((r) =>
    `${r.input}\t${r.result.sei}\t${r.result.mei}\t${r.analyzeResult.confidence.toFixed(2)}`
  );
  return [header, ...rows].join("\n");
}

function toTsvNoConf(results: LineResult[]): string {
  const header = "input\tsei\tmei";
  const rows = results.map((r) => `${r.input}\t${r.result.sei}\t${r.result.mei}`);
  return [header, ...rows].join("\n");
}

function toCsv(results: LineResult[], includeConf: boolean): string {
  const header = includeConf ? "input,sei,mei,confidence" : "input,sei,mei";
  const rows = results.map((r) =>
    includeConf
      ? `${r.input},${r.result.sei},${r.result.mei},${r.analyzeResult.confidence.toFixed(2)}`
      : `${r.input},${r.result.sei},${r.result.mei}`
  );
  return [header, ...rows].join("\n");
}

function downloadFile(results: LineResult[], format: "tsv" | "csv", includeConf: boolean) {
  const content = format === "tsv"
    ? (includeConf ? toTsv(results) : toTsvNoConf(results))
    : toCsv(results, includeConf);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seimei-split-results.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

function ResultRow({
  lineResult,
  expanded,
  onToggle,
  showConfidence,
}: {
  lineResult: LineResult;
  expanded: boolean;
  onToggle: () => void;
  showConfidence: boolean;
}) {
  const { input, result, analyzeResult } = lineResult;
  const unsplit = result.mei === "";

  return (
    <>
      <tr className="result-row border-b last:border-b-0 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
        <td className="py-3 px-4 font-mono">{input}</td>
        <td className="py-3 px-4 font-bold">{result.sei}</td>
        <td className="py-3 px-4 font-bold" style={unsplit ? { color: "var(--text-tertiary)" } : {}}>
          {result.mei || "---"}
        </td>
        {showConfidence && (
          <td className="py-3 px-4">
            <ConfidenceBadge confidence={analyzeResult.confidence} />
          </td>
        )}
        <td className="py-3 px-4">
          {analyzeResult.candidates.length > 0 && (
            <button
              onClick={onToggle}
              className="detail-btn text-xs px-2 py-1 rounded border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backgroundColor: expanded ? "var(--bg-secondary)" : "transparent",
              }}
            >
              {expanded ? "閉じる" : "詳細"}
            </button>
          )}
        </td>
      </tr>
      {expanded && analyzeResult.candidates.length > 0 && (
        <tr>
          <td colSpan={5} className="px-4 pb-4">
            <div className="rounded-lg border overflow-x-auto mt-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>#</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>姓</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>名</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>スコア</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>姓マッチ</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>名マッチ</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzeResult.candidates.map((c, j) => (
                    <tr
                      key={j}
                      className="border-b last:border-b-0"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: j === 0 ? "rgba(59,130,246,0.05)" : "transparent",
                      }}
                    >
                      <td className="py-1.5 px-3 font-mono" style={{ color: "var(--text-tertiary)" }}>{j + 1}</td>
                      <td className="py-1.5 px-3 font-medium">{c.sei}</td>
                      <td className="py-1.5 px-3 font-medium">{c.mei}</td>
                      <td className="py-1.5 px-3 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.score === null || c.score === -Infinity ? "-∞" : c.score.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-3"><MatchBadge type={c.seiMatch} /></td>
                      <td className="py-1.5 px-3"><MatchBadge type={c.meiMatch} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let bg: string, text: string;
  if (confidence >= 1.0) {
    bg = "rgba(34,197,94,0.1)"; text = "#22c55e";
  } else if (confidence >= 0.8) {
    bg = "rgba(59,130,246,0.1)"; text = "#3b82f6";
  } else if (confidence > 0) {
    bg = "rgba(234,179,8,0.1)"; text = "#eab308";
  } else {
    bg = "rgba(148,163,184,0.1)"; text = "#94a3b8";
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ backgroundColor: bg, color: text }}>
      {confidence.toFixed(2)}
    </span>
  );
}

function MatchBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    surface: { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
    folded: { bg: "rgba(234,179,8,0.1)", text: "#eab308" },
    reading: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
    none: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8" },
  };
  const c = colors[type] || colors.none;
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {type}
    </span>
  );
}
