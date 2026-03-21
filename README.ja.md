# seimei-split

日本人のフルネームを姓（sei）と名（mei）に分離するライブラリです。

## 特徴

- スペース区切り・スペースなしの両方に対応
- 漢字・ひらがな・カタカナに対応
- UniDic辞書同梱
- ESM / CJS デュアルパブリッシュ
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

// 辞書なし版（独自辞書を使う場合）
import { split, setLexicon } from "seimei-split/core";
```

## 仕組み

スペースなしの名前に対して、全ての分割位置を列挙し、各候補をスコアリングします:

- **辞書照合** - 姓・名として辞書に存在するか
- **文字数ヒューリスティクス** - よくある姓名の文字数を優遇
- **ペアボーナス** - 姓名両方が辞書に一致すると加点

信頼度閾値を超えた最高スコアの分割を返します。

## 開発状況

| データセット | 精度 |
|---|---|
| MVP（208件） | 正解94.7%, 誤分割0%, unsplit 5.3% |

## ライセンス

コード: [MIT](LICENSE) | 辞書データ: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

詳細は [LICENSES/README.md](LICENSES/README.md) を参照。
