import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { loadSeimei, split, analyze, isLoaded } from "../lib/seimei";

interface SearchParams {
  name?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: PlaygroundPage,
});

function PlaygroundPage() {
  const { name: queryName } = Route.useSearch();
  const [input, setInput] = useState(queryName || "田中太郎");
  const [allowLowConfidence, setAllowLowConfidence] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ sei: string; mei: string } | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<{
    best: { sei: string; mei: string };
    confidence: number;
    candidates: { sei: string; mei: string; score: number; seiMatch: string; meiMatch: string }[];
  } | null>(null);

  useEffect(() => {
    loadSeimei().then(() => setLoading(false));
  }, []);

  const runAnalysis = useCallback(() => {
    if (!isLoaded() || !input.trim()) {
      setResult(null);
      setAnalyzeResult(null);
      return;
    }
    try {
      const r = split(input.trim(), { allowLowConfidence });
      const a = analyze(input.trim(), { allowLowConfidence });
      setResult(r);
      setAnalyzeResult(a);
    } catch {
      setResult(null);
      setAnalyzeResult(null);
    }
  }, [input, allowLowConfidence]);

  useEffect(() => {
    if (!loading) runAnalysis();
  }, [loading, runAnalysis]);

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
          日本語の氏名を入力すると、リアルタイムで姓名分割の結果を表示します
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>入力</h2>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="氏名を入力（例: 田中太郎）"
            className="w-full px-4 py-3 rounded-lg border text-lg outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm" style={{ color: "var(--text-secondary)" }}>
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
            allowLowConfidence
          </label>
        </div>

        {/* Result */}
        <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>split() の結果</h2>
          {result ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>姓 (sei)</div>
                  <div className="text-2xl font-bold">{result.sei || "---"}</div>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>名 (mei)</div>
                  <div className="text-2xl font-bold">{result.mei || "---"}</div>
                </div>
              </div>
              {analyzeResult && (
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>信頼度 (confidence)</div>
                  <div className="text-xl font-bold font-mono">{analyzeResult.confidence.toFixed(2)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
              氏名を入力してください
            </div>
          )}
        </div>
      </div>

      {/* Candidates */}
      {analyzeResult && analyzeResult.candidates.length > 0 && (
        <div className="mt-6 rounded-xl p-6 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
            analyze() の候補一覧
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>姓</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>名</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>スコア</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>姓マッチ</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-tertiary)" }}>名マッチ</th>
                </tr>
              </thead>
              <tbody>
                {analyzeResult.candidates.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: i === 0 ? (analyzeResult.confidence >= 6 ? "rgba(59,130,246,0.06)" : "transparent") : "transparent",
                    }}
                  >
                    <td className="py-2 px-3 font-medium">{c.sei}</td>
                    <td className="py-2 px-3 font-medium">{c.mei}</td>
                    <td className="py-2 px-3 font-mono" style={{ color: "var(--text-secondary)" }}>{c.score.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <MatchBadge type={c.seiMatch} />
                    </td>
                    <td className="py-2 px-3">
                      <MatchBadge type={c.meiMatch} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
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
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {type}
    </span>
  );
}
