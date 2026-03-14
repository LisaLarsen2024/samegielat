import { useState, useRef, useEffect, useCallback } from "react";
import {
  claudeTranslate,
  lookupDictionary,
  searchTranslationMemory,
  type TmxResult,
  type DictResult,
} from "./lib/samegielat-client";

type LangCode = "sme" | "smj" | "sma";

const LANG_OPTIONS: { code: LangCode; label: string; native: string; color: string }[] = [
  { code: "sme", label: "Nordsamisk", native: "davvisámegiella", color: "#DC241F" },
  { code: "smj", label: "Lulesamisk", native: "julevsámegiella", color: "#0035AD" },
  { code: "sma", label: "Sørsamisk", native: "åarjelsaemien", color: "#007229" },
];

const FLAG = { red: "#DC241F", blue: "#0035AD", green: "#007229", yellow: "#FFCE00" };

export default function App() {
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<LangCode>("sme");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [dictResults, setDictResults] = useState<DictResult[]>([]);
  const [tmxResults, setTmxResults] = useState<TmxResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLang = LANG_OPTIONS.find((l) => l.code === lang)!;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    if (document.getElementById("sami-v2")) return;
    const s = document.createElement("style");
    s.id = "sami-v2";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #0F0F1A; color: #E8E4DE; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
      ::selection { background: #FFCE0033; color: #fff; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes ringFloat { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(8px, -6px) rotate(3deg); } 50% { transform: translate(-4px, 4px) rotate(-2deg); } 75% { transform: translate(6px, 8px) rotate(1deg); } }
      @keyframes pulseGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      textarea { font-family: 'DM Sans', sans-serif; }
      textarea:focus { border-color: rgba(255, 206, 0, 0.3) !important; box-shadow: 0 0 0 4px rgba(255, 206, 0, 0.06), 0 8px 32px rgba(0,0,0,0.3) !important; }
      textarea::placeholder { color: #5A5670; }
    `;
    document.head.appendChild(s);
  }, []);

  const translate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setResult("");
    setDictResults([]); setTmxResults([]);

    try {
      const [translateRes, dictRes, tmxRes] = await Promise.allSettled([
        claudeTranslate(input.trim(), lang),
        lookupDictionary(input.trim().split(/\s+/)[0], "nob", undefined, 8),
        searchTranslationMemory(input.trim(), "nob", lang, 5),
      ]);

      if (translateRes.status === "fulfilled") {
        setResult(translateRes.value.translatedText);
      } else {
        setError("Oversettelse feilet. Prøv igjen.");
      }

      if (dictRes.status === "fulfilled") {
        const d = dictRes.value as { results: DictResult[] };
        if (d.results.length > 0) setDictResults(d.results);
      }
      if (tmxRes.status === "fulfilled") {
        const t = tmxRes.value as { results: TmxResult[] };
        if (t.results.length > 0) setTmxResults(t.results);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt. Prøv igjen.");
    } finally { setLoading(false); }
  }, [input, lang]);

  const copyToClipboard = async () => { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) translate(); };

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F1A", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", background: `radial-gradient(circle, ${FLAG.red}08 0%, transparent 70%)`, borderRadius: "50%", animation: "pulseGlow 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: "500px", height: "500px", background: `radial-gradient(circle, ${FLAG.blue}06 0%, transparent 70%)`, borderRadius: "50%", animation: "pulseGlow 8s ease-in-out infinite 2s" }} />
      </div>

      <div style={{ width: "100%", height: "4px", display: "flex", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div style={{ flex: 1, background: FLAG.red }} /><div style={{ flex: 1, background: FLAG.blue }} /><div style={{ flex: 1, background: FLAG.yellow }} /><div style={{ flex: 1, background: FLAG.green }} />
      </div>

      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "360px", height: "360px", borderRadius: "50%", border: "2px solid rgba(255,206,0,0.06)", animation: "ringFloat 20s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: "30px", borderRadius: "50%", border: "1px solid rgba(220,36,31,0.05)" }} />
        <div style={{ position: "absolute", inset: "60px", borderRadius: "50%", border: "1px solid rgba(0,53,173,0.04)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "620px", margin: "0 auto", padding: "2.5rem 1.5rem 2rem", position: "relative", zIndex: 1, animation: "fadeUp 0.6s ease-out" }}>

        <header style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "1.25rem" }}>
            {[FLAG.red, FLAG.blue, FLAG.yellow, FLAG.green].map((c, i) => (
              <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, opacity: 0.5 }} />
            ))}
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.5rem" }}>Sámegielat</h1>
          <p style={{ fontSize: "0.95rem", color: "#7A7590", fontWeight: 300, letterSpacing: "0.03em" }}>Norsk → Samisk oversetter</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "0.75rem", padding: "0.3rem 0.8rem", background: "rgba(255,206,0,0.06)", borderRadius: "100px", border: "1px solid rgba(255,206,0,0.1)" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: FLAG.yellow, opacity: 0.7 }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "#FFCE00", letterSpacing: "0.04em", opacity: 0.8 }}>716 635 oversettelsesressurser · {currentLang.native}</span>
          </div>
        </header>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "1.75rem", backdropFilter: "blur(20px)", boxShadow: "0 4px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value.slice(0, 3000))} onKeyDown={handleKeyDown} placeholder="Skriv eller lim inn norsk tekst..." rows={5}
            style={{ width: "100%", padding: "1.125rem 1.25rem", fontSize: "1rem", lineHeight: 1.75, fontWeight: 400, color: "#E8E4DE", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", resize: "vertical", outline: "none", transition: "border-color 0.3s, box-shadow 0.3s" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#4A4660" }}>⌘+Enter for å oversette</span>
            <span style={{ fontSize: "0.7rem", color: "#4A4660", fontVariantNumeric: "tabular-nums" }}>{input.length} / 3000</span>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem" }}>
            {LANG_OPTIONS.map((l) => {
              const active = lang === l.code;
              return (
                <button key={l.code} onClick={() => { setLang(l.code); setResult(""); setDictResults([]); setTmxResults([]); }}
                  style={{ flex: 1, padding: "0.75rem 0.5rem 0.85rem", background: active ? `linear-gradient(135deg, ${l.color}18 0%, ${l.color}08 100%)` : "rgba(255,255,255,0.02)", border: active ? `1px solid ${l.color}30` : "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: active ? "15%" : "40%", right: active ? "15%" : "40%", height: active ? "2px" : "0px", background: l.color, borderRadius: "0 0 2px 2px", transition: "all 0.3s ease", opacity: 0.8 }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: active ? 600 : 400, color: active ? "#FFFFFF" : "#6B6580", lineHeight: 1.2 }}>{l.label}</div>
                  <div style={{ fontSize: "0.66rem", color: active ? `${l.color}BB` : "#4A4660", marginTop: "3px", fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>{l.native}</div>
                </button>
              );
            })}
          </div>

          <button onClick={translate} disabled={loading || !input.trim()} onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
            style={{ width: "100%", padding: "1rem", fontSize: "1rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em", color: "#FFFFFF", background: loading || !input.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${FLAG.red} 0%, ${FLAG.blue} 35%, ${FLAG.green} 70%, ${FLAG.yellow}DD 100%)`, backgroundSize: loading || !input.trim() ? "100% 100%" : "300% 300%", animation: !loading && input.trim() ? "gradientMove 6s ease infinite" : "none", border: "none", borderRadius: "12px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.3s ease", overflow: "hidden", transform: btnHover && !loading && input.trim() ? "translateY(-1px)" : "none", boxShadow: btnHover && !loading && input.trim() ? "0 8px 30px rgba(0,53,173,0.3)" : "0 2px 10px rgba(0,0,0,0.2)" }}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ display: "inline-block", width: "18px", height: "18px", borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: FLAG.red, borderRightColor: FLAG.blue, borderBottomColor: FLAG.yellow, borderLeftColor: FLAG.green, animation: "spin 0.7s linear infinite" }} />
                Oversetter…
              </span>
            ) : (<span>Oversett</span>)}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "1rem", padding: "0.85rem 1.1rem", background: `${FLAG.red}10`, border: `1px solid ${FLAG.red}25`, color: "#FF6B6B", borderRadius: "12px", fontSize: "0.85rem", animation: "fadeUp 0.3s ease-out" }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: "1.25rem", position: "relative", padding: "1.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", animation: "fadeUp 0.5s ease-out", backdropFilter: "blur(20px)", boxShadow: "0 4px 40px rgba(0,0,0,0.15)", borderLeft: `3px solid ${currentLang.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentLang.color, boxShadow: `0 0 12px ${currentLang.color}44` }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7A7590", textTransform: "uppercase", letterSpacing: "0.1em" }}>{currentLang.label}</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.85, color: "#F0ECE6", fontWeight: 400, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" }}>{result}</p>
            <button onClick={copyToClipboard} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", padding: "0.4rem 0.75rem", fontSize: "0.72rem", fontWeight: 500, color: copied ? FLAG.green : "#6B6580", background: copied ? `${FLAG.green}12` : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? `${FLAG.green}30` : "rgba(255,255,255,0.08)"}`, borderRadius: "8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {copied ? "✓ Kopiert" : "Kopier"}
            </button>
          </div>
        )}

        {dictResults.length > 0 && (
          <div style={{ marginTop: "1rem", padding: "1.25rem 1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", animation: "fadeUp 0.4s ease-out 0.1s both", borderLeft: `3px solid ${FLAG.yellow}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.85rem" }}>
              <span style={{ fontSize: "0.95rem" }}>📖</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#FFCE00", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Ordbok</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {dictResults.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "8px", padding: "0.4rem 0", borderBottom: i < Math.min(dictResults.length, 6) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ fontSize: "0.9rem", color: "#E8E4DE", fontWeight: 500 }}>{d.source_word}</span>
                  <span style={{ fontSize: "0.75rem", color: "#4A4660" }}>→</span>
                  <span style={{ fontSize: "0.9rem", color: "#B8B2A8" }}>{d.target_word}</span>
                  {d.pos_label && (<span style={{ fontSize: "0.65rem", color: "#5A5670", background: "rgba(255,255,255,0.04)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontStyle: "italic", marginLeft: "auto" }}>{d.pos_label}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {tmxResults.length > 0 && (
          <div style={{ marginTop: "1rem", padding: "1.25rem 1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", animation: "fadeUp 0.4s ease-out 0.2s both", borderLeft: `3px solid ${FLAG.blue}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.85rem" }}>
              <span style={{ fontSize: "0.95rem" }}>💬</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B9FFF", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Lignende oversettelser</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tmxResults.slice(0, 4).map((t, i) => (
                <div key={i} style={{ padding: "0.65rem 0", borderBottom: i < Math.min(tmxResults.length, 4) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <p style={{ fontSize: "0.82rem", color: "#9A9590", lineHeight: 1.5, marginBottom: "0.3rem" }}>{t.source_text}</p>
                  <p style={{ fontSize: "0.85rem", color: "#D4D0C8", lineHeight: 1.5 }}>{t.target_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: "0.73rem", color: "#3D3956", lineHeight: 1.7, marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center", fontWeight: 300 }}>
          AI-generert oversettelse supplert med GiellaLT oversettelsesminne og Apertium ordbok. 302 438 setningspar og 414 197 ordpar. Kan inneholde feil. For offisiell bruk, kontakt en samiskspråklig oversetter.
        </p>

        <div style={{ textAlign: "center", marginTop: "1.5rem", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "0.75rem" }}>
            {[FLAG.red, FLAG.blue, FLAG.yellow, FLAG.green].map((c, i) => (
              <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: c, opacity: 0.3 }} />
            ))}
          </div>
          <p style={{ fontSize: "0.68rem", color: "#2D2A40" }}>
            Laget av{" "}
            <a href="https://skrivakademisk.no" target="_blank" rel="noopener" style={{ color: "#4A4660", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Skriv Akademisk AS</a>
          </p>
        </div>
      </div>
    </div>
  );
}
