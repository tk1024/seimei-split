import { createFileRoute, Link } from "@tanstack/react-router";
import { sampleCategories } from "../lib/samples";

export const Route = createFileRoute("/samples")({
  component: SamplesPage,
});

function SamplesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">サンプル</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        テストデータからカテゴリ別にサンプルを表示しています。クリックすると Playground で結果を確認できます。
      </p>

      <div className="space-y-8">
        {sampleCategories.map((category) => (
          <div key={category.id}>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-lg font-bold">{category.label}</h2>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{category.description}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {category.samples.map((sample) => (
                <Link
                  key={sample.input}
                  to="/"
                  search={{ name: sample.input }}
                  className="rounded-lg p-3 border transition-colors group"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="font-medium text-sm group-hover:underline" style={{ color: "var(--accent)" }}>
                    {sample.input}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {sample.sei} / {sample.mei}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
