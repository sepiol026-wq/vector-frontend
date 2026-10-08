"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { getErrorMessage } from "@/lib/error-messages";
import { createRipple } from "@/lib/ripple";

type Props = {
  code: number;
  bare?: boolean;
  reset?: () => void;
};

function readLang(): "ru" | "en" {
  if (typeof window === "undefined") return "ru";
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "ru") return urlLang;
  const cookieLang = document.cookie
    .split("; ")
    .find((row) => row.startsWith("vector_lang="))
    ?.split("=")[1];
  if (cookieLang === "en" || cookieLang === "ru") return cookieLang;
  return "ru";
}

export function ErrorPage({ code, bare, reset }: Props) {
  const [lang, setLang] = useState<"ru" | "en">("ru");

  useEffect(() => {
    setLang(readLang());
    const onLangChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as "ru" | "en" | undefined;
      if (detail === "ru" || detail === "en") setLang(detail);
    };
    window.addEventListener("vector-lang-change", onLangChange);
    return () => window.removeEventListener("vector-lang-change", onLangChange);
  }, []);

  const msg = getErrorMessage(code);
  const t = msg[lang];

  const content = (
    <div style={styles.wrapper}>
      {!bare ? (
        <NavBar
          tabs={[{ label: String(code), active: true }]}
          lang={lang}
        />
      ) : null}
      <main style={styles.main}>
        <span style={styles.code}>{code}</span>
        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.desc}>{t.desc}</p>
        <div style={styles.actions}>
          <Link href="/" style={styles.homeBtn}>
            {lang === "en" ? "Go Home" : "На главную"}
          </Link>
          {reset ? (
            <button onMouseDown={(e) => createRipple(e)} onClick={() => reset()} style={styles.retryBtn}>
              {lang === "en" ? "Try Again" : "Попробовать снова"}
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );

  if (bare) {
    return (
      <html lang={lang}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>
            {code} — {t.title}
          </title>
          <style>{`*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;margin:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff}`}</style>
        </head>
        <body>{content}</body>
      </html>
    );
  }

  return content;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100dvh",
    background: "#0a0a0a",
    color: "#fff",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100dvh - 120px)",
    textAlign: "center",
    padding: "24px 16px",
  },
  code: {
    fontSize: "clamp(80px, 15vw, 160px)",
    fontWeight: 900,
    lineHeight: 1,
    color: "rgba(255,255,255,0.08)",
    marginBottom: "-24px",
    pointerEvents: "none",
    userSelect: "none",
  },
  title: {
    fontSize: "clamp(20px, 4vw, 28px)",
    fontWeight: 600,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 10,
  },
  desc: {
    fontSize: "clamp(14px, 2.5vw, 16px)",
    color: "rgba(255,255,255,0.45)",
    maxWidth: 460,
    lineHeight: 1.55,
    marginBottom: 32,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  homeBtn: {
    display: "inline-block",
    padding: "12px 32px",
    borderRadius: 999,
    background: "#fff",
    color: "#000",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    letterSpacing: ".02em",
    transition: "background .2s, transform .15s",
  },
  retryBtn: {
    padding: "8px 24px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
};
