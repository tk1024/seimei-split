# seimei-split

[日本語ドキュメント](README.ja.md)

Split Japanese full names into family name (sei) and given name (mei).

## Features

- Handles both space-delimited and non-delimited Japanese names
- Supports kanji, hiragana, and katakana
- Dictionary-based splitting using UniDic (bundled)
- ESM and CJS dual publish
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

For non-delimited names, the library enumerates all possible split positions and scores each candidate using:

- **Dictionary matching** - whether each part appears as a known surname or given name
- **Length heuristics** - common surname/given name lengths are favored
- **Pair bonus** - both parts matching the dictionary scores higher

The highest-scoring split above a confidence threshold is returned.

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
