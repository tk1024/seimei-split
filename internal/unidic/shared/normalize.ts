/**
 * Convert hiragana to katakana.
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * Normalize reading to full-width katakana.
 */
export function normalizeReading(reading: string): string {
  return hiraganaToKatakana(reading.trim());
}

/**
 * Trim whitespace and normalize full-width spaces.
 */
export function normalizeSurface(surface: string): string {
  return surface.trim();
}
