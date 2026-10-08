"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ModuleBanner } from "@/components/ModuleBanner";
import { TagLink } from "@/components/TagLink";
import { parseTags } from "@/lib/tags";
import { InstallAllButton } from "@/components/InstallAllButton";
import { SkeletonBar } from "@/components/Skeleton";
import { createRipple } from "@/lib/ripple";
import Sortable from "sortablejs";
import { toast } from "sonner";

type ModuleEntry = {
  module: {
    id: string;
    name: string;
    class_name: string;
    developer: string;
    source_owner?: string;
    description: string;
    banner: string | null;
    version: string;
    source_url?: string;
    tags?: string | null;
  } | null;
};

type CollectionMeta = {
  id: string;
  slug: string;
  name: string;
  description: string;
  privacy: "public" | "unlisted" | "private";
  show_author: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner: { telegram_id: string };
  _count: { modules: number };
};

type NavUser = {
  display_name: string;
  username: string | null;
  photo_url: string | null;
};

type Props = {
  initialMeta: CollectionMeta;
  initialLang?: "ru" | "en";
};

function readLang(): "ru" | "en" {
  if (typeof window === "undefined") return "ru";
  const cookieLang = document.cookie
    .split("; ")
    .find((row) => row.startsWith("vector_lang="))
    ?.split("=")[1];
  return cookieLang === "en" ? "en" : "ru";
}

const modulesperpage = 500;

