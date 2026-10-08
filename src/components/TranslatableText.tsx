"use client";

import { useEffect, useState } from "react";

function shouldShowTranslate(text: string, lang: "ru" | "en"): boolean {
  const chars = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!chars) return false;
  const cyrillic = (chars.match(/[\u0400-\u04FF]/g) || []).length;
  const cjk = (chars.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g) || []).length;
  const latin = (chars.match(/[a-zA-Z]/g) || []).length;
  const other = chars.length - cyrillic - cjk - latin;
  if (cjk > 0 || other > 0) return true;
  if (lang === "ru") return latin / chars.length > 0.5;
  return cyrillic / chars.length > 0.3;
}

export function TranslatableText({ text, lang, className }: { text: string; lang: "ru" | "en"; className?: string }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const needs = shouldShowTranslate(text, lang);

  useEffect(() => {
    if (!needs || translated) return;
    let cancelled = false;
    fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts: [text], lang }),
    })
      .then(async (res) => {
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTranslated(data.translations["0"] ?? text);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [needs, text, lang]);

  if (!needs || !translated) {
    return className ? <p className={className}>{text}</p> : <>{text}</>;
  }

  return className ? <p className={className}>{translated}</p> : <>{translated}</>;
}
