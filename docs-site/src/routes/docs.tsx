import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/CodeBlock";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ドキュメント</h1>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" id="install">インストール</h2>
        <CodeBlock>{`npm install seimei-split`}</CodeBlock>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" id="usage">基本的な使い方</h2>
        <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          辞書が同梱されているので、インポートするだけで使えます。
        </p>
        <CodeBlock>{`import { split } from "seimei-split";

split("田中太郎");    // => { sei: "田中", mei: "太郎" }
split("田中 太郎");   // => { sei: "田中", mei: "太郎" }
split("さとうはなこ"); // => { sei: "さとう", mei: "はなこ" }`}</CodeBlock>

        <p className="mt-4 mb-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          詳細な分析には <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-tertiary)" }}>analyze()</code> を使います。
        </p>
        <CodeBlock>{`import { analyze } from "seimei-split";

const result = analyze("田中太郎");
// result.best       => { sei: "田中", mei: "太郎" }
// result.confidence  => スコア値
// result.candidates  => 全候補の配列`}</CodeBlock>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" id="api">API リファレンス</h2>

        <div className="rounded-xl p-6 border mb-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold font-mono text-lg mb-2">split(name, options?)</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            氏名文字列を姓と名に分割します。
          </p>
          <div className="mb-3">
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>引数</div>
            <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>name: string</code> - 分割対象の氏名</li>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>options?: SplitOptions</code> - オプション</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>戻り値</div>
            <CodeBlock>{`interface SeimeiResult {
  sei: string;  // 姓（分割できない場合は空文字列）
  mei: string;  // 名（分割できない場合は空文字列）
}`}</CodeBlock>
          </div>
        </div>

        <div className="rounded-xl p-6 border mb-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold font-mono text-lg mb-2">analyze(name, options?)</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            氏名を分析し、信頼度スコアと全候補を返します。
          </p>
          <div className="mb-3">
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>引数</div>
            <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>name: string</code> - 分析対象の氏名</li>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>options?: SplitOptions</code> - オプション</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>戻り値</div>
            <CodeBlock>{`interface AnalyzeResult {
  best: SeimeiResult;          // 最良の分割結果
  confidence: number;          // 信頼度スコア
  candidates: SeimeiCandidate[]; // 全候補（スコア降順）
}

interface SeimeiCandidate {
  sei: string;
  mei: string;
  score: number;
  seiMatch: MatchType;  // "surface" | "folded" | "reading" | "none"
  meiMatch: MatchType;
}`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" id="options">オプション</h2>

        <div className="rounded-xl p-6 border mb-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold font-mono mb-2">allowLowConfidence</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            信頼度が低い場合でもベストエフォートの結果を返します。デフォルトは <code className="font-mono text-xs">false</code> です。
          </p>
          <CodeBlock>{`split("珍しい名前", { allowLowConfidence: true });`}</CodeBlock>
        </div>

        <div className="rounded-xl p-6 border mb-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold font-mono mb-2">setLexicon(lexicon)</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            カスタム辞書を設定します。<code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>seimei-split/core</code> からインポートした場合に使用します。
          </p>
          <CodeBlock>{`import { split, setLexicon } from "seimei-split/core";

setLexicon(myCustomLexicon);
split("田中太郎");`}</CodeBlock>
        </div>

        <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold font-mono mb-2">setReading(readingData)</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            かな入力用の読みデータを設定します。設定すると、ひらがな・カタカナ入力時の精度が向上します。
          </p>
          <CodeBlock>{`import { setReading } from "seimei-split";
import readingData from "./reading-data.json";

setReading(readingData);`}</CodeBlock>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" id="core">軽量版 (core)</h2>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          辞書を同梱しない軽量版（約 3.5 KB）を使う場合は、<code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>seimei-split/core</code> からインポートします。
        </p>
        <CodeBlock>{`import { split, setLexicon } from "seimei-split/core";

// 独自の辞書データを設定
setLexicon({
  sei: ["田中", "佐藤", ...],
  mei: ["太郎", "花子", ...],
  folded: { "齋": ["斎"], ... },
  maxSeiLen: 11,
  maxMeiLen: 11,
});

split("田中太郎"); // => { sei: "田中", mei: "太郎" }`}</CodeBlock>
      </section>
    </div>
  );
}
