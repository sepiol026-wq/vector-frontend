"use client";

import { useState } from "react";
import { createRipple } from "@/lib/ripple";

export function LangToggle({ lang }: { lang: "ru" | "en" }) {
  const [current, setCurrent] = useState(lang);

  function switchLang(next: "ru" | "en") {
    if (next === current) return;
    setCurrent(next);
    document.cookie = `vector_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("vector-lang-change", { detail: next }));
  }

  return (
    <div className="lt-wrap">
      <button className={`lt-btn${current === "ru" ? " active" : ""}`} onMouseDown={(e) => createRipple(e, current === "ru" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => switchLang("ru")}>RU</button>
      <button className={`lt-btn${current === "en" ? " active" : ""}`} onMouseDown={(e) => createRipple(e, current === "en" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => switchLang("en")}>EN</button>
      <style>{`
        .lt-wrap { display: inline-flex; gap: 2px; }
         .lt-btn {
           position: relative; overflow: hidden;
           padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.06);
           background: transparent; color: rgba(255,255,255,.3);
           font: inherit; font-size: 10px; font-weight: 700;
           letter-spacing: .04em; cursor: pointer; transition: .18s ease;
         }
        .lt-btn:hover { color: rgba(255,255,255,.6); border-color: rgba(255,255,255,.12); }
        .lt-btn.active { color: #000; background: #fff; border-color: #fff; }
      `}</style>
    </div>
  );
}
