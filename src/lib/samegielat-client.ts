// ============================================================
// Sámegielat — Frontend API Client
// Kopier til: src/lib/samegielat-client.ts
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "YOUR_ANON_KEY";

// ─── Types ──────────────────────────────────────────────────────

export type SamiLang = "sme" | "nob" | "smj" | "sma";
export type LangPair = "sme|nob" | "nob|sme" | "sme|smj" | "smj|sme" | "sme|sma" | "sma|sme";

export interface TranslateResult {
  translatedText: string;
  langpair: LangPair;
  sourceText: string;
  cached: boolean;
}

export interface TmxResult {
  id: number;
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  similarity: number | null;
}

export interface DictResult {
  id: number;
  source_lang: string;
  target_lang: string;
  source_word: string;
  target_word: string;
  source_pos: string | null;
  pos_label: string | null;
  similarity: number | null;
}

// ─── Language metadata ──────────────────────────────────────────

export const LANGUAGES: Record<SamiLang, { name: string; nativeName: string }> = {
  sme: { name: "Nordsamisk", nativeName: "Davvisámegiella" },
  nob: { name: "Norsk bokmål", nativeName: "Norsk" },
  smj: { name: "Lulesamisk", nativeName: "Julevsámegiella" },
  sma: { name: "Sørsamisk", nativeName: "Åarjelsaemien gïele" },
};

export const AVAILABLE_PAIRS: { value: LangPair; label: string }[] = [
  { value: "sme|nob", label: "Nordsamisk → Norsk" },
  { value: "nob|sme", label: "Norsk → Nordsamisk" },
  { value: "sme|smj", label: "Nordsamisk → Lulesamisk" },
  { value: "smj|sme", label: "Lulesamisk → Nordsamisk" },
  { value: "sme|sma", label: "Nordsamisk → Sørsamisk" },
  { value: "sma|sme", label: "Sørsamisk → Nordsamisk" },
];

// ─── Core fetch helper ──────────────────────────────────────────

async function callEdge<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data as T;
}

// ─── 1. Translate (Apertium via proxy) ──────────────────────────

export async function translate(text: string, langpair: LangPair): Promise<TranslateResult> {
  return callEdge<TranslateResult>("translate", { text, langpair });
}

// ─── 2. Translation Memory (TMX lookup) ─────────────────────────

export async function searchTranslationMemory(
  query: string,
  sourceLang?: SamiLang,
  targetLang?: SamiLang,
  limit = 10
): Promise<{ results: TmxResult[]; count: number }> {
  return callEdge("tmx-lookup", { query, sourceLang, targetLang, limit });
}

// ─── 3. Dictionary ──────────────────────────────────────────────

export async function lookupDictionary(
  word: string,
  sourceLang?: SamiLang,
  targetLang?: SamiLang,
  limit = 20
): Promise<{ results: DictResult[]; count: number }> {
  return callEdge("dictionary", { word, sourceLang, targetLang, limit });
}

// ─── Debounced translate (for "translate as you type") ──────────

export function createDebouncedTranslate(delayMs = 500) {
  let tid: ReturnType<typeof setTimeout> | null = null;

  return (
    text: string,
    langpair: LangPair,
    onResult: (r: TranslateResult) => void,
    onError?: (e: Error) => void
  ) => {
    if (tid) clearTimeout(tid);
    if (!text.trim()) {
      onResult({ translatedText: "", langpair, sourceText: "", cached: false });
      return;
    }
    tid = setTimeout(async () => {
      try {
        onResult(await translate(text, langpair));
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    }, delayMs);
  };
}

// ─── 4. Claude Translate (Norwegian → Sami) ────────────────────

export async function claudeTranslate(
  text: string,
  targetLang: "sme" | "smj" | "sma"
): Promise<{ translatedText: string; targetLang: string; sourceText: string }> {
  return callEdge("claude-translate", { text, targetLang });
}
