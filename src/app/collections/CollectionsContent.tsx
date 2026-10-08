"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { VectorLoader } from "@/components/VectorLoader";
import { NavBar } from "@/components/NavBar";
import { CollectionCard } from "@/components/CollectionCard";
import { CollectionEditor } from "@/components/CollectionEditor";
import { toast } from "sonner";
import { createRipple } from "@/lib/ripple";

type CollectionListRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  privacy: "public" | "unlisted" | "private";
  show_author: boolean;
  created_at: string;
  updated_at: string;
  _count: { modules: number };
  owner: { telegram_id: string };
};

function readLang(): "ru" | "en" {
  if (typeof window === "undefined") return "ru";
  const cookieLang = document.cookie.split("; ").find(row => row.startsWith("vector_lang="))?.split("=")[1];
  return cookieLang === "en" ? "en" : "ru";
}

export function CollectionsContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"ru" | "en">(readLang);
  useEffect(() => {
    const syncLang = () => setLang(readLang());
    syncLang();
    window.addEventListener("vector-lang-change", syncLang as EventListener);
    return () => window.removeEventListener("vector-lang-change", syncLang as EventListener);
  }, []);

  const [userCollections, setUserCollections] = useState<CollectionListRow[]>([]);
  const [publicCollections, setPublicCollections] = useState<CollectionListRow[]>([]);
  const [currentUser, setCurrentUser] = useState<{ display_name: string; username: string | null; photo_url: string | null } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const userCollectionIds = useRef<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [ready, setReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void (async () => {
      await loadUserCollections();
      await loadPage(1);
      setReady(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setContentVisible(true));
      });
    })();
  }, []);

  async function loadUserCollections() {
    try {
      const me = await fetch("/api/me");
      if (!me.ok) return;
      const meData = await me.json() as { user?: { id: string }; id?: string };
      const uid = meData.user?.id ?? meData.id ?? null;
      if (uid) {
        setCurrentUserId(uid);
        setCurrentUser({ display_name: (meData.user as any)?.display_name ?? (meData as any)?.display_name ?? "?", username: (meData.user as any)?.username ?? (meData as any)?.username ?? null, photo_url: (meData.user as any)?.photo_url ?? (meData as any)?.photo_url ?? null });
      }
      const r = await fetch("/api/collections/user/me", { cache: "no-cache" });
      if (r.ok) {
        const data = await r.json() as { collections: CollectionListRow[] };
        setUserCollections(data.collections);
        userCollectionIds.current = new Set(data.collections.map(c => c.id));
      }
    } catch {}
  }

  async function handleCreate(data: { name: string; description: string; privacy: string; show_author: boolean }) {
    const r = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (r.ok) {
      toast.success(lang === "en" ? "Collection created" : "Коллекция создана");
      setShowEditor(false);
      void loadUserCollections();
      void loadPage(1);
    } else {
      toast.error(lang === "en" ? "Failed to create collection" : "Не удалось создать коллекцию");
    }
  }

  async function loadPage(p: number) {
    setLoading(true);
    try {
      const r = await fetch(`/api/collections?page=${p}&limit=20`, {
        cache: "no-cache",
      });
      if (!r.ok) return;
      const data = await r.json() as { collections: CollectionListRow[] };
      const filtered = data.collections.filter(c => !userCollectionIds.current.has(c.id));
      if (p === 1) {
        setPublicCollections(filtered);
      } else {
        setPublicCollections(prev => [...prev, ...filtered]);
      }
      setHasMore(data.collections.length === 20);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          void loadPage(page + 1);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

  if (!ready) {
    return (
      <main className="app-shell collections-loading">
        <NavBar tabs={[{ label: lang === "en" ? "Catalog" : "Каталог", href: `/` }, { label: lang === "en" ? "Stats" : "Статистика", href: `/?tab=stats` }, { label: lang === "en" ? "Collections" : "Коллекции", href: `/?tab=collections` }]} lang={lang} />
        <section className="hero-card">
          <div className="eyebrow">{lang === "en" ? "Module collections" : "Коллекции модулей"}</div>
          <h1>{lang === "en" ? "Collections" : "Коллекции"}</h1>
        </section>
        <section className="collection-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skel-line skel-title" />
              <div className="skel-line skel-text" />
              <div className="skel-line skel-text short" />
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell${contentVisible ? " visible" : ""}`}>
      <div className="parallax-bg">
        <span className="p-layer p-layer-1" />
        <span className="p-layer p-layer-2" />
        <span className="p-layer p-layer-3" />
      </div>
      <NavBar user={currentUser} tabs={[{ label: lang === "en" ? "Catalog" : "Каталог", href: `/` }, { label: lang === "en" ? "Stats" : "Статистика", href: `/?tab=stats` }, { label: lang === "en" ? "Collections" : "Коллекции", href: `/?tab=collections` }]} lang={lang} />

      <section className="hero-card">
        <div className="eyebrow">
          {lang === "en" ? "Module collections" : "Коллекции модулей"}
        </div>
        <h1>{lang === "en" ? "Collections" : "Коллекции"}</h1>
        <p>
          {lang === "en"
            ? "Curated lists of modules by the community."
            : "Подборки модулей, собранные сообществом."}
        </p>
      </section>

      { }
      {currentUserId ? (
        <>
          <section className="catalog-head">
            <strong>{lang === "en" ? "My Collections" : "Мои коллекции"}</strong>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>{userCollections.length} {lang === "en" ? "collections" : "коллекций"}</span>
              <button className="inline-btn-save" style={{ fontSize: 13, padding: "6px 14px" }} onClick={() => setShowEditor(true)} onMouseDown={(e) => createRipple(e)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 5, verticalAlign: "middle" }}>
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {lang === "en" ? "New Collection" : "Новая коллекция"}
              </button>
            </span>
          </section>
          {userCollections.length === 0 ? (
            <section style={{ maxWidth: 1240, margin: "0 auto 16px", textAlign: "center", padding: 24, color: "#8b8b8b", border: "1px dashed #252525", borderRadius: 12, background: "#080808", position: "relative", zIndex: 1 }}>
              {lang === "en"
                ? "You have no collections yet. Create one from a module page!"
                : "У вас пока нет коллекций. Создайте со страницы модуля!"}
            </section>
          ) : (
            <section className="collection-grid" style={{ marginBottom: 28 }}>
              {userCollections.map(c => (
                <CollectionCard key={c.id} collection={c} lang={lang} />
              ))}
            </section>
          )}
        </>
      ) : null}

      { }
      <section className="catalog-head">
        <strong>{lang === "en" ? "Public Collections" : "Публичные коллекции"}</strong>
        <span>{publicCollections.length} {lang === "en" ? "collections" : "коллекций"}</span>
      </section>

      {publicCollections.length === 0 && !loading ? (
        <section style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center", padding: 40, color: "#8b8b8b" }}>
          {lang === "en" ? "No public collections yet." : "Публичных коллекций пока нет."}
        </section>
      ) : (
        <section className="collection-grid">
          {publicCollections.map(c => (
            <CollectionCard key={c.id} collection={c} lang={lang} />
          ))}
        </section>
      )}

      {hasMore ? (
        loading ? (
          <section className="collection-grid" style={{ marginTop: 12 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skel-line skel-title" />
                <div className="skel-line skel-text" />
                <div className="skel-line skel-text short" />
              </div>
            ))}
          </section>
        ) : (
          <div ref={loadMoreRef} className="load-more" />
        )
      ) : null}

      {showEditor ? createPortal(<div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowEditor(false)}><div className="login-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowEditor(false)} onMouseDown={(e) => createRipple(e)} aria-label={lang === "en" ? "Close" : "Закрыть"} type="button">×</button><CollectionEditor onSave={handleCreate} onClose={() => setShowEditor(false)} lang={lang} /></div></div>, document.body) : null}

      <style>{`
        html, body { margin: 0; min-height: 100%; background: #000; color: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        * { box-sizing: border-box; } a { color: inherit; text-decoration: none; } button, input, textarea, select { font: inherit; }
        button { cursor: pointer; }
        .app-shell { min-height: 100vh; padding: 16px clamp(14px,3vw,30px) 40px; background: radial-gradient(circle at 18% -20%, rgba(255,255,255,.1), transparent 45%), #000; opacity: 0; transition: opacity .3s ease; }
        .app-shell.visible { opacity: 1; }
        .collections-loading { opacity: 1; }
        .parallax-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
        .p-layer { position: absolute; inset: -15%; background-repeat: repeat; opacity: .2; filter: blur(.5px); }
        .p-layer-1 { background-image: radial-gradient(circle, rgba(255,255,255,.09) 1px, transparent 1px); background-size: 38px 38px; animation: parallaxMove1 80s linear infinite; }
        .p-layer-2 { background-image: radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1px); background-size: 64px 64px; animation: parallaxMove2 120s linear infinite; }
        .p-layer-3 { background-image: linear-gradient(120deg, transparent 0 46%, rgba(255,255,255,.04) 50%, transparent 54%); background-size: 280px 280px; animation: parallaxMove3 95s linear infinite; }
        @keyframes parallaxMove1 { from { transform: translate3d(0,0,0); } to { transform: translate3d(-220px,-340px,0); } }
        @keyframes parallaxMove2 { from { transform: translate3d(0,0,0); } to { transform: translate3d(170px,-300px,0); } }
        @keyframes parallaxMove3 { from { transform: translate3d(0,0,0); } to { transform: translate3d(-120px,260px,0); } }
        .hero-card { max-width: 1240px; margin: 0 auto 14px; border-radius: 16px; padding: clamp(18px,4vw,30px); z-index: 1; position: relative; }
        .eyebrow { color: #8f8f8f; font-size: 12px; letter-spacing: .09em; text-transform: uppercase; }
        h1 { margin: 10px 0 0; font-size: clamp(32px,6vw,64px); letter-spacing: -.04em; }
        .hero-card p { color: #b0b0b0; max-width: 750px; }
        .catalog-head { max-width: 1240px; margin: 0 auto 10px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
        .catalog-head strong { font-size: 20px; } .catalog-head span { color: #9c9c9c; }
        .collection-grid { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; position: relative; z-index: 1; }
        .collection-card { border: 1px solid #1f1f1f; background: #090909; border-radius: 14px; padding: 16px; transition: border-color .15s; }
        .collection-card:hover { border-color: #2a2a2a; }
        .collection-card-main { display: block; }
        .collection-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .collection-head strong { font-size: 18px; color: #fff; }
        .privacy-badge { font-size: 10px; padding: 3px 8px; border-radius: 999px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
        .privacy-public { background: rgba(74,222,128,.15); color: #4ade80; border: 1px solid rgba(74,222,128,.25); }
        .privacy-unlisted { background: rgba(250,204,21,.12); color: #facc15; border: 1px solid rgba(250,204,21,.2); }
        .privacy-private { background: rgba(248,113,113,.12); color: #f87171; border: 1px solid rgba(248,113,113,.2); }
        .collection-card p { color: #949494; font-size: 13px; line-height: 1.45; min-height: 55px; margin: 8px 0; }
        .collection-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .collection-meta b { color: #d4d4d4; font-size: 13px; }
        .collection-meta i { color: #8b8b8b; font-size: 12px; font-style: normal; }
        .load-more { max-width: 1240px; margin: 12px auto 0; border: 1px dashed #252525; border-radius: 12px; padding: 12px; text-align: center; color: #8c8c8c; background: #080808; position: relative; z-index: 1; }

        /* Modal (new dark design) */
        .modal-backdrop { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; min-height: 100dvh; padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom)); overflow-y: auto; background: rgba(0,0,0,.85); }
        .login-modal { position: relative; width: min(420px, 100%); max-height: calc(100dvh - 28px); overflow-y: auto; border: 1px solid #1f1f1f; border-radius: 16px; padding: 22px; background: #090909; color: #e5e7eb; }
        .modal-close { position: absolute; right: 12px; top: 12px; width: 38px; height: 38px; border: 1px solid #2b2b2b; border-radius: 12px; background: #0f0f0f; color: #d4d4d4; font-size: 24px; line-height: 1; cursor: pointer; transition: .15s; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { border-color: #3a3a3a; background: #171717; color: #fff; }

        /* Create button */
        .inline-btn-save { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d4; background: #111; padding: 8px 16px; font: inherit; font-size: 14px; transition: .15s; }
        .inline-btn-save:hover { border-color: #3a3a3a; background: #171717; color: #fff; }

        @media(max-width: 1024px) { .collection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media(max-width: 640px) { .collection-grid { grid-template-columns: 1fr; } }
        .skeleton-card { border: 1px solid #1f1f1f; background: #090909; border-radius: 14px; padding: 16px; }
        .skel-line { height: 14px; border-radius: 6px; background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: skel-shimmer 1.6s ease-in-out infinite; margin-bottom: 10px; }
        .skel-title { width: 65%; height: 18px; }
        .skel-text { width: 90%; height: 12px; }
        .skel-text.short { width: 55%; }
        @keyframes skel-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </main>
  );
}
