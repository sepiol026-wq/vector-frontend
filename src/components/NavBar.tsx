"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRipple } from "@/lib/ripple";

type WebUser = {
  display_name: string;
  username: string | null;
  photo_url: string | null;
};

type Tab = {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
};

type Props = {
  user?: WebUser | null;
  tabs: Tab[];
  backHref?: string;
  lang: "ru" | "en";
  onUserClick?: () => void;
};

export function NavBar({ user, tabs, backHref, lang, onUserClick }: Props) {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState(lang);
  const initials = user?.display_name?.slice(0, 2).toUpperCase() ?? "?";

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/dev");
    router.prefetch("/collections");
  }, [router]);

  const switchLang = useCallback((next: "ru" | "en") => {
    if (next === currentLang) return;
    setCurrentLang(next);
    document.cookie = `vector_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("vector-lang-change", { detail: next }));

    const path = window.location.pathname;
    if (path.startsWith("/modules/") || path.startsWith("/developers/") || path === "/login" || path.startsWith("/collections/") || path === "/banned") {
      router.refresh();
    }
  }, [currentLang, router]);

  return (
    <>
      <header className="glass-bar">
        <div className="gb-left">
          {backHref ? (
            <Link href={backHref} prefetch className="gb-back" aria-label={lang === "en" ? "Back" : "Назад"}>
              ←
            </Link>
          ) : null}
          <Link href={`/`} className="gb-brand">
            <span className="gb-dot" />
            <span className="gb-label">VECTOR</span>
          </Link>
        </div>

        <nav className="gb-nav">
          {tabs.map((t, i) => {
            const cls = `gb-tab${t.active ? " active" : ""}`;
            if (t.onClick) {
              return <button key={i} className={cls} onMouseDown={(e) => createRipple(e)} onClick={t.onClick}>{t.label}</button>;
            }
            if (t.href) {
              return <Link key={i} className={cls} href={t.href} prefetch>{t.label}</Link>;
            }
            return <span key={i} className={cls}>{t.label}</span>;
          })}
        </nav>

        <div className="gb-right">
          <div className="gb-lang">
            <button className={`gb-lang-btn${currentLang === "ru" ? " active" : ""}`} onMouseDown={(e) => createRipple(e, currentLang === "ru" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => switchLang("ru")}>RU</button>
            <button className={`gb-lang-btn${currentLang === "en" ? " active" : ""}`} onMouseDown={(e) => createRipple(e, currentLang === "en" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.10)")} onClick={() => switchLang("en")}>EN</button>
          </div>
          {user ? (
            <button className="gb-user" onMouseDown={(e) => createRipple(e)} onClick={() => onUserClick ? onUserClick() : router.push(`/?tab=profile`)}>
              {user.photo_url ? (
                <span className="gb-avatar" style={{ backgroundImage: `url(${user.photo_url})` }} />
              ) : (
                <span className="gb-avatar gb-avatar-fallback">{initials}</span>
              )}
              <span className="gb-username">@{user.username ?? user.display_name}</span>
            </button>
          ) : null}
        </div>
      </header>

      <style>{`
        .glass-bar {
          position: sticky; top: 12px; z-index: 10;
          box-sizing: border-box;
          width: min(100%, 720px);
          min-height: 52px;
          margin: 0 auto 12px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 8px 14px;
          border-radius: 999px;
          background: rgba(8,8,8,.94);
          border: 1px solid rgba(255,255,255,.06);
          box-shadow: 0 4px 24px rgba(0,0,0,.4);
        }
        .gb-left, .gb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .gb-back {
          color: rgba(255,255,255,.45); font-size: 17px; padding: 2px 4px;
          transition: color .15s; text-decoration: none; line-height: 1;
        }
        .gb-back:hover { color: #fff; }
        .gb-brand {
          display: flex; align-items: center; gap: 8px; text-decoration: none;
        }
        .gb-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #fff;
          flex-shrink: 0;
        }
        .gb-label {
          font-weight: 800; font-size: 15px; letter-spacing: .06em;
          color: rgba(255,255,255,.85);
        }
         .gb-nav {
           display: flex; align-items: center; gap: 2px;
           min-width: 0; overflow-x: auto; scrollbar-width: none;
         }
         .gb-nav::-webkit-scrollbar { display: none; }
        .gb-tab {
          position: relative; overflow: hidden;
          padding: 7px 14px; border-radius: 999px;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,.45);
          background: transparent; border: none; cursor: pointer;
          text-decoration: none; transition: .18s ease;
          white-space: nowrap; letter-spacing: .02em;
        }
        .gb-tab:hover { color: rgba(255,255,255,.75); background: rgba(255,255,255,.04); }
        .gb-tab.active {
          color: #fff; background: rgba(255,255,255,.08);
        }
        .gb-user {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 12px 4px 4px; border-radius: 999px;
          border: none; background: rgba(255,255,255,.04);
          color: rgba(255,255,255,.75); cursor: pointer;
          font: inherit; font-size: 12px; transition: .18s;
          max-width: 180px; overflow: hidden; position: relative;
        }
        .gb-user:hover { background: rgba(255,255,255,.08); color: #fff; }
        .gb-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background-size: cover; background-position: center;
          flex-shrink: 0; display: block;
        }
        .gb-avatar-fallback {
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.1);
          font-weight: 700; font-size: 11px; color: rgba(255,255,255,.6);
        }
        .gb-username {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .gb-lang { display: flex; gap: 2px; flex-shrink: 0; }
        .gb-lang-btn {
          position: relative; overflow: hidden;
          padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.06);
          background: transparent; color: rgba(255,255,255,.3);
          font: inherit; font-size: 10px; font-weight: 700;
          letter-spacing: .04em; cursor: pointer; transition: .18s ease;
        }
        .gb-lang-btn:hover { color: rgba(255,255,255,.6); border-color: rgba(255,255,255,.12); }
        .gb-lang-btn.active { color: #000; background: #fff; border-color: #fff; }
        @media (max-width: 640px) {
           .glass-bar {
             width: 100%; min-height: 44px;
             padding: 6px 10px; gap: 6px;
             top: 8px; margin-bottom: 10px;
           }
          .gb-label { display: none; }
          .gb-tab { padding: 6px 10px; font-size: 11px; }
          .gb-username { display: none; }
          .gb-user { padding: 2px; background: transparent; }
          .gb-dot { width: 6px; height: 6px; }
          .gb-lang-btn { padding: 2px 5px; font-size: 8px; }
          .gb-lang { gap: 1px; }
          .gb-nav { gap: 0; }
          .gb-tab { padding: 4px 7px; font-size: 10px; }
          .gb-avatar { width: 22px; height: 22px; }
          .gb-right { gap: 4px; }
          .gb-user { padding: 1px; max-width: none; }
          .gb-left { gap: 4px; }
          .gb-back { font-size: 15px; }
        }
      `}</style>
    </>
  );
}
