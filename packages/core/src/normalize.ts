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
  return /^[\u30A1-\u30F6\u30FC]+$/.test(str);
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
