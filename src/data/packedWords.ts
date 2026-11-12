/**
 * Compact form of a word list. Grouping words by length removes the need for
 * delimiters: index + 1 is the length in code points of every word in a group.
 * Sorting puts words with a shared prefix next to each other, which is where
 * most of the gzip and brotli savings come from.
 */
export function packWords(words: string[]): string[] {
  const groups: string[][] = [];
  for (const word of words) {
    (groups[[...word].length - 1] ??= []).push(word);
  }
  return Array.from(groups, (group = []) => group.sort().join(""));
}

export function unpackWords(groups: string[]): string[] {
  return groups.flatMap((group, index) => group.match(new RegExp(`.{${index + 1}}`, "gsu")) ?? []);
}
