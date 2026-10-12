"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { NavBar } from "@/components/NavBar";
import { DeveloperPanel, type AbuseSummary } from "@/components/DeveloperPanel";
import { RippleButton } from "@/components/RippleButton";
import { toast } from "sonner";

type WebUser = {
  id: string; telegram_id: string; username: string | null;
  first_name: string | null; last_name: string | null;
  photo_url: string | null; display_name: string;
};

type AbuseFlag = {
  id: string; module_id: string; module_name: string; github_owner: string;
  pattern: string; severity: number; vote_count: number;
  ip: string | null; fingerprint: string | null;
  details: any; reviewed: boolean; reviewed_by: string | null;
  reviewed_at: string | null; created_at: string;
};

type ModuleCard = {
  id: string; name: string; class_name: string; developer: string;
  description: string; locales?: Record<string,string>; banner: string | null;
  version: string; likes: number; dislikes: number; comments_count?: number;
  score?: number; source_owner: string; source_url: string;
  source_raw_url?: string; source_download_url?: string;
  is_official_developer?: boolean; developer_badge?: "official" | null; tags?: string[];
  hidden?: boolean;
  commands?: string[];
  dependencies?: string[];
  changelog?: string;
  raw_code_size?: number;
  created_at?: string;
  updated_at?: string;
};

function getLang(): "ru" | "en" {
  const match = document.cookie.match(/(?:^|;\s*)vector_lang=([^;]*)/);
  return match?.[1] === "en" ? "en" : "ru";
}

