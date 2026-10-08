"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnUrl } from "@/lib/return-url";
import { NavBar } from "@/components/NavBar";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";
import { SkeletonBar } from "@/components/Skeleton";

function readLang(): "ru" | "en" {
  if (typeof window === "undefined") return "ru";
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "ru") return urlLang;
  const cookieLang = document.cookie.split("; ").find(row => row.startsWith("vector_lang="))?.split("=")[1];
  return cookieLang === "en" ? "en" : "ru";
}

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get("return_url"));
  const [lang, setLang] = useState<"ru" | "en">(readLang);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const syncLang = () => {
      const l = readLang();
      setLang(l);
    };
    syncLang();
    window.addEventListener("vector-lang-change", syncLang as EventListener);
    window.addEventListener("popstate", syncLang);
    return () => {
      window.removeEventListener("vector-lang-change", syncLang as EventListener);
      window.removeEventListener("popstate", syncLang);
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/me", { signal: ctrl.signal })
      .then((r) => {
        if (r.ok) router.replace(returnUrl);
        else setChecking(false);
      })
      .catch(() => setChecking(false));
    return () => ctrl.abort();
  }, [returnUrl, router]);

  if (checking) {
    return (
      <main className="login-shell">
        <NavBar user={null} tabs={[]} lang={lang} />
        <section className="hero-card">
          <div className="eyebrow">{lang === "en" ? "Sign in" : "Вход"}</div>
          <h1>{lang === "en" ? "Sign in with Telegram" : "Вход через Telegram"}</h1>
          <p style={{ color: "#8f8f8f" }}>
            <SkeletonBar width={260} height={14} />
            <SkeletonBar width={180} height={14} style={{ marginTop: 10 }} />
          </p>
        </section>
        <style>{logincss}</style>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <NavBar user={null} tabs={[]} lang={lang} />

      <section className="hero-card">
        <div className="eyebrow">{lang === "en" ? "Sign in" : "Вход"}</div>
        <h1>{lang === "en" ? "Sign in with Telegram" : "Вход через Telegram"}</h1>
        <p>
          {lang === "en"
            ? "Choose any convenient sign-in method: via the Telegram button or via the bot."
            : "Выберите удобный способ входа: через кнопку Telegram или через бота."}
        </p>
        <TelegramLoginButton lang={lang} returnUrl={returnUrl} />
      </section>

      <style>{logincss}</style>
    </main>
  );
}

const logincss = `
  html, body { margin: 0; min-height: 100%; background:#000; color:#fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  *{box-sizing:border-box} a{color:inherit;text-decoration:none}
  .login-shell{min-height:100vh;padding:16px clamp(14px,3vw,30px) 40px;background:radial-gradient(circle at 18% -20%,rgba(255,255,255,.1),transparent 45%),#000}
  .hero-card{max-width:1240px;margin:0 auto;border:1px solid #1f1f1f;background:#090909;border-radius:16px;padding:clamp(20px,4vw,34px)}
  .eyebrow{color:#8f8f8f;font-size:12px;letter-spacing:.09em;text-transform:uppercase}
  h1{margin:10px 0 0;font-size:clamp(34px,7vw,64px);letter-spacing:-.04em;line-height:.95}
  p{color:#b0b0b0;max-width:760px;line-height:1.5;margin:16px 0 22px}
  .tg-login-slot{min-height:46px;display:flex;justify-content:flex-start;align-items:center}
  .tg-login-loading{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:1px solid #2b2b2b;background:#0f0f0f;color:#d4d4d4;border-radius:10px;text-decoration:none}
  .tg-login-fallback{margin-top:12px;display:inline-flex;padding:10px 16px;border-radius:10px;border:1px solid #2b2b2b;background:#0f0f0f;color:#d4d4d4;text-decoration:none}
  .tg-login-fallback:hover{background:#171717;color:#fff;border-color:#3a3a3a}
  .tg-login-hint{margin:10px 0 0;color:#8f8f8f;font-size:13px}
  .tg-login-hint code{color:#e5e5e5}
  .tg-login-error{color:#fca5a5;margin:12px 0 0;font-size:14px}
`;
