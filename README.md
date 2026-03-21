# seimei-split

Split Japanese full names into family name (sei) and given name (mei).

## Features

- Handles both space-delimited and non-delimited Japanese names
- Supports kanji, hiragana, and katakana
- Dictionary-based splitting using UniDic
- ESM and CJS dual publish
- Written in TypeScript with full type definitions

## Install

```bash
npm install @seimei-split/core @seimei-split/data-unidic
```

## Usage

```typescript
import { split } from "@seimei-split/core";

// Space-delimited
split("田中 太郎");
// => { sei: "田中", mei: "太郎" }

// Non-delimited (requires dictionary data, coming soon)
// split("田中太郎");
// => { sei: "田中", mei: "太郎" }
```

## Packages

| Package | Description |
|---|---|
| `@seimei-split/core` | Core splitting logic (no dictionary bundled) |
| `@seimei-split/data-unidic` | Dictionary derived from UniDic |
| `@seimei-split/frequency-plugin` | Frequency-based scoring plugin (planned) |

## How It Works

For non-delimited names, the library enumerates all possible split positions and scores each candidate using:

- **Dictionary matching** - whether each part appears as a known surname or given name
- **Source weight** - entries from higher-quality sources score higher
- **Length heuristics** - common surname/given name lengths are favored
- **Pair bonus** - both parts matching the dictionary scores higher

The highest-scoring split above a confidence threshold is returned.

## Status

> This project is under active development. The following are **target** accuracies, not yet validated.

| Dataset | Target Accuracy |
|---|---|
| Common names (2-char surname + 2-char given) | >= 97% |
| Kana names (hiragana / katakana) | >= 90% |
| Hard cases (1-char surname, 4+ char surname, variant kanji) | >= 80% |

## Data Sources & Licenses

Dictionary data is derived from the following open-source lexicons:

- **UniDic** (National Institute for Japanese Language and Linguistics) - GPL v2.0 / LGPL v2.1 / BSD 3-Clause triple license

See each data package's `LICENSES/` directory for full license texts and attribution.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Extract and build dictionary data
npm run dict:build

# Run accuracy evaluation
npm run eval
```

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

Code (`@seimei-split/core`, `@seimei-split/frequency-plugin`): [MIT](LICENSE)

Dictionary data packages: See respective `LICENSES/` directories.
