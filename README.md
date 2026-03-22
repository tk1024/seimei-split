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
// => { best: { sei: "田中", mei: "太郎" }, confidence: 1.0, candidates: [...] }

// 辞書なし版（独自辞書を使う場合）
import { split, setLexicon } from "seimei-split/core";
```

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
score = matchScore(姓) + matchScore(名) + seiHitBonus + lengthScore + pairBonus + boundaryScore + seiShapePenalty
```

- **matchScore**: 辞書マッチスコア（上表参照）
- **seiHitBonus**: 姓辞書ヒット時 +0.5（苗字は有限の既知セット）
- **lengthScore**: 文字数に基づく小さなボーナス/ペナルティ
- **pairBonus**: 姓名両方が辞書に一致すると +0.8
- **boundaryScore**: 文字種境界（漢字↔かな）での分割にボーナス、境界外しにペナルティ
- **seiShapePenalty**: 辞書未収録の姓にかなが混在する場合に減点

#### 4. 信頼度閾値

最良候補が `score >= 6.0` かつ `bestScore - secondBestScore >= 1.0` の場合に採用。閾値未満は未分割で返します。`allowLowConfidence: true` でベストエフォートの結果を取得可能。

#### 5. 例外フロー

- **カタカナ姓**: 前半が全カタカナの場合（例: `ジャガー横田`）、芸名パターンとして後半を姓辞書で照合
- **異体字フォールディング**: 齋→斎, 髙→高, 濱→浜 等の旧字体を自動マッピング

## 辞書データ

同梱辞書は [UniDic](https://clrd.ninjal.ac.jp/unidic/)（現代書き言葉UniDic）から人名エントリを抽出したものです。

| | 件数 |
|---|---|
| 姓 | 18,364 |
| 名 | 37,084 |
| 異体字マッピング | 1,002 |
| 読みエントリ（オプション） | 25,742 |

## バンドルサイズ

| エントリポイント | 生サイズ | gzip |
|---|---|---|
| `seimei-split`（辞書同梱） | 463 KB | 216 KB |
| `seimei-split/core`（辞書なし） | 4.5 KB | 1.8 KB |

読みデータはデフォルトで tree shaking により除外されます。

## 開発状況

12カテゴリ 339件のテストデータで精度を計測しています。

| カテゴリ | 通常モード | allowLowConfidence |
|---|---|---|
| MVP（208件） | 94.7% | 99.5% |
| 漢字姓+ひらがな名 | 100% | 100% |
| 漢字姓+カタカナ名 | 100% | 100% |
| かな姓+漢字名 | 87.5% | 100% |
| VTuber名 | 6.7% | 93.3% |
| 1文字姓 | 92.3% | 100% |
| 3文字以上の姓 | 75.0% | 100% |
| 異体字・旧字体 | 86.7% | 100% |
| ノ・ヶ・々を含む姓 | 81.8% | 100% |
| 全ひらがな/全カタカナ | 86.7% | 100% |
| 名前内部にかな混在 | 70.0% | 100% |
| 分割が曖昧な名前 | 80.0% | 100% |

**全カテゴリで誤分割 0 件**。通常モードで unsplit になるケースは `allowLowConfidence: true` で改善されます。

## ライセンス

コード: [MIT](LICENSE) | 辞書データ: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

詳細は [LICENSES/README.md](LICENSES/README.md) を参照。
