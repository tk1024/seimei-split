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
// => { best: { sei: "田中", mei: "太郎" }, confidence: 1.0, reason: "dictionary", candidates: [...] }

// Reading data lets all-kana names be split (off by default)
// Ordinary katakana words such as アメリカ may also split, so use it only for name input
import { setReading } from "seimei-split";
import { reading } from "seimei-split/reading";
setReading(reading);
split("はいだしょうこ"); // => { sei: "はいだ", mei: "しょうこ" }

// Without bundled dictionary (bring your own)
import { split, setLexicon } from "seimei-split/core";
```

`confidence` is always between 0 and 1, and `reason` says why the name was or was not split.

| `confidence` | Meaning | `reason` |
|---|---|---|
| 1 | Whitespace, or strong dictionary evidence | `space` / `dictionary` |
| 0.8 | Script boundary, or the katakana surname rule | `boundary` / `katakana-sei` |
| 0.75 | Surname in the dictionary, and the given name is not but looks like one | `sei-match` |
| 0.7 | One side matched as written, the other only by reading (with reading data) | `reading` |
| 0.01–0.7 | Best guess from `allowLowConfidence` | `low-confidence` |
| 0 | Not split | `not-full-name` / `insufficient` / `no-candidate` / `no-dictionary` |

## How It Works

### Space-delimited input

If the input contains a space (half-width or full-width), it is split directly at the space boundary.

### Non-delimited input

For names without spaces, the library uses a dictionary-based scoring algorithm:

1. **Candidate enumeration** — all possible split positions
2. **Dictionary matching** — surface (4.0), folded (2.5), reading (1.0), none (0)
3. **Scoring** — `matchScore + seiHitBonus + lengthScore + pairBonus + boundaryScore + seiShapePenalty + singleCharPenalty + positionScore`
4. **Confidence threshold** — `score >= 6.0` and `gap >= 1.0` with both sides in the dictionary or a script boundary (confidence 0.7 when one side matched only by reading); a surname-only match with a name-like given name is accepted at confidence 0.75
5. **Exception flows** — katakana surname detection, kanji variant folding

## Status

Accuracy is measured across 12 categories (369 names and 76 non-name inputs).

| Category | Normal | allowLowConfidence |
|---|---|---|
| MVP (208 names) | 97.1% | 99.5% |
| Kanji surname + hiragana | 100% | 100% |
| Kanji surname + katakana | 100% | 100% |
| Kana surname + kanji | 87.5% | 100% |
| VTuber names | 6.7% | 93.3% |
| Single-char surname | 92.3% | 92.3% |
| 3+ char surname | 83.3% | 100% |
| Variant kanji | 100% | 100% |
| ノ・ヶ・々 in surname | 90.9% | 100% |
| All kana | 86.7% | 100% |
| Mixed kana in name | 100% | 100% |
| Ambiguous splits | 90.9% | 100% |

**Zero wrong splits across all categories.**

## License

Code: [MIT](LICENSE) | Dictionary data: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

See [LICENSES/README.md](LICENSES/README.md) for details.
