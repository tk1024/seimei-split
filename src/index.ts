export interface SeimeiResult {
  sei: string;
  mei: string;
}

export function split(fullName: string): SeimeiResult {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { sei: "", mei: "" };
  }

  // スペース（全角・半角）で分割
  const parts = trimmed.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    return { sei: parts[0], mei: parts.slice(1).join(" ") };
  }

  // TODO: スペースなしの漢字名の姓名分離ロジック
  return { sei: trimmed, mei: "" };
}
