# License Information

This package contains code under two licenses:

## Code — MIT License

All source code (`src/core/`, `src/index.ts`, `src/core.ts`) is licensed under the [MIT License](../LICENSE).

## Dictionary Data — BSD 3-Clause License

Dictionary data in `src/data/generated/` and `dist/` is derived from **UniDic** (現代書き言葉UniDic) by the National Institute for Japanese Language and Linguistics (NINJAL).

- **Source**: https://clrd.ninjal.ac.jp/unidic/
- **Version**: 202512
- **Extraction method**: Filtered `lex.csv` for entries with POS `名詞,固有名詞,人名,{姓|名}`
- **License**: BSD 3-Clause (selected from GPL-2.0 / LGPL-2.1 / BSD-3-Clause triple license)

See [BSD-3-Clause-Unidic.txt](./BSD-3-Clause-Unidic.txt) for the full license text.