export default function DevPageClient() {
  const router = useRouter();
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [user, setUser] = useState<WebUser | null>(null);
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hidingModules, setHidingModules] = useState<Set<string>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [perModuleAnalytics, setPerModuleAnalytics] = useState<Record<string, any>>({});
  const [perModuleLoading, setPerModuleLoading] = useState<Set<string>>(new Set());
  const [abuseFlags, setAbuseFlags] = useState<AbuseFlag[]>([]);
  const [abuseSummary, setAbuseSummary] = useState<AbuseSummary | null>(null);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState(false);
  const analyticsRequest = useRef<AbortController | null>(null);
  useEffect(() => () => analyticsRequest.current?.abort(), []);
  const [botUsername, setBotUsername] = useState("");

  useEffect(() => {
    setLang(getLang());
    const onLang = (e: CustomEvent) => setLang(e.detail);
    window.addEventListener("vector-lang-change", onLang as EventListener);
    return () => window.removeEventListener("vector-lang-change", onLang as EventListener);
  }, []);
  const fetchFlags = useCallback(() => {
    setFlagsLoading(true);
    setFlagsError(false);
    fetch("/api/me/abuse-flags?reviewed=false", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!Array.isArray(data.flags)) throw new Error("Invalid reports");
        if (!data.summary || !["total", "modules", "ip_cluster", "fp_cluster", "velocity_anomaly", "new_account_brigade"].every(key => Number.isInteger(data.summary[key]) && data.summary[key] >= 0)) throw new Error("Invalid summary");
        setAbuseFlags(data.flags);
        setAbuseSummary(data.summary);
      })
      .catch(() => setFlagsError(true))
      .finally(() => setFlagsLoading(false));
  }, []);
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (!data.github_verified) { router.push("/"); return; } setUser(data.user); })
      .catch((status) => { if (status === 401) router.push("/login"); });
    fetch("/api/me/modules", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setModules(data.modules || []); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
    fetchFlags();
    fetch("/api/tg-bot")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setBotUsername(data.username || ""); })
      .catch(() => {});
  }, []);

  const handleToggleModule = useCallback(async (id: string, hidden: boolean) => {
    setHidingModules(prev => { const next = new Set(prev); next.add(id); return next; });
    try {
      const r = await fetch("/api/me/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: id, hidden })
      });
      if (!r.ok) throw new Error("failed");
      setModules(prev => prev.map(m => m.id === id ? { ...m, hidden } as ModuleCard : m));
      toast.success(hidden ? (lang === "en" ? "Module hidden" : "Модуль скрыт") : (lang === "en" ? "Module restored" : "Модуль возвращён"));
    } catch {
      toast.error(lang === "en" ? "Failed to update module" : "Не удалось обновить модуль");
    } finally {
      setHidingModules(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [lang]);

  const handleFetchAnalytics = useCallback((days: number) => {
    analyticsRequest.current?.abort();
    const request = new AbortController();
    analyticsRequest.current = request;
    setAnalyticsDays(days);
    setAnalyticsLoading(true);
    fetch(`/api/me/analytics?days=${days}`, { credentials: "include", signal: request.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (!request.signal.aborted) { setAnalyticsData(data); setAnalyticsLoading(false); } })
      .catch(() => { if (!request.signal.aborted) { setAnalyticsData({ error: true }); setAnalyticsLoading(false); } });
  }, []);

  const handlePerModuleAnalytics = useCallback((moduleId: string, days: number) => {
    setPerModuleLoading(prev => { const s = new Set(prev); s.add(moduleId); return s; });
    fetch(`/api/me/modules/${moduleId}/analytics?days=${days}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setPerModuleAnalytics(prev => ({ ...prev, [moduleId]: data }));
        setPerModuleLoading(prev => { const s = new Set(prev); s.delete(moduleId); return s; });
      })
      .catch(() => { setPerModuleAnalytics(prev => ({ ...prev, [moduleId]: { error: true } })); setPerModuleLoading(prev => { const s = new Set(prev); s.delete(moduleId); return s; }); });
  }, []);

  const handleReviewFlag = useCallback((flagId: string) => {
    fetch(`/api/me/abuse-flags?id=${flagId}`, { method: "PATCH", credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(() => { fetchFlags(); toast.success(lang === "en" ? "Flag reviewed" : "Сигнал отмечен просмотренным"); })
      .catch(() => { toast.error(lang === "en" ? "Failed to review flag" : "Не удалось отметить сигнал"); });
  }, [lang, fetchFlags]);

  return (
    <main className="app-shell">

      <NavBar
        user={user ? { display_name: user.display_name, username: user.username, photo_url: user.photo_url } : null}
        tabs={[
          { label: lang === "en" ? "Catalog" : "Каталог", href: "/" },
          { label: lang === "en" ? "Stats" : "Статистика", href: "/?tab=stats" },
          { label: lang === "en" ? "Collections" : "Коллекции", href: "/?tab=collections" },
        ]}
        backHref="/"
        lang={lang}
        onUserClick={() => router.push("/?tab=profile")}
      />

      <section className="dev-hero">
        <h1>{lang === "en" ? "Developer Panel" : "Панель разработчика"}</h1>
        <p>{lang === "en" ? "Manage your modules, toggle visibility, and view analytics." : "Управляй модулями, скрывай и смотри аналитику."}</p>
      </section>

      {loading ? (
        <section className="dev-skeleton">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skel-row">
              <div className="skel-line skel-title" />
              <div className="skel-line skel-text" />
            </div>
          ))}
        </section>
      ) : loadError ? (
        <section className="dev-empty" role="alert"><h2>{lang === "en" ? "Modules could not be loaded" : "Не удалось загрузить модули"}</h2><p>{lang === "en" ? "Check your connection and reload the page." : "Проверь соединение и обнови страницу."}</p><RippleButton onClick={() => window.location.reload()}>{lang === "en" ? "Try again" : "Повторить"}</RippleButton></section>
      ) : modules.length ? (
        <section className="dev-content">
          <DeveloperPanel
            modules={modules}
            lang={lang}
            hidingModules={hidingModules}
            onToggleModule={handleToggleModule}
            analyticsData={analyticsData}
            analyticsLoading={analyticsLoading}
            analyticsDays={analyticsDays}
            onFetchAnalytics={handleFetchAnalytics}
            perModuleAnalytics={perModuleAnalytics}
            perModuleLoading={perModuleLoading}
            onPerModuleAnalytics={handlePerModuleAnalytics}
            abuseFlags={abuseFlags}
            abuseSummary={abuseSummary}
            flagsLoading={flagsLoading}
            flagsError={flagsError}
            onFetchFlags={fetchFlags}
            onReviewFlag={handleReviewFlag}
          />
        </section>
      ) : (
        <section className="dev-empty">
          <h2>{lang === "en" ? "No modules" : "Нет модулей"}</h2>
          <p>{lang === "en" ? "Upload modules to get started." : "Загрузи модули чтобы начать."}</p>
          <RippleButton
            disabled={!botUsername}
            onClick={() => window.open(`https://t.me/${botUsername}`, "_blank")}
            style={{
              marginTop: 20,
              padding: "10px 28px",
              fontSize: 14,
              fontWeight: 600,
              background: "#f5f5f5",
              color: "#111",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {botUsername ? `@${botUsername}` : (lang === "en" ? "Open Bot" : "Открыть бота")}
          </RippleButton>
        </section>
      )}

      <style>{`
        html, body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        .app-shell {
          min-height: 100dvh;
          padding: 16px clamp(14px, 3vw, 30px) 40px;
          background: radial-gradient(circle at 18% -20%, rgba(255,255,255,.1), transparent 45%), #000;
        }
        @media (max-width: 640px) {
          .app-shell { padding: 8px 14px 40px; }
        }
        .parallax-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .p-layer {
          position: absolute;
          inset: -15%;
          background-repeat: repeat;
          opacity: .2;
          filter: blur(.5px);
        }
        .dev-hero {
          max-width: 1240px;
          margin: 0 auto 20px;
          padding: 24px 0;
        }
        .eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #8b949e;
          margin-bottom: 8px;
        }
        .dev-hero h1 {
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -.035em;
          font-weight: 700;
          color: #e6edf3;
          margin: 0 0 6px;
        }
        .dev-hero p {
          color: #8b949e;
          font-size: 14px;
          margin: 0;
        }
        .dev-content {
          max-width: 1240px;
          margin: 0 auto;
        }
        .dev-skeleton {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .skel-row {
          padding: 16px;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          background: #090909;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skel-line {
          border-radius: 6px;
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 200% 100%;
        }
        .skel-title { height: 14px; width: 40%; }
        .skel-text { height: 10px; width: 70%; }
        .dev-empty {
          max-width: 1240px;
          margin: 0 auto;
          text-align: center;
          padding: 60px 20px;
          color: #8b949e;
        }
        .dev-empty h2 {
          color: #c9d1d9;
          margin-bottom: 8px;
        }
      `}</style>
    </main>
  );
}
