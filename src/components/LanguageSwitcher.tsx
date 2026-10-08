"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRipple } from "@/lib/ripple";

export function LanguageSwitcher() {
  const router = useRouter();
  const [lang, setLangState] = useState<"ru" | "en">(() => {
    if (typeof window === "undefined") return "ru";
    return new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "ru";
  });

  function setLang(next: "ru" | "en") {
    document.cookie = `vector_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLangState(next);
    const params = new URLSearchParams(window.location.search);
    params.set("lang", next);
    const qs = params.toString();
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    window.dispatchEvent(new CustomEvent("vector-lang-change", { detail: next }));
  }

  return (
    <div style={{ position: "fixed", top: 8, right: 8, zIndex: 9999, display: "flex", gap: 6 }}>
      <button onMouseDown={(e) => createRipple(e, lang === "ru" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => setLang("ru")} style={{ position: "relative", overflow: "hidden", padding: "6px 10px", borderRadius: 8, border: "1px solid #333", background: lang === "ru" ? "#fff" : "#111", color: lang === "ru" ? "#000" : "#fff" }}>RU</button>
      <button onMouseDown={(e) => createRipple(e, lang === "en" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => setLang("en")} style={{ position: "relative", overflow: "hidden", padding: "6px 10px", borderRadius: 8, border: "1px solid #333", background: lang === "en" ? "#fff" : "#111", color: lang === "en" ? "#000" : "#fff" }}>EN</button>
    </div>
  );
}
