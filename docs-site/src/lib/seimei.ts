// Dynamic import of seimei-split from the docs build
let splitFn: ((name: string, opts?: { allowLowConfidence?: boolean }) => { sei: string; mei: string }) | null = null;
let analyzeFn: ((name: string, opts?: { allowLowConfidence?: boolean }) => {
  best: { sei: string; mei: string };
  confidence: number;
  candidates: { sei: string; mei: string; score: number; seiMatch: string; meiMatch: string }[];
}) | null = null;

let loadPromise: Promise<void> | null = null;

export function loadSeimei(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = import(/* @vite-ignore */ `${import.meta.env.BASE_URL}seimei-split.js`).then(
    (mod) => {
      splitFn = mod.split;
      analyzeFn = mod.analyze;
    },
  );
  return loadPromise;
}

export function split(name: string, opts?: { allowLowConfidence?: boolean }) {
  if (!splitFn) throw new Error("seimei-split not loaded");
  return splitFn(name, opts);
}

export function analyze(name: string, opts?: { allowLowConfidence?: boolean }) {
  if (!analyzeFn) throw new Error("seimei-split not loaded");
  return analyzeFn(name, opts);
}

export function isLoaded() {
  return splitFn !== null;
}
