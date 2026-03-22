# seimei-split

[日本語](README.md)

Split Japanese full names into family name (sei) and given name (mei).

Try it on the **[Playground](https://tk1024.github.io/seimei-split/)**.

## Features

- Handles both space-delimited and non-delimited Japanese names
- Supports kanji, hiragana, and katakana
- Bundled UniDic dictionary (18,364 surnames, 37,084 given names)
- Script boundary heuristics for names not in the dictionary
- Written in TypeScript with full type definitions

## Install

```bash
npm install seimei-split
```

## Usage

```typescript
// With bundled dictionary (recommended)
import { split } from "seimei-split";

split("田中 太郎");  // => { sei: "田中", mei: "太郎" }
split("田中太郎");   // => { sei: "田中", mei: "太郎" }

// Low confidence mode (best-effort for names not in dictionary)
split("宝鐘マリン", { allowLowConfidence: true });
// => { sei: "宝鐘", mei: "マリン" }

// Get candidates and confidence
import { analyze } from "seimei-split";
const result = analyze("田中太郎");
// => { best: { sei: "田中", mei: "太郎" }, confidence: 1.0, candidates: [...] }

// Without bundled dictionary (bring your own)
import { split, setLexicon } from "seimei-split/core";
```

## How It Works

### Space-delimited input

If the input contains a space (half-width or full-width), it is split directly at the space boundary.

### Non-delimited input

For names without spaces, the library uses a dictionary-based scoring algorithm:

1. **Candidate enumeration** — all possible split positions
2. **Dictionary matching** — surface (4.0), folded (2.5), reading (1.0), none (0)
3. **Scoring** — `matchScore + seiHitBonus + lengthScore + pairBonus + boundaryScore + seiShapePenalty`
4. **Confidence threshold** — `score >= 6.0` and `gap >= 1.0`
5. **Exception flows** — katakana surname detection, kanji variant folding

## Status

Accuracy is measured across 12 categories (339 test cases).

| Category | Normal | allowLowConfidence |
|---|---|---|
| MVP (208 names) | 94.7% | 99.5% |
| Kanji surname + hiragana | 100% | 100% |
| Kanji surname + katakana | 100% | 100% |
| Kana surname + kanji | 87.5% | 100% |
| VTuber names | 6.7% | 93.3% |
| Single-char surname | 92.3% | 100% |
| 3+ char surname | 75.0% | 100% |
| Variant kanji | 86.7% | 100% |
| ノ・ヶ・々 in surname | 81.8% | 100% |
| All kana | 86.7% | 100% |
| Mixed kana in name | 70.0% | 100% |
| Ambiguous splits | 80.0% | 100% |

**Zero wrong splits across all categories.**

## License

Code: [MIT](LICENSE) | Dictionary data: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

See [LICENSES/README.md](LICENSES/README.md) for details.
