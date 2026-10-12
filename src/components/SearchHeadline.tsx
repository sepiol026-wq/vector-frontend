"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { searchPhrases } from "./search-phrases";

export function SearchHeadline({ lang, paused }: { lang: "ru" | "en"; paused: boolean }) {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const root = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (paused || stopped) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const timer = setInterval(() => {
      const bounds = root.current?.getBoundingClientRect();
      if (reduced.matches || document.hidden || !bounds || bounds.bottom < 0 || bounds.top > innerHeight) return;
      setIndex(previous => (previous + 1 + Math.floor(Math.random() * (searchPhrases[lang].length - 1))) % searchPhrases[lang].length);
    }, 6000);
    return () => clearInterval(timer);
  }, [lang, paused, stopped]);
  const text = index === 0 ? (lang === "ru" ? "Поиск модулей" : "Search modules") : searchPhrases[lang][index]!;
  let offset = 0;
  return <h1 className="search-headline" ref={root}>
    <button type="button" onClick={() => setStopped(value => !value)} aria-label={lang === "ru" ? `Поиск модулей. ${stopped ? "Продолжить" : "Приостановить"} смену заголовка` : `Search modules. ${stopped ? "Resume" : "Pause"} headline rotation`} aria-pressed={stopped} title={lang === "ru" ? "Нажмите, чтобы остановить или продолжить" : "Click to pause or resume"}>
      <span key={`${lang}:${index}`} aria-hidden="true">{text.split(" ").map((word, i) => {
        const start = offset;
        offset += word.length + 1;
        return <span className="search-headline-word" key={i}>{Array.from(word).map((char, j) => <span className="search-headline-char" key={j} style={{ "--char-delay": `${(start + j) * 22}ms` } as CSSProperties}>{char}</span>)}{" "}</span>;
      })}</span>
    </button>
  </h1>;
}
