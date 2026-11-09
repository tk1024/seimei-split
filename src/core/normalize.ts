/**
 * Convert hiragana to katakana for reading-based lookup.
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * Check if a string is all hiragana.
 */
export function isAllHiragana(str: string): boolean {
  return /^[\u3041-\u3096\u30FC]+$/.test(str);
}

/**
 * Check if a string is all katakana.
 */
export function isAllKatakana(str: string): boolean {
  return str !== "" && [...str].every((ch) => scriptOf(ch) === "T");
}

/**
 * Check if a string contains characters that indicate a non-Japanese name
 * (alphabetic, digits, middle dot, comma).
 */
export function isNonJapanese(str: string): boolean {
  return /[a-zA-Zａ-ｚＡ-Ｚ0-9０-９・,，]/.test(str);
}

/**
 * Kanji variant folding map.
 */
const VARIANT_MAP: Record<string, string> = {
  "齋": "斎", "齊": "斉", "邊": "辺", "邉": "辺",
  "濱": "浜", "﨑": "崎", "髙": "高", "德": "徳",
  "廣": "広", "嶋": "島", "國": "国", "澤": "沢",
  "櫻": "桜", "龍": "竜", "與": "与", "藏": "蔵",
  "條": "条", "圓": "円",
};

/** K: kanji (including 々〆ヶヵ), H: hiragana, T: katakana, O: other */
type ScriptType = "K" | "H" | "T" | "O";

const RE_KANJI = /[\p{Script=Han}々〆ヶヵ]/u;
const RE_HIRAGANA = /[\u3041-\u3096]/;
const RE_KATAKANA = /[\u30A1-\u30F4\u30FC]/;

export function scriptOf(ch: string): ScriptType {
  if (RE_KANJI.test(ch)) return "K";
  if (RE_HIRAGANA.test(ch)) return "H";
  if (RE_KATAKANA.test(ch)) return "T";
  return "O";
}

/**
 * Find the split position where a single script boundary occurs
 * between kanji and kana (in either direction).
 * Returns the character index and direction, or undefined if no unique boundary exists.
 *
 * Examples:
 *   "夏色まつり" → { index: 2, direction: "kanji-to-kana" }
 *   "白銀ノエル" → { index: 2, direction: "kanji-to-kana" }
 *   "デーモン閣下" → { index: 4, direction: "kana-to-kanji" }
 *   "もこ田めめめ" → undefined (2 transitions)
 *   "田中太郎" → undefined (all kanji, no transition)
 */
export interface ScriptBoundary {
  index: number;
  direction: "kanji-to-kana" | "kana-to-kanji";
}

export function findSingleScriptBoundary(fullName: string): ScriptBoundary | undefined {
  const chars = [...fullName];
  let transitionCount = 0;
  let splitIndex: number | undefined;
  let fromScript: ScriptType | undefined;
  let toScript: ScriptType | undefined;

  for (let i = 1; i < chars.length; i++) {
    const prev = scriptOf(chars[i - 1]);
    const next = scriptOf(chars[i]);
    if (prev === next) continue;
    if (prev === "O" || next === "O") return undefined;
    transitionCount++;
    if (transitionCount > 1) return undefined;
    splitIndex = i;
    fromScript = prev;
    toScript = next;
  }

  if (transitionCount !== 1 || splitIndex === undefined) return undefined;

  const fromIsKanji = fromScript === "K";
  const toIsKanji = toScript === "K";
  const fromIsKana = fromScript === "H" || fromScript === "T";
  const toIsKana = toScript === "H" || toScript === "T";

  if (fromIsKanji && toIsKana) {
    return { index: splitIndex, direction: "kanji-to-kana" };
  }
  if (fromIsKana && toIsKanji) {
    return { index: splitIndex, direction: "kana-to-kanji" };
  }

  return undefined;
}

/**
 * Fold variant kanji to their canonical forms.
 */
export function foldVariants(surface: string): string {
  let result = "";
  for (const ch of surface) {
    result += VARIANT_MAP[ch] ?? ch;
  }
  return result;
}
