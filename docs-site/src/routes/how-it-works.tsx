import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/CodeBlock";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">仕組み</h1>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">概要</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          seimei-split は、日本語の氏名を姓と名に分割するライブラリです。
          スペース区切りの入力はそのまま分割し、スペースなしの入力には辞書ベースのスコアリングアルゴリズムを使用します。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">スコアリングアルゴリズム</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-2">1. 候補列挙</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              入力文字列の全ての分割位置を列挙します。例えば「田中太郎」（4文字）の場合:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>分割位置</th>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>姓</th>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>名</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">1</td><td className="py-2 px-3">田</td><td className="py-2 px-3">中太郎</td></tr>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">2</td><td className="py-2 px-3">田中</td><td className="py-2 px-3">太郎</td></tr>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">3</td><td className="py-2 px-3">田中太</td><td className="py-2 px-3">郎</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. 辞書照合</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              各候補の姓・名部分を辞書で照合します。3段階のマッチレベルがあります:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>マッチ種別</th>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>スコア</th>
                    <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>説明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 px-3 font-mono">surface</td>
                    <td className="py-2 px-3 font-mono">4.0</td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>辞書に完全一致</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 px-3 font-mono">folded</td>
                    <td className="py-2 px-3 font-mono">2.5</td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>異体字変換後に一致</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 px-3 font-mono">reading</td>
                    <td className="py-2 px-3 font-mono">1.0</td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>かな入力が既知の読みに一致</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 px-3 font-mono">none</td>
                    <td className="py-2 px-3 font-mono">0</td>
                    <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>一致なし</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. スコア計算</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              各候補のスコアを以下の式で算出します:
            </p>
            <CodeBlock>{`score = matchScore(姓) + matchScore(名) + lengthScore(姓) + lengthScore(名) + pairBonus`}</CodeBlock>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><strong className="font-semibold" style={{ color: "var(--text)" }}>matchScore:</strong> 辞書マッチスコア（上表参照）</li>
              <li><strong className="font-semibold" style={{ color: "var(--text)" }}>lengthScore:</strong> 文字数に基づくボーナス/ペナルティ。2文字が最高（+0.5）、5文字以上はペナルティ（-0.2 ~ -0.4）</li>
              <li><strong className="font-semibold" style={{ color: "var(--text)" }}>pairBonus:</strong> 姓名両方が辞書に一致すると +0.8</li>
              <li><strong className="font-semibold" style={{ color: "var(--text)" }}>制約:</strong> 1文字姓は辞書ヒット必須。ヒットしない場合は候補から除外</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. 信頼度閾値</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              最良候補が以下の条件を満たす場合に採用されます:
            </p>
            <ul className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>score &gt;= 6.0</code> - 信頼度閾値</li>
              <li><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>bestScore - secondBestScore &gt;= 1.0</code> - 十分な差</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              閾値を満たさない場合は未分割で返します。<code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>allowLowConfidence: true</code> を指定するとベストエフォートの結果を返します。
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">境界ヒューリスティック</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          スペース区切りの入力（半角・全角スペース）はスペース位置で直接分割されます。辞書照合は行われないため、高速に処理されます。
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          スペースなしの入力に対しては、文字種の変化も境界のヒントとして利用されます。
          例えば「漢字→ひらがな」「漢字→カタカナ」の変化点は、姓と名の境界として有力な候補になります。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">異体字フォールディング</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          旧字体・異体字は自動的に現代の標準字体にマッピングされて照合されます。これにより、異体字を含む名前でも正しく分割できます。
        </p>
        <div className="rounded-lg p-4 text-sm font-mono" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
          齋→斎, 齊→斉, 邊→辺, 濱→浜, 﨑→崎, 髙→高, 德→徳, 廣→広, 嶋→島, 國→国, 澤→沢, 櫻→桜, 龍→竜 ...
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          合計 1,002 件の異体字マッピングが含まれています。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">辞書データ</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          同梱辞書は <a href="https://clrd.ninjal.ac.jp/unidic/" target="_blank" rel="noopener" className="underline" style={{ color: "var(--accent)" }}>UniDic</a>（現代書き言葉UniDic）から人名エントリを抽出したものです。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>種別</th>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>件数</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">姓</td><td className="py-2 px-3 font-mono">18,364</td></tr>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">名</td><td className="py-2 px-3 font-mono">37,084</td></tr>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">異体字マッピング</td><td className="py-2 px-3 font-mono">1,002</td></tr>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}><td className="py-2 px-3">読みエントリ（オプション）</td><td className="py-2 px-3 font-mono">25,742</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">バンドルサイズ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>エントリポイント</th>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>生サイズ</th>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-tertiary)" }}>gzip</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 px-3 font-mono">seimei-split</td>
                <td className="py-2 px-3 font-mono">458 KB</td>
                <td className="py-2 px-3 font-mono">213 KB</td>
              </tr>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 px-3 font-mono">seimei-split/core</td>
                <td className="py-2 px-3 font-mono">3.5 KB</td>
                <td className="py-2 px-3 font-mono">1.6 KB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
