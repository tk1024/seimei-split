/**
 * Kanji variant folding map.
 * Maps old/variant forms to their simplified modern equivalents.
 */
export const VARIANT_MAP: Record<string, string> = {
  "齋": "斎",
  "齊": "斉",
  "邊": "辺",
  "邉": "辺",
  "濱": "浜",
  "﨑": "崎",
  "髙": "高",
  "德": "徳",
  "廣": "広",
  "嶋": "島",
  "國": "国",
  "澤": "沢",
  "櫻": "桜",
  "萩": "萩",
  "龍": "竜",
  "與": "与",
  "藏": "蔵",
  "驒": "駒",
  "條": "条",
  "圓": "円",
};

/**
 * Fold a surface string by replacing variant kanji with their canonical forms.
 */
export function foldVariants(surface: string): string {
  let result = "";
  for (const ch of surface) {
    result += VARIANT_MAP[ch] ?? ch;
  }
  return result;
}

/**
 * Check if a surface contains any variant kanji.
 */
export function hasVariants(surface: string): boolean {
  for (const ch of surface) {
    if (ch in VARIANT_MAP) return true;
  }
  return false;
}
