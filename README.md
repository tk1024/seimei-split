# seimei-split

[日本語ドキュメント](README.ja.md)

Split Japanese full names into family name (sei) and given name (mei).

## Features

- Handles both space-delimited and non-delimited Japanese names
- Supports kanji, hiragana, and katakana
- Dictionary-based splitting using UniDic (bundled)
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

// Without bundled dictionary (bring your own)
import { split, setLexicon } from "seimei-split/core";
```

## How It Works

### Space-delimited input

If the input contains a space (half-width or full-width), it is split directly at the space boundary. No dictionary lookup is performed.

### Non-delimited input

For names without spaces (e.g. `田中太郎`), the library uses a dictionary-based scoring algorithm:

#### 1. Candidate enumeration

All possible split positions are enumerated. For `田中太郎` (4 characters):

| Split position | Surname | Given name |
|---|---|---|
| 1 | 田 | 中太郎 |
| 2 | 田中 | 太郎 |
| 3 | 田中太 | 郎 |

The maximum split position is capped at `maxSeiLen` (11 characters in the bundled dictionary).

#### 2. Dictionary matching

Each candidate's surname and given name parts are looked up in the dictionary. Three match levels exist:

| Match type | Score | Description |
|---|---|---|
| `surface` | 4.0 | Exact match in the dictionary |
| `folded` | 2.5 | Match after kanji variant folding (e.g. 齋藤 → 斎藤) |
| `reading` | 1.0 | Kana input matches a known reading (requires optional reading data) |
| `none` | 0 | No match |

#### 3. Scoring

Each candidate is scored as:

```
score = matchScore(sei) + matchScore(mei) + lengthScore(sei) + lengthScore(mei) + pairBonus
```

- **matchScore**: Dictionary match score (see table above)
- **lengthScore**: Small bonus/penalty based on character count. 2-character names score highest (+0.5), uncommon lengths (5+) are penalized (-0.2 to -0.4)
- **pairBonus**: +0.8 if both surname and given name match the dictionary
- **Constraints**: 1-character surnames require a dictionary hit; otherwise the candidate is rejected

#### 4. Confidence threshold

The best candidate is accepted if:
- `score >= 6.0` (confidence threshold)
- `bestScore - secondBestScore >= 1.0` (sufficient gap)

If the threshold is not met, the name is returned unsplit. Use `allowLowConfidence: true` to get best-effort results regardless.

### Kanji variant folding

Old/variant kanji forms are automatically mapped to modern equivalents for matching:

齋→斎, 齊→斉, 邊→辺, 濱→浜, 﨑→崎, 髙→高, 德→徳, 廣→広, 嶋→島, 國→国, 澤→沢, 櫻→桜, 龍→竜, etc.

## Dictionary

The bundled dictionary is derived from [UniDic](https://clrd.ninjal.ac.jp/unidic/) (現代書き言葉UniDic), filtering for personal name entries (`名詞,固有名詞,人名,{姓|名}`).

| | Count |
|---|---|
| Surnames (姓) | 18,364 |
| Given names (名) | 37,084 |
| Variant kanji mappings | 1,002 |
| Reading entries (optional) | 25,742 |

## Bundle Size

| Entry point | Raw | gzip |
|---|---|---|
| `seimei-split` (dictionary bundled) | 458 KB | 213 KB |
| `seimei-split/core` (no dictionary) | 3.5 KB | 1.6 KB |

Reading data for kana input matching is tree-shaken out by default. Import and call `setReading()` to enable it.

## Status

> This project is under active development.

| Dataset | Accuracy |
|---|---|
| MVP (208 names) | 94.7% correct, 0% wrong split, 5.3% unsplit |

## Data Sources & Licenses

Dictionary data is derived from **UniDic** (National Institute for Japanese Language and Linguistics) under BSD 3-Clause license.

See `LICENSES/` directory for full license texts and attribution.

## Development

```bash
npm install

# Generate dictionary data (requires UniDic in internal/vendor/)
npm run generate:data

# Build
npm run build

# Test
npm run test

# Evaluate accuracy
npm run eval
```

## License

Code: [MIT](LICENSE) | Dictionary data: [BSD 3-Clause](LICENSES/BSD-3-Clause-Unidic.txt)

See [LICENSES/README.md](LICENSES/README.md) for details.