export function CollectionDetailContent({
  initialMeta,
  initialLang,
}: Props) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [lang, setLang] = useState<"ru" | "en">(initialLang ?? readLang);

  useEffect(() => {
    const syncLang = () => setLang(readLang());
    syncLang();
    window.addEventListener("vector-lang-change", syncLang as EventListener);
    return () => window.removeEventListener("vector-lang-change", syncLang as EventListener);
  }, []);

  const [meta] = useState<CollectionMeta>(initialMeta);
  const [navUser, setNavUser] = useState<NavUser | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [modules, setModules] = useState<ModuleEntry[]>([]);
  const [modulesTotal, setModulesTotal] = useState(meta._count.modules);
  const [modulesPage, setModulesPage] = useState(0);
  const [hasMore, setHasMore] = useState(meta._count.modules > 0);
  const [loadingModules, setLoadingModules] = useState(true);

  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [showAddModules, setShowAddModules] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; class_name: string; developer: string; version: string; description: string }[]
  >([]);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [searchingModules, setSearchingModules] = useState(false);
  const [addingModules, setAddingModules] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivacy, setEditPrivacy] = useState<"public" | "unlisted" | "private">("public");
  const [editShowAuthor, setEditShowAuthor] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const privacyRef = useRef<HTMLDivElement>(null);

  const loadModulesPage = useCallback(
    async (page: number, append = false) => {
      setLoadingModules(true);
      try {
        const r = await fetch(
          `/api/collections/${encodeURIComponent(slug)}/modules?page=${page}&limit=${modulesperpage}`,
          { cache: "no-cache" },
        );
        if (!r.ok) {
          setNotFound(true);
          return;
        }
        const data = (await r.json()) as {
          ok: boolean;
          modules: ModuleEntry[];
          total: number;
          has_more: boolean;
        };
        setModules((prev) => (append ? [...prev, ...data.modules] : data.modules));
        setModulesTotal(data.total);
        setHasMore(data.has_more);
        setModulesPage(page);
      } catch {
        setNotFound(true);
      } finally {
        setLoadingModules(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    loadModulesPage(1);
    fetch("/api/me", { cache: "no-cache" })
      .then((r) => r.ok ? r.json() : null)
      .then((d: any) => {
        if (d?.user) {
          setCurrentUser(d.user.id ?? null);
          if (d.user.display_name) {
            setNavUser({
              display_name: d.user.display_name,
              username: d.user.username ?? null,
              photo_url: d.user.photo_url ?? null,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const loadMore = useCallback(() => {
    loadModulesPage(modulesPage + 1, true);
  }, [modulesPage, loadModulesPage]);

  async function refreshModules() {
    const r = await fetch(
      `/api/collections/${encodeURIComponent(slug)}/modules?page=1&limit=${Math.max(modules.length, modulesperpage)}`,
      { cache: "no-cache" },
    );
    if (!r.ok) return;
    const data = (await r.json()) as {
      ok: boolean;
      modules: ModuleEntry[];
      total: number;
      has_more: boolean;
    };
    setModules(data.modules);
    setModulesTotal(data.total);
    setHasMore(data.has_more);
    setModulesPage(1);
  }

  useEffect(() => {
    if (!showAddModules || !moduleSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingModules(true);
      try {
        const r = await fetch(
          `/api/search?q=${encodeURIComponent(moduleSearch.trim())}&limit=20`,
          { cache: "no-cache", signal: ctrl.signal },
        );
        if (r.ok) {
          const data = (await r.json()) as {
            results: { name: string; class_name: string; developer: string; version: string; description: string }[];
          };
          setSearchResults(data.results.filter((m) => !modules.some((e) => e.module?.name === m.name)));
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") toast.error(lang === "en" ? "Search failed" : "Ошибка поиска");
      } finally {
        if (!ctrl.signal.aborted) setSearchingModules(false);
      }
    }, 200);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [moduleSearch, showAddModules, lang, modules, slug]);

  async function handleAddModules() {
    if (selectedNames.size === 0) return;
    setAddingModules(true);
    let failed = 0;
    const names = Array.from(selectedNames);
    for (const name of names) {
      try {
        const r = await fetch(`/api/collections/${encodeURIComponent(slug)}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module_name: name }),
          cache: "no-cache",
        });
        if (!r.ok) failed++;
      } catch { failed++; }
    }
    const added = names.length - failed;
    if (failed > 0)
      toast.error(lang === "en" ? `Failed to add ${failed} module(s)` : `Не удалось добавить ${failed} модулей`);
    else
      toast.success(lang === "en" ? `Added ${added} module(s)` : `Добавлено ${added} модулей`);
    setAddingModules(false);
    setSelectedNames(new Set());
    setShowAddModules(false);
    await refreshModules();
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (privacyRef.current && !privacyRef.current.contains(e.target as Node)) setPrivacyOpen(false);
    }
    if (privacyOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [privacyOpen]);

  const isOwner = !!currentUser && meta?.owner_id === currentUser;

  function startEditing() {
    setEditName(meta.name);
    setEditDesc(meta.description);
    setEditPrivacy(meta.privacy);
    setEditShowAuthor(meta.show_author);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveEditing() {
    if (!editName.trim()) {
      toast.error(lang === "en" ? "Name is required" : "Название обязательно");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/collections/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), privacy: editPrivacy, show_author: editShowAuthor }),
        cache: "no-cache",
      });
      if (!r.ok) throw new Error("Update failed");
      setEditing(false);
      toast.success(lang === "en" ? "Collection updated" : "Коллекция обновлена");
      window.location.reload();
    } catch {
      toast.error(lang === "en" ? "Failed to save" : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm() { setShowDeleteConfirm(true); }
  function closeDeleteConfirm() { setShowDeleteConfirm(false); }

  async function handleDelete() {
    setDeleting(true);
    setShowDeleteConfirm(false);
    try {
      const r = await fetch(`/api/collections/${encodeURIComponent(slug)}`, { method: "DELETE", cache: "no-cache" });
      if (r.ok) {
        toast.success(lang === "en" ? "Collection deleted" : "Коллекция удалена");
        router.push("/");
      } else {
        toast.error(lang === "en" ? "Failed to delete collection" : "Не удалось удалить коллекцию");
      }
    } catch {
      toast.error(lang === "en" ? "Failed to delete collection" : "Не удалось удалить коллекцию");
    } finally { setDeleting(false); }
  }

  async function handleRemoveModule(moduleName: string) {
    setRemovingModule(moduleName);
    try {
      const r = await fetch(`/api/collections/${encodeURIComponent(slug)}/modules`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_name: moduleName }),
        cache: "no-cache",
      });
      if (r.ok) {
        toast.success(lang === "en" ? "Module removed" : "Модуль убран");
      } else {
        toast.error(lang === "en" ? "Failed to remove module" : "Не удалось убрать модуль");
      }
      await refreshModules();
    } catch {
      toast.error(lang === "en" ? "Failed to remove module" : "Не удалось убрать модуль");
    } finally {
      setRemovingModule(null);
    }
  }

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      const r = await fetch(`/api/collections/${encodeURIComponent(slug)}/download`);
      if (!r.ok) {
        toast.error(lang === "en" ? "Download failed. Try again later." : "Ошибка скачивания. Попробуйте позже.");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(lang === "en" ? "Download failed. Try again later." : "Ошибка скачивания. Попробуйте позже.");
    } finally {
      setDownloading(false);
    }
  }

  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const modulesRef = useRef(modules);
  modulesRef.current = modules;

  useEffect(() => {
    if (!isOwner || !gridRef.current) return;
    const el = gridRef.current;
    sortableRef.current = Sortable.create(el, {
      animation: 180,
      easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      draggable: ".module-card",
      delay: 300,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      onEnd: async (evt) => {
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
        const mods = [...modulesRef.current];
        const [moved] = mods.splice(evt.oldIndex, 1);
        if (!moved) return;
        mods.splice(evt.newIndex, 0, moved);
        setModules(mods);
        try {
          await fetch(`/api/collections/${encodeURIComponent(slug)}/modules/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ordered_ids: mods.map((m) => m.module?.id ?? "").filter(Boolean) }),
            cache: "no-cache",
          });
        } catch {
          toast.error(lang === "en" ? "Failed to reorder modules" : "Не удалось изменить порядок");
        }
      },
    });
    return () => { sortableRef.current?.destroy(); sortableRef.current = null; };
  }, [isOwner, slug]);

  if (notFound) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#050816", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 99999, fontFamily: "Inter, ui-sans-serif, sans-serif", color: "#fff" }}>
        <h1 style={{ fontSize: 42 }}>404</h1>
        <p style={{ color: "#8b8b8b" }}>{lang === "en" ? "Collection not found or private." : "Коллекция не найдена или приватна."}</p>
        <Link href="/collections" style={{ color: "#8b8b8b" }}>{lang === "en" ? "← Back to collections" : "← К коллекциям"}</Link>
      </div>
    );
  }

  const privacyLabel = (p: string) =>
    p === "public" ? (lang === "en" ? "Public" : "Публичная") :
    p === "unlisted" ? (lang === "en" ? "Unlisted" : "По ссылке") :
    lang === "en" ? "Private" : "Приватная";

  return (
    <>
      <NavBar
        user={navUser}
        backHref="/?tab=collections"
        tabs={[
          { label: lang === "en" ? "Catalog" : "Каталог", href: "/" },
          { label: lang === "en" ? "Stats" : "Статистика", href: "/?tab=stats" },
          { label: lang === "en" ? "Collections" : "Коллекции", href: "/?tab=collections" },
        ]}
        lang={lang}
      />

      { }
      <section className="hero-card">
        <div className="hero-topline"><span className="live-dot" /><span>{lang === "en" ? "Collection" : "Коллекция"}</span></div>
        <div className="hero-content">
          <div>
            {editing ? (
              <div className="inline-edit-form">
                <label className="inline-field"><span>{lang === "en" ? "Name" : "Название"}</span><input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={200} className="inline-input-name" autoFocus /></label>
                <label className="inline-field"><span>{lang === "en" ? "Description" : "Описание"}</span><textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={2000} rows={3} className="inline-input-desc" /></label>
              </div>
            ) : (
              <>
                <h1>{meta.name}</h1>
                <p className="description">{meta.description || (lang === "en" ? "No description" : "Без описания")}</p>
              </>
            )}
          </div>
          <div className="meta-panel">
            <div><span>{lang === "en" ? "Modules" : "Модулей"}</span><strong>{modulesTotal}</strong></div>
            {editing ? (
              <>
                <div className="meta-panel-edit">
                  <span>{lang === "en" ? "Privacy" : "Приватность"}</span>
                  <div className="custom-select" ref={privacyRef}>
                    <button type="button" className="custom-select-trigger" onClick={() => setPrivacyOpen((o) => !o)} onMouseDown={(e) => createRipple(e)}>
                      <span>{privacyLabel(editPrivacy)}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`custom-select-chevron${privacyOpen ? " open" : ""}`}><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {privacyOpen ? (
                      <ul className="custom-select-menu">
                        {(["public", "unlisted", "private"] as const).map((p) => (
                          <li key={p} className={editPrivacy === p ? "active" : ""} onClick={() => { setEditPrivacy(p); setPrivacyOpen(false); }} onMouseDown={(e) => createRipple(e)}>
                            <strong>{privacyLabel(p)}</strong>
                            <small>{p === "public" ? (lang === "en" ? "Visible to all" : "Видна всем") : p === "unlisted" ? (lang === "en" ? "Only by direct link" : "Только по прямой ссылке") : (lang === "en" ? "Only you" : "Только вы")}</small>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="meta-panel-edit">
                  <label className="inline-checkbox"><input type="checkbox" checked={editShowAuthor} onChange={(e) => setEditShowAuthor(e.target.checked)} /><span>{lang === "en" ? "Show author" : "Показывать автора"}</span></label>
                </div>
              </>
            ) : (
              <>
                <div><span>{lang === "en" ? "Privacy" : "Приватность"}</span><strong>{privacyLabel(meta.privacy)}</strong></div>
                {meta.show_author ? <div><span>{lang === "en" ? "Author" : "Автор"}</span><strong>{meta.owner.telegram_id}</strong></div> : null}
              </>
            )}
          </div>
        </div>
        {editing ? (
          <div className="inline-edit-actions">
            <button className="inline-btn-cancel" onClick={cancelEditing} onMouseDown={(e) => createRipple(e)}>{lang === "en" ? "Cancel" : "Отмена"}</button>
            <button className="inline-btn-save" onClick={saveEditing} onMouseDown={(e) => createRipple(e)} disabled={saving}>{saving ? <SkeletonBar width={80} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? "Save changes" : "Сохранить")}</button>
          </div>
        ) : null}
      </section>

      { }
      {isOwner && !editing ? (
        <section className="glass-card">
          <div className="section-heading"><span>{lang === "en" ? "Manage collection" : "Управление коллекцией"}</span></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="inline-btn-save" onClick={startEditing} onMouseDown={(e) => createRipple(e)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {lang === "en" ? "Edit details" : "Редактировать"}
            </button>
            <button className="inline-btn-save" onClick={() => { setShowAddModules(true); setSelectedNames(new Set()); setModuleSearch(""); setSearchResults([]); }} onMouseDown={(e) => createRipple(e)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {lang === "en" ? "Add modules" : "Добавить модули"}
            </button>
            <span className="drag-hint">{lang === "en" ? "Drag modules to reorder" : "Перетаскивай модули для сортировки"}</span>
          </div>
        </section>
      ) : null}

      { }
      {editing ? (
        <section className="glass-card"><div className="section-heading"><span>{lang === "en" ? "Danger zone" : "Опасная зона"}</span></div>
          <button className="inline-btn-danger" onClick={openDeleteConfirm} onMouseDown={(e) => createRipple(e)} disabled={deleting}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {deleting ? <SkeletonBar width={90} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? "Delete collection" : "Удалить коллекцию")}
          </button>
        </section>
      ) : null}

      { }
      {modulesTotal > 0 ? (
        <section style={{ maxWidth: 1180, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          <InstallAllButton modules={modules.filter(m => m.module != null).map(m => ({ developer: m.module!.source_owner || m.module!.developer, name: m.module!.name }))} lang={lang} />
          <button onClick={handleDownloadAll} onMouseDown={(e) => createRipple(e)} className="btn-dl-collection" disabled={downloading}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}><path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {downloading ? <SkeletonBar width={90} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : `${lang === "en" ? "Download all" : "Скачать всё"} (${modulesTotal})`}
          </button>
        </section>
      ) : null}

      { }
      <section className="collection-module-grid" ref={isOwner ? gridRef : undefined}>
        {loadingModules && modules.length === 0 && modulesTotal > 0 ? (
          Array.from({ length: Math.min(modulesTotal, 6) }, (_, i) => (
            <div key={i} className="module-card" style={{ cursor: "default" }}>
              <div style={{ height: 110, borderRadius: 10, background: "#111", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ height: 18, width: "55%", borderRadius: 6, background: "#151515" }} />
                <div style={{ height: 10, width: 40, borderRadius: 4, background: "#111" }} />
              </div>
              <div style={{ height: 11, width: "40%", borderRadius: 3, background: "#111", marginBottom: 6 }} />
              <div style={{ height: 13, width: "90%", borderRadius: 4, background: "#0f0f0f", marginBottom: 4 }} />
              <div style={{ height: 13, width: "70%", borderRadius: 4, background: "#0f0f0f", marginBottom: 10 }} />
              <div style={{ height: 12, width: "35%", borderRadius: 4, background: "#111" }} />
            </div>
          ))
        ) : modules.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: 40, gridColumn: "1 / -1" }}>
            <p className="muted">{lang === "en" ? "This collection is empty." : "Коллекция пуста."}</p>
          </div>
        ) : (
          modules.map((entry, idx) => {
            if (!entry?.module) return null;
            const m = entry.module;
            return (
              <article key={m.id} className="module-card" onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("a,button")) createRipple(e); }}>
                <Link className="module-card-main" href={m.source_url ?? `/modules/unknown/${encodeURIComponent(m.name)}/source`} prefetch={false}>
                  <ModuleBanner src={m.banner} className="module-banner-card" />
                  <span className="module-head"><strong>{m.name}</strong><em>v{m.version}</em></span>
                  <span className="module-class">{m.class_name}</span>
                  <p>{m.description && m.description.length > 145 ? `${m.description.slice(0, 145).trim()}…` : m.description || (lang === "en" ? "Description is not added yet." : "Описание пока не добавлено.")}</p>
                  {parseTags(m.tags).length ? <span className="module-tags">{parseTags(m.tags).map((tag, tagIndex) => <TagLink key={tag} tag={tag} index={tagIndex} onClick={(event) => event.stopPropagation()} />)}</span> : null}
                  <span className="module-meta"><b>{m.developer}</b></span>
                </Link>
                {isOwner ? (
                  <span className="module-actions">
                    <button onClick={() => handleRemoveModule(m.name)} onMouseDown={(e) => createRipple(e)} disabled={removingModule === m.name} className="module-remove-btn">
                      {removingModule === m.name ? <SkeletonBar width={52} height={10} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : lang === "en" ? "Remove" : "Убрать"}
                    </button>
                  </span>
                ) : null}
                {isOwner ? (
                  <span className="module-drag-handle" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="3" r="1.5" fill="currentColor"/><circle cx="11" cy="3" r="1.5" fill="currentColor"/><circle cx="5" cy="8" r="1.5" fill="currentColor"/><circle cx="11" cy="8" r="1.5" fill="currentColor"/><circle cx="5" cy="13" r="1.5" fill="currentColor"/><circle cx="11" cy="13" r="1.5" fill="currentColor"/></svg>
                  </span>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      { }
      {hasMore ? (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={loadMore} onMouseDown={(e) => createRipple(e)} disabled={loadingModules}>
            {loadingModules ? <SkeletonBar width={120} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? `Load more (${modulesTotal - modules.length} left)` : `Загрузить ещё (осталось ${modulesTotal - modules.length})`)}
          </button>
        </div>
      ) : null}

      { }
      {showAddModules ? createPortal(
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowAddModules(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)" }}>
            <button className="modal-close" onClick={() => setShowAddModules(false)} onMouseDown={(e) => createRipple(e)} aria-label={lang === "en" ? "Close" : "Закрыть"} type="button">×</button>
            <div className="hero-topline"><span className="live-dot" /> {lang === "en" ? "Add modules to collection" : "Добавить модули в коллекцию"}</div>
            <h2 style={{ margin: "12px 0 16px", fontSize: "clamp(24px, 5vw, 36px)" }}>{meta.name}</h2>
            <label className={`mass-add-search${moduleSearch ? " active" : ""}${searchingModules ? " loading" : ""}`}>
              <span className="mass-add-dot" />
              <input value={moduleSearch} onChange={(e) => { setModuleSearch(e.target.value); setSelectedNames(new Set()); }} placeholder={searchingModules ? "" : moduleSearch ? `${searchResults.length} ${lang === "en" ? "modules found" : "модулей найдено"}` : lang === "en" ? "Search modules, classes, developers…" : "Поиск по модулям, классам, разработчикам…"} autoFocus />
            </label>
            <div className="mass-add-list">
              {moduleSearch.trim() && searchResults.length === 0 && !searchingModules ? (
                <p className="mass-add-empty">{lang === "en" ? "Nothing found" : "Ничего не найдено"}</p>
              ) : searchResults.map((m) => {
                const sel = selectedNames.has(m.name);
                return (
                  <div key={m.name} className={`mass-add-row${sel ? " selected" : ""}`} onClick={() => { const next = new Set(selectedNames); sel ? next.delete(m.name) : next.add(m.name); setSelectedNames(next); }} onMouseDown={(e) => createRipple(e)}>
                    <div className="mass-add-row-info"><strong>{m.name}</strong><small>{m.developer} · {m.class_name} · v{m.version}</small></div>
                    <span className={`mass-add-check${sel ? " on" : ""}`}>{sel ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}</span>
                  </div>
                );
              })}
            </div>
            {selectedNames.size > 0 ? (
              <div className="mass-add-actions"><span>{selectedNames.size} {lang === "en" ? "selected" : "выбрано"}</span><button className="inline-btn-save" onClick={handleAddModules} onMouseDown={(e) => createRipple(e)} disabled={addingModules}>{addingModules ? <SkeletonBar width={90} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? "Add selected" : "Добавить выбранные")}</button></div>
            ) : null}
          </div>
        </div>,
        document.body,
      ) : null}

      { }
      {showDeleteConfirm ? createPortal(
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={closeDeleteConfirm}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()} style={{ width: "min(380px, 100%)" }}>
            <button className="modal-close" onClick={closeDeleteConfirm} onMouseDown={(e) => createRipple(e)} aria-label={lang === "en" ? "Close" : "Закрыть"} type="button">×</button>
            <h2 style={{ margin: "12px 0 8px", fontSize: "clamp(22px, 4vw, 28px)", letterSpacing: "-.03em" }}>{lang === "en" ? "Delete collection?" : "Удалить коллекцию?"}</h2>
            <p style={{ color: "#8b8b8b", marginBottom: 20, lineHeight: 1.5 }}>{lang === "en" ? "This action cannot be undone. All modules will be removed from this collection." : "Это действие нельзя отменить. Все модули будут удалены из коллекции."}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="inline-btn-cancel" onClick={closeDeleteConfirm} onMouseDown={(e) => createRipple(e)}>{lang === "en" ? "Cancel" : "Отмена"}</button>
              <button className="inline-btn-danger" onClick={handleDelete} onMouseDown={(e) => createRipple(e)} disabled={deleting}>{deleting ? <SkeletonBar width={70} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? "Delete" : "Удалить")}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
