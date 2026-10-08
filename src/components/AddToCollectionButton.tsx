"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CollectionEditor } from "@/components/CollectionEditor";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { createRipple } from "@/lib/ripple";
import { toast } from "sonner";

type UserCollection = {
  slug: string;
  name: string;
  _count: { modules: number };
  has_module?: boolean;
};

type Props = {
  moduleName: string;
  owner: string;
  lang: "ru" | "en";
};

export function AddToCollectionButton({ moduleName, owner, lang }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-cache" });
        const d = (await r.json()) as { user?: { id: string }; id?: string };
        setAuthed(Boolean(d.user?.id ?? d.id));
      } catch { setAuthed(false); }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    setCollectionsLoading(true);
    void (async () => {
      try {
        const r = await fetch(`/api/collections/user/me?module=${encodeURIComponent(moduleName)}`, {
          cache: "no-cache",
        });
        if (!r.ok) return;
        const data = (await r.json()) as { collections: (UserCollection & { has_module?: boolean })[] };
        setCollections(data.collections.map(c => ({ slug: c.slug, name: c.name, _count: c._count, has_module: c.has_module })));
      } catch {} finally { setCollectionsLoading(false); }
    })();
  }, [open]);

  function handleClick() {
    if (!authed) { setShowAuth(true); return; }
    setOpen(true);
  }

  async function addTo(slug: string) {
    try {
      const r = await fetch(`/api/collections/${slug}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_name: moduleName, source_owner: owner }),
        cache: "no-cache",
      });
      if (r.status === 409) {
        toast.error(lang === "en" ? "Already in this collection" : "Уже в этой коллекции");
        return;
      }
      if (r.ok) {
        const rd = await fetch(`/api/collections/user/me?module=${encodeURIComponent(moduleName)}`, { cache: "no-cache" });
        if (rd.ok) {
          const data = (await rd.json()) as { collections: (UserCollection & { has_module?: boolean })[] };
          setCollections(data.collections.map(c => ({ slug: c.slug, name: c.name, _count: c._count, has_module: c.has_module })));
        }
        toast.success(lang === "en" ? "Added to collection" : "Добавлено в коллекцию");
      } else {
        toast.error(lang === "en" ? "Failed to add" : "Ошибка добавления");
      }
    } catch {
      toast.error(lang === "en" ? "Failed to add" : "Ошибка добавления");
    }
  }

  async function removeFrom(slug: string) {
    try {
      const r = await fetch(`/api/collections/${slug}/modules`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_name: moduleName, source_owner: owner }),
        cache: "no-cache",
      });
      if (!r.ok) throw new Error("remove_failed");
      const rd = await fetch(`/api/collections/user/me?module=${encodeURIComponent(moduleName)}`, { cache: "no-cache" });
      if (rd.ok) {
        const data = (await rd.json()) as { collections: (UserCollection & { has_module?: boolean })[] };
        setCollections(data.collections.map(c => ({ slug: c.slug, name: c.name, _count: c._count, has_module: c.has_module })));
      }
      toast.success(lang === "en" ? "Removed from collection" : "Убрано из коллекции");
    } catch {
      toast.error(lang === "en" ? "Failed to remove" : "Ошибка удаления");
    }
  }

  async function handleCreate(data: {
    name: string;
    description: string;
    privacy: string;
    show_author: boolean;
  }) {
    setLoading(true);
    try {
      const r = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        cache: "no-cache",
      });
      if (!r.ok) throw new Error("Create failed");
      const created = (await r.json()) as {
        collection: { slug: string; name: string };
      };
      await fetch(`/api/collections/${created.collection.slug}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_name: moduleName, source_owner: owner }),
        cache: "no-cache",
      });
      setCollections((prev) => [
        {
          slug: created.collection.slug,
          name: created.collection.name,
          _count: { modules: 1 },
          has_module: true,
        },
        ...prev,
      ]);
      setShowEditor(false);
      toast.success(lang === "en" ? "Collection created & module added" : "Коллекция создана, модуль добавлен");
    } catch {
      toast.error(lang === "en" ? "Failed to create" : "Ошибка создания");
    } finally {
      setLoading(false);
    }
  }

  const inCollections = collections.filter(c => c.has_module);
  const notInCollections = collections.filter(c => !c.has_module);

  return (
    <>
      <button
        className="add-to-collection-btn"
        onMouseDown={(e) => createRipple(e)}
        onClick={handleClick}
      >
        {lang === "en" ? "+ Add to Collection" : "+ В коллекцию"}
      </button>

      {showAuth ? (
        <AuthRequiredModal
          title={lang === "en" ? "Sign in with Telegram" : "Войдите через Telegram"}
          description={lang === "en" ? "Sign in to manage your collections." : "Войдите, чтобы управлять коллекциями."}
          onClose={() => setShowAuth(false)}
          lang={lang}
        />
      ) : null}

      {open ? createPortal(
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            {showEditor ? (
              <>
                <button
                  className="modal-close"
                  onMouseDown={(e) => createRipple(e)}
                  onClick={() => setShowEditor(false)}
                  aria-label={lang === "en" ? "Back" : "Назад"}
                  type="button"
                >
                  ←
                </button>
                <CollectionEditor
                  onSave={handleCreate}
                  onClose={() => setShowEditor(false)}
                  lang={lang}
                  embedded
                />
              </>
            ) : (
              <>
                <button
                  className="modal-close"
                  onMouseDown={(e) => createRipple(e)}
                  onClick={() => setOpen(false)}
                  aria-label={lang === "en" ? "Close" : "Закрыть"}
                  type="button"
                >
                  ×
                </button>
                <div className="hero-topline">
                  <span className="live-dot" />{" "}
                  {lang === "en" ? "My Collections" : "Мои коллекции"}
                </div>
                <h2>
                  {lang === "en"
                    ? "Add to Collection"
                    : "Добавить в коллекцию"}
                </h2>

                { }
                {inCollections.length > 0 ? (
                  <div className="collection-add-section">
                    <div className="collection-add-section-title">
                      {lang === "en" ? "Already in" : "Уже в коллекциях"}
                    </div>
                    {inCollections.map((c) => (
                      <div key={c.slug} className="collection-add-row added">
                        <div>
                          <strong>{c.name}</strong>
                          <small>
                            {c._count.modules}{" "}
                            {lang === "en" ? "modules" : "модулей"}
                          </small>
                        </div>
                        <button
                          onMouseDown={(e) => createRipple(e)}
                          onClick={() => removeFrom(c.slug)}
                          disabled={loading}
                          className="ctl-remove"
                        >
                          {lang === "en" ? "Remove" : "Убрать"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                { }
                {notInCollections.length > 0 ? (
                  <div className="collection-add-section">
                    <div className="collection-add-section-title">
                      {lang === "en" ? "Add to" : "Добавить в"}
                    </div>
                    {notInCollections.map((c) => (
                      <div key={c.slug} className="collection-add-row">
                        <div>
                          <strong>{c.name}</strong>
                          <small>
                            {c._count.modules}{" "}
                            {lang === "en" ? "modules" : "модулей"}
                          </small>
                        </div>
                        <button
                          onMouseDown={(e) => createRipple(e)}
                          onClick={() => addTo(c.slug)}
                          disabled={loading}
                        >
                          {lang === "en" ? "Add" : "+"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {collectionsLoading ? (
                  <div className="collection-add-loading">
                    <span className="cal-dot" /><span className="cal-dot" /><span className="cal-dot" />
                  </div>
                ) : collections.length === 0 ? (
                  <p className="collection-add-empty">
                    {lang === "en"
                      ? "No collections yet"
                      : "Пока нет коллекций"}
                  </p>
                ) : null}

                <div className="collection-add-actions">
                  <button
                    className="collection-add-create-btn"
                    onMouseDown={(e) => createRipple(e)}
                    onClick={() => setShowEditor(true)}
                  >
                    {lang === "en"
                      ? "Create new"
                      : "Создать новую"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}

      <style>{`
        .add-to-collection-btn {
          cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px;
          background: #111; color: #d4d4d4; padding: 6px 12px;
          font: inherit; font-size: 12px; transition: .15s ease;
          position: relative; overflow: hidden;
        }
        .add-to-collection-btn:hover {
          border-color: #3a3a3a; background: #171717; color: #fff;
        }
        .collection-add-section { margin-bottom: 14px; }
        .collection-add-section-title {
          font-size: 11px; color: #6b7280; text-transform: uppercase;
          letter-spacing: .08em; font-weight: 700; margin-bottom: 8px;
        }
        .collection-add-list {
          margin: 12px 0; max-height: 300px; overflow-y: auto;
          display: grid; gap: 8px;
        }
        .collection-add-empty {
          color: #8b8b8b; text-align: center; padding: 20px;
        }
        .collection-add-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 10px 12px; border-radius: 10px;
          background: #0f0f0f; border: 1px solid #1f1f1f;
        }
        .collection-add-row.added { border-color: rgba(74,222,128,.25); background: rgba(74,222,128,.03); }
        .collection-add-row strong { display: block; font-size: 14px; color: #e5e7eb; }
        .collection-add-row small { color: #8b8b8b; font-size: 11px; }
        .collection-add-row button {
          flex-shrink: 0; cursor: pointer; padding: 6px 14px; border-radius: 8px;
          border: 1px solid #2b2b2b; background: #171717;
          color: #d4d4d4; font: inherit; font-size: 12px; transition: .15s;
          position: relative; overflow: hidden;
        }
        .collection-add-row button:hover:not(:disabled) {
          border-color: #4ade80; color: #4ade80;
        }
        .collection-add-row button.ctl-remove:hover:not(:disabled) {
          border-color: #f87171; color: #f87171;
        }
        .collection-add-row button:disabled { opacity: .4; cursor: default; }
        .collection-add-actions {
          display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;
        }
        .collection-add-create-btn {
          cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px;
          color: #d4d4d4; background: #111; padding: 11px 15px;
          font: inherit; font-size: 14px; transition: .15s;
          position: relative; overflow: hidden;
        }
        .collection-add-create-btn:hover {
          border-color: #3a3a3a; background: #171717; color: #fff;
        }
        .collection-add-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 28px 0;
        }
        .cal-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #333;
          animation: cal-bounce 1.2s ease-in-out infinite;
        }
        .cal-dot:nth-child(2) { animation-delay: .15s; }
        .cal-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes cal-bounce {
          0%, 80%, 100% { transform: scale(.6); opacity: .3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
