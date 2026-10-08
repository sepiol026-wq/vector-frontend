"use client";

import { useEffect, useMemo, useState } from "react";
import { SkeletonBar } from "@/components/Skeleton";

type BotChallenge = {
  id: string;
  code: string;
  expires_at: string;
};

export function TelegramLoginButton({ compact = false, lang = "ru", returnUrl }: { compact?: boolean; lang?: "ru" | "en"; returnUrl?: string }) {
  const [loading, setLoading] = useState(true);
  const [botUsername, setBotUsername] = useState<string>("");
  const [challenge, setChallenge] = useState<BotChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const destination = returnUrl ?? (typeof window !== "undefined"
    ? window.location.pathname + window.location.search
    : "/");
  const encodedReturnUrl = encodeURIComponent(destination);

  const botLink = useMemo(() => {
    if (!botUsername || !challenge?.code) return "";
    return `https://t.me/${botUsername}?start=login_${challenge.code}`;
  }, [botUsername, challenge?.code]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function pollChallenge(id: string) {
      if (cancelled) return;
      const res = await fetch(`/api/auth/telegram/bot?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string; return_url?: string };
      if (data.status === "approved") {
        window.location.href = data.return_url || "/";
        return;
      }
      if (data.status === "expired" || data.status === "consumed") return;
      timer = setTimeout(() => void pollChallenge(id), 2500);
    }

    async function init() {
      setLoading(true);
      try {
        const [botRes, chalRes] = await Promise.all([
          fetch("/api/tg-bot", { cache: "no-store" }),
          fetch(`/api/auth/telegram/bot?return_url=${encodedReturnUrl}`, { method: "POST", cache: "no-store" })
        ]);
        const botData = (await botRes.json()) as { username?: string };
        const chalData = (await chalRes.json()) as { challenge?: BotChallenge };

        if (cancelled) return;

        if (chalData.challenge) {
          setChallenge(chalData.challenge);
          void pollChallenge(chalData.challenge.id);
        }

        setBotUsername(botData.username ?? "");
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [encodedReturnUrl]);

  if (loading) {
    return <span className="tg-login-loading"><SkeletonBar width={170} height={18} radius={999} /></span>;
  }

  return (
    <div className="tg-login-wrap">
      <a
        className="tg-login-btn"
        href={`/api/auth/telegram?return_url=${encodedReturnUrl}`}
      >
        <span className="tg-login-btn-svg" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation" focusable="false">
            <path d="M22 3.8 18.8 19c-.24 1.08-.87 1.35-1.76.84l-4.88-3.6-2.36 2.28c-.26.26-.48.48-.98.48l.35-4.98 9.06-8.18c.4-.35-.08-.55-.6-.2L6.44 12.66 1.6 11.15c-1.05-.33-1.07-1.05.22-1.55L20.7 2.33c.88-.33 1.65.2 1.3 1.47Z" />
          </svg>
        </span>
        <span>{lang === "en" ? "Sign in with Telegram" : "Войти через Telegram"}</span>
      </a>

      {botLink ? (
        <a className="tg-login-fallback" href={botLink} target="_blank" rel="noreferrer">
          <span className="tg-login-fallback-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
              <path d="M22 3.8 18.8 19c-.24 1.08-.87 1.35-1.76.84l-4.88-3.6-2.36 2.28c-.26.26-.48.48-.98.48l.35-4.98 9.06-8.18c.4-.35-.08-.55-.6-.2L6.44 12.66 1.6 11.15c-1.05-.33-1.07-1.05.22-1.55L20.7 2.33c.88-.33 1.65.2 1.3 1.47Z" />
            </svg>
          </span>
          <span>{lang === "en" ? "Sign in via bot" : "Войти через бота"}</span>
        </a>
      ) : null}

      {error ? <p className="tg-login-error">{error}</p> : null}

      <style jsx>{`
        .tg-login-fallback{margin-top:12px;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #5eaee3;background:linear-gradient(180deg,#61b9ef 0%,#4ea6de 100%);color:#fff;text-decoration:none;font-weight:700;font-size:16px;line-height:1;letter-spacing:.01em;box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 -1px 0 rgba(0,0,0,.18) inset;}
        .tg-login-fallback:hover{background:linear-gradient(180deg,#71c2f3 0%,#57afe5 100%);}
        .tg-login-fallback-icon{display:inline-grid;place-items:center;width:24px;height:24px;flex:none;}
        .tg-login-fallback-icon svg{width:22px;height:22px;fill:#fff;opacity:.95;filter:drop-shadow(0 1px 0 rgba(0,0,0,.15));}
        .tg-login-btn{margin-bottom:8px;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 22px;border-radius:999px;border:1px solid #5eaee3;background:linear-gradient(180deg,#61b9ef 0%,#4ea6de 100%);color:#fff;font-weight:700;font-size:16px;line-height:1;letter-spacing:.01em;cursor:pointer;text-decoration:none;box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 -1px 0 rgba(0,0,0,.18) inset,0 2px 8px rgba(0,0,0,.3);transition:transform .12s,box-shadow .12s;}
        .tg-login-btn:hover{transform:translateY(-1px);box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 -1px 0 rgba(0,0,0,.18) inset,0 4px 14px rgba(0,0,0,.35);background:linear-gradient(180deg,#71c2f3 0%,#57afe5 100%);}
        .tg-login-btn:active{transform:translateY(0);}
        .tg-login-btn-svg{display:inline-grid;place-items:center;width:24px;height:24px;flex:none;}
        .tg-login-btn-svg svg{width:22px;height:22px;fill:#fff;opacity:.95;filter:drop-shadow(0 1px 0 rgba(0,0,0,.15));}
      `}</style>
    </div>
  );
}
