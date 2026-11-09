# seimei-split

[English](README.en.md)

日本人のフルネームを姓（sei）と名（mei）に分離するライブラリです。

**[Playground](https://tk1024.github.io/seimei-split/)** で動作を試せます。

## 特徴

- スペース区切り・スペースなしの両方に対応
- 漢字・ひらがな・カタカナに対応
- UniDic 辞書同梱（姓 18,364件、名 37,084件）
- 文字種境界ヒューリスティックによる辞書未収録名の分離
- TypeScript ファーストクラスサポート

## インストール

```bash
npm install seimei-split
```

## 使い方

```typescript
// 辞書同梱版（推奨）
import { split } from "seimei-split";

split("田中 太郎");  // => { sei: "田中", mei: "太郎" }
split("田中太郎");   // => { sei: "田中", mei: "太郎" }

// 低信頼モード（辞書未収録でもベストエフォートで分離）
split("宝鐘マリン", { allowLowConfidence: true });
// => { sei: "宝鐘", mei: "マリン" }

// 候補一覧と信頼度を取得
import { analyze } from "seimei-split";
const result = analyze("田中太郎");
// => { best: { sei: "田中", mei: "太郎" }, confidence: 1.0, reason: "dictionary", candidates: [...] }

// 読みデータを読み込むと、全かなの氏名を分割できる（既定では無効）
// カタカナの一般語（アメリカ など）も分割されることがあるため、入力が氏名のときに使う
import { setReading } from "seimei-split";
import { reading } from "seimei-split/reading";
setReading(reading);
split("はいだしょうこ"); // => { sei: "はいだ", mei: "しょうこ" }

// 辞書なし版（独自辞書を使う場合）
import { split, setLexicon } from "seimei-split/core";
```

`confidence` は常に 0 以上 1 以下で、`reason` が分割した（しなかった）理由を示します。

| `confidence` | 意味 | `reason` |
|---|---|---|
| 1 | 空白区切り、または辞書の根拠が十分 | `space` / `dictionary` |
| 0.8 | 文字種境界、またはカタカナ姓の規則 | `boundary` / `katakana-sei` |
| 0.75 | 姓が辞書にあり、名は辞書にないが名らしい | `sei-match` |
| 0.7 | 片側は表記で一致し、もう片側は読みだけの一致（読みデータ有効時） | `reading` |
| 0.01〜0.7 | `allowLowConfidence` での推定 | `low-confidence` |
| 0 | 分割しない | `not-full-name` / `insufficient` / `no-candidate` / `no-dictionary` |

## 仕組み

### スペース区切りの入力

入力にスペース（半角・全角）が含まれる場合、スペース位置で直接分割します。辞書照合は行いません。

### スペースなしの入力

スペースなしの名前（例: `田中太郎`）に対しては、辞書ベースのスコアリングアルゴリズムを使用します。

#### 1. 候補列挙

全ての分割位置を列挙します。`田中太郎`（4文字）の場合:

| 分割位置 | 姓 | 名 |
|---|---|---|
| 1 | 田 | 中太郎 |
| 2 | 田中 | 太郎 |
| 3 | 田中太 | 郎 |

#### 2. 辞書照合

各候補の姓・名部分を辞書で照合します:

| マッチ種別 | スコア | 説明 |
|---|---|---|
| `surface` | 4.0 | 辞書に完全一致 |
| `folded` | 2.5 | 異体字変換後に一致（例: 齋藤 → 斎藤） |
| `reading` | 1.0 | かな入力が既知の読みに一致（オプション） |
| `none` | 0 | 一致なし |

#### 3. スコアリング

```
score = matchScore(姓) + matchScore(名) + seiHitBonus + lengthScore + pairBonus + boundaryScore + seiShapePenalty + singleCharPenalty + positionScore
```

- **matchScore**: 辞書マッチスコア（上表参照）
- **seiHitBonus**: 姓辞書ヒット時 +0.5（苗字は有限の既知セット）
- **lengthScore**: 文字数に基づく小さなボーナス/ペナルティ
- **pairBonus**: 姓名両方が辞書に一致すると +0.8
- **boundaryScore**: 文字種境界（漢字↔かな）での分割にボーナス、境界外しにペナルティ
- **seiShapePenalty**: 辞書未収録の姓にかなが混在する場合に減点
- **singleCharPenalty**: 文字種境界がなく、反対側に根拠のない 1 文字の辞書一致を -1.5
- **positionScore**: 文字種境界がない場合に、辞書にない側の先頭字・末尾字が姓と名のどちらに多いかを辞書から集計して加減点

#### 4. 信頼度閾値

姓名の両方が辞書にあるか文字種境界があり、最良候補が `score >= 6.0` かつ `bestScore - secondBestScore >= 1.0` の場合に採用。片側が読みだけの一致（読みデータ有効時）なら、同じ条件で信頼度 0.7 で採用します。ひらがな→漢字の境界で 2 文字以上の名が辞書にあれば、`score` が 6.0 に届かなくても 5.2 以上なら信頼度 0.8 で採用します。姓だけが辞書にある場合は、名が 2 文字以上、`score >= 4.5`、次点との差が 2.0 以上で、名の先頭字と末尾字の傾向が姓より名に近く、名が 3 文字以下で、全かなでなく、末尾が敬称や役職語でないときに信頼度 0.75 で採用します。それ以外は未分割で返します。`allowLowConfidence: true` でベストエフォートの結果を取得可能。

#### 5. 例外フロー

- **カタカナ姓**: 前半が全カタカナの場合（例: `ジャガー横田`）、芸名パターンとして後半を姓辞書で照合
- **異体字フォールディング**: 齋→斎, 髙→高, 濱→浜 等の旧字体を自動マッピング

## 辞書データ

同梱辞書は [UniDic](https://clrd.ninjal.ac.jp/unidic/)（現代書き言葉UniDic）から人名エントリを抽出したものです。

| | 件数 |
|---|---|
| 姓 | 18,364 |
| 名 | 37,084 |
| 異体字マッピング | 669 |
| 読みエントリ（オプション） | 26,289 |

## バンドルサイズ

| エントリポイント | 生サイズ | gzip |
|---|---|---|
| `seimei-split`（辞書同梱） | 460 KB | 216 KB |
| `seimei-split/core`（辞書なし） | 10 KB | 4.6 KB |
| `seimei-split/reading`（読みデータ） | 483 KB | 81 KB |

読みデータは別エントリなので、`seimei-split/reading` を import しない限りバンドルに含まれません。

## 開発状況

12カテゴリ 369件の氏名と、氏名でない入力 76件のテストデータで精度を計測しています。

| カテゴリ | 通常モード | allowLowConfidence |
|---|---|---|
| MVP（208件） | 97.1% | 99.5% |
| 漢字姓+ひらがな名 | 100% | 100% |
| 漢字姓+カタカナ名 | 100% | 100% |
| かな姓+漢字名 | 87.5% | 100% |
| VTuber名 | 6.7% | 93.3% |
| 1文字姓 | 92.3% | 92.3% |
| 3文字以上の姓 | 83.3% | 100% |
| 異体字・旧字体 | 100% | 100% |
| ノ・ヶ・々を含む姓 | 90.9% | 100% |
| 全ひらがな/全カタカナ | 86.7% | 100% |
| 名前内部にかな混在 | 100% | 100% |
| 分割が曖昧な名前 | 90.9% | 100% |

**全カテゴリで誤分割 0 件**。通常モードで unsplit になるケースは `allowLowConfidence: true` で改善されます。

## ライセンス

コード: [MIT](LICENSE) | 辞書データ: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

詳細は [LICENSES/README.md](LICENSES/README.md) を参照。
