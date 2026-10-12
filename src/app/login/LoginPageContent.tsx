"use client";
import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnUrl } from "@/lib/return-url";
import { NavBar } from "@/components/NavBar";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";
import { bootstrapMiniAppSession } from "@/components/MiniAppAuth";
import { SkeletonBar } from "@/components/Skeleton";

function readLang(): "ru" | "en" {
  if (typeof window === "undefined") return "ru";
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "ru") return urlLang;
  const cookieLang = document.cookie.split("; ").find(row => row.startsWith("vector_lang="))?.split("=")[1];
  return cookieLang === "en" ? "en" : "ru";
}

export function LoginPageContent({ initialLang = "ru" }: { initialLang?: "ru" | "en" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get("return_url"));
  const [lang, setLang] = useState<"ru" | "en">(initialLang);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const syncLang = () => setLang(readLang());
    syncLang();
    window.addEventListener("vector-lang-change", syncLang);
    window.addEventListener("popstate", syncLang);
    return () => {
      window.removeEventListener("vector-lang-change", syncLang);
      window.removeEventListener("popstate", syncLang);
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void (async () => {
      try {
        const miniApp = await bootstrapMiniAppSession();
        if (ctrl.signal.aborted) return;
        const signedIn = miniApp || (await fetch("/api/me", { signal: ctrl.signal, cache: "no-store" })).ok;
        if (ctrl.signal.aborted) return;
        if (signedIn) router.replace(returnUrl);
        else setChecking(false);
      } catch {
        if (!ctrl.signal.aborted) setChecking(false);
      }
    })();
    return () => ctrl.abort();
  }, [returnUrl, router]);

  const en = lang === "en";
  return (
    <main className="login-shell">
      <NavBar user={null} tabs={[]} lang={lang} />
      <section className="login-card" aria-busy={checking}>
        <div className="login-intro">
          <img src="/vecpic.png" alt="Vector" width={64} height={64} />
          <h1>{checking ? (en ? "Opening Vector" : "Открываем Вектор") : (en ? "Your modules.\nYour Vector." : "Твои модули.\nТвой Вектор.")}</h1>
          <p>{en ? "Save collections, discuss modules, and keep your userbot close at hand." : "Сохраняй коллекции, обсуждай модули и собирай свой юзербот."}</p>

        </div>
        <div className="login-methods">
          {checking ? <div role="status"><p>{en ? "Checking your session…" : "Проверяем сессию…"}</p><SkeletonBar width="100%" height={48} /><SkeletonBar width="75%" height={14} style={{ marginTop: 18 }} /></div> : <>
            <h2>{en ? "Sign in with Telegram" : "Вход через Telegram"}</h2>
            <p>{en ? "Continue with your account. No separate password needed." : "Продолжи со своим аккаунтом. Отдельный пароль не нужен."}</p>
            <TelegramLoginButton lang={lang} returnUrl={returnUrl} />
            <p className="login-help">{en ? "Using the bot? Confirm sign-in in Telegram, then return to this tab." : "Входишь через бота? Подтверди вход в Telegram и вернись в эту вкладку."}</p>
          </>}
        </div>
      </section>
      <style>{logincss}</style>
    </main>
  );
}

const logincss = `
  .login-shell{min-height:100dvh;padding:16px clamp(14px,3vw,30px) 40px;background:#000;color:#f5f5f5}
  .login-shell *{box-sizing:border-box}
  .login-card{display:grid;grid-template-columns:1.05fr 1fr;max-width:980px;margin:clamp(24px,7vh,72px) auto 0;border:1px solid #242424;background:#090909;border-radius:16px;overflow:hidden}
  .login-intro,.login-methods{padding:clamp(24px,4vw,48px)}
  .login-intro{background:#111;display:flex;flex-direction:column;align-items:flex-start}
  .login-intro img{border-radius:14px;object-fit:cover;margin-bottom:28px}
  .login-intro h1{margin:0;font-size:clamp(30px,3.5vw,44px);line-height:1.12;letter-spacing:-.04em;white-space:pre-line}
  .login-card p{color:#b0b0b0;line-height:1.65;font-size:15px;margin:18px 0 24px;max-width:38ch}

  .login-methods{align-self:center;min-width:0}
  .login-methods h2{font-size:24px;letter-spacing:-.025em;margin:0}
  .login-methods .tg-login-wrap{display:grid;gap:10px}
  .login-methods .tg-login-btn,.login-methods .tg-login-fallback{display:flex;width:100%;min-height:48px;margin:0;border-radius:999px;font-size:14px;box-shadow:none;letter-spacing:0}
  .login-methods .tg-login-btn{background:#f5f5f5;color:#111;border-color:#f5f5f5}
  .login-methods .tg-login-btn:hover{background:#ddd;box-shadow:none}
  .login-methods .tg-login-btn svg,.login-methods .tg-login-btn svg path{fill:#111;filter:none}
  .login-methods .tg-login-fallback{background:#111;border-color:#333;color:#eee}
  .login-methods .tg-login-fallback:hover{background:#1a1a1a}
  .login-methods .login-help{font-size:13px;color:#999;margin-bottom:0}
  .login-methods .tg-login-loading{display:block;min-height:48px}
  .login-methods .tg-login-error{color:#fca5a5;overflow-wrap:anywhere}
  @media(max-width:640px){.login-shell{padding:8px 14px 32px}.login-card{grid-template-columns:1fr;margin-top:20px}.login-intro{padding:24px}.login-intro img{width:44px;height:44px;margin-bottom:18px}.login-intro h1{font-size:30px}.login-intro p{margin:14px 0}.login-catalog{margin-top:0}.login-methods{padding:24px}.login-methods h2{font-size:22px}}
`;
