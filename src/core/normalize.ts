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
  // Old character forms (kyujitai) that appear in the bundled dictionary.
  // Other variants that are not old forms, such as 冨/富 or 峯/峰, stay out.
  "亞": "亜", "爲": "為", "醫": "医", "壹": "壱", "稻": "稲", "隱": "隠", "榮": "栄", "衞": "衛",
  "驛": "駅", "艷": "艶", "鹽": "塩", "奧": "奥", "應": "応", "假": "仮", "會": "会", "懷": "懐",
  "覺": "覚", "學": "学", "嶽": "岳", "樂": "楽", "勸": "勧", "卷": "巻", "寬": "寛", "歡": "歓",
  "觀": "観", "關": "関", "巖": "巌", "氣": "気", "龜": "亀", "擧": "挙", "挾": "挟", "狹": "狭",
  "曉": "暁", "勳": "勲", "惠": "恵", "溪": "渓", "經": "経", "繼": "継", "莖": "茎", "螢": "蛍",
  "鷄": "鶏", "藝": "芸", "劍": "剣", "權": "権", "縣": "県", "顯": "顕", "嚴": "厳", "恆": "恒",
  "鑛": "鉱", "濟": "済", "碎": "砕", "雜": "雑", "參": "参", "絲": "糸", "兒": "児", "實": "実",
  "舍": "舎", "壽": "寿", "收": "収", "從": "従", "澁": "渋", "處": "処", "將": "将", "證": "証",
  "乘": "乗", "淨": "浄", "穰": "穣", "讓": "譲", "愼": "慎", "眞": "真", "晉": "晋", "圖": "図",
  "醉": "酔", "隨": "随", "數": "数", "樞": "枢", "瀨": "瀬", "聲": "声", "靜": "静", "攝": "摂",
  "專": "専", "淺": "浅", "錢": "銭", "禪": "禅", "雙": "双", "壯": "壮", "總": "総", "聰": "聡",
  "莊": "荘", "續": "続", "對": "対", "臺": "台", "瀧": "滝", "擔": "担", "膽": "胆", "團": "団",
  "晝": "昼", "蟲": "虫", "聽": "聴", "鎭": "鎮", "傳": "伝", "當": "当", "繩": "縄", "麥": "麦",
  "發": "発", "拔": "抜", "佛": "仏", "辨": "弁", "辯": "弁", "寶": "宝", "豐": "豊", "萬": "万",
  "滿": "満", "默": "黙", "彌": "弥", "藥": "薬", "豫": "予", "餘": "余", "譽": "誉", "搖": "揺",
  "謠": "謡", "來": "来", "賴": "頼", "亂": "乱", "覽": "覧", "綠": "緑", "禮": "礼", "靈": "霊",
  "齡": "齢", "戀": "恋", "郞": "郎", "樓": "楼", "祿": "禄",
  "黑": "黒", "穗": "穂", "敕": "勅", "曾": "曽", "悅": "悦", "俱": "倶", "冰": "氷", "屛": "屏",
  "鐵": "鉄", "堯": "尭", "遙": "遥", "檜": "桧", "蘆": "芦", "鷗": "鴎", "亙": "亘", "瑤": "瑶",
  "萊": "莱", "禱": "祷", "蠟": "蝋",
  // Small ヶ, ヵ and full-size ケ are written interchangeably in surnames
  "ヶ": "ケ", "ヵ": "ケ",
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
  const scripts: ScriptType[] = [];
  for (const ch of fullName) {
    // ー continues a hiragana given name (田中ゆーこ). Everywhere else it counts as
    // katakana, so that a kana prefix such as えーと田中 does not gain a boundary.
    const continuesName = ch === "ー" && scripts[0] === "K" && scripts[scripts.length - 1] === "H";
    scripts.push(continuesName ? "H" : scriptOf(ch));
  }

  let transitionCount = 0;
  let splitIndex: number | undefined;
  let fromScript: ScriptType | undefined;
  let toScript: ScriptType | undefined;

  for (let i = 1; i < scripts.length; i++) {
    const prev = scripts[i - 1];
    const next = scripts[i];
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
