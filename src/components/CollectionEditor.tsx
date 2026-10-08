"use client";
import { useEffect, useRef, useState } from "react";
import { createRipple } from "@/lib/ripple";
import { SkeletonBar } from "@/components/Skeleton";
import { toast } from "sonner";

type CollectionData = {
  name: string;
  description: string;
  privacy: "public" | "unlisted" | "private";
  show_author: boolean;
};

type Props = {
  initial?: Partial<CollectionData> & { slug?: string };
  onSave: (data: CollectionData) => Promise<void>;
  onClose: () => void;
  lang: "ru" | "en";

  embedded?: boolean;
};

export function CollectionEditor({
  initial,
  onSave,
  onClose,
  lang,
  embedded,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? "",
  );
  const [privacy, setPrivacy] = useState<
    "public" | "unlisted" | "private"
  >(initial?.privacy ?? "public");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const privacyRef = useRef<HTMLDivElement>(null);
  const [showAuthor, setShowAuthor] = useState(
    initial?.show_author ?? true,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (privacyRef.current && !privacyRef.current.contains(e.target as Node)) {
        setPrivacyOpen(false);
      }
    }
    if (privacyOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [privacyOpen]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error(
        lang === "en" ? "Name is required" : "Название обязательно",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        privacy,
        show_author: showAuthor,
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(
        err?.message ?? (lang === "en" ? "Save failed" : "Ошибка сохранения"),
      );
    } finally {
      setSaving(false);
    }
  }

  const heading = initial?.slug
    ? lang === "en" ? "Edit Collection" : "Редактировать коллекцию"
    : lang === "en" ? "New Collection" : "Новая коллекция";

  const form = (
    <>
      {!embedded ? (
        <h2>{heading}</h2>
      ) : (
        <div className="hero-topline" style={{ marginBottom: 6 }}>
          <span className="live-dot" /> {heading}
        </div>
      )}
      <label className="collection-field">
        <span>{lang === "en" ? "Name" : "Название"}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          placeholder={
            lang === "en"
              ? "My awesome picks"
              : "Мои крутые подборки"
          }
        />
      </label>
      <label className="collection-field">
        <span>{lang === "en" ? "Description" : "Описание"}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder={
            lang === "en"
              ? "A collection of must-have modules..."
              : "Коллекция мастхэв-модулей..."
          }
        />
      </label>
      <label className="collection-field">
        <span>{lang === "en" ? "Privacy" : "Приватность"}</span>
        <div className="collection-editor-select" ref={privacyRef}>
            <button
              type="button"
              className="ces-trigger"
              onMouseDown={(e) => createRipple(e)}
              onClick={() => setPrivacyOpen(o => !o)}
            >
            <span>{privacy === "public" ? (lang === "en" ? "Public" : "Публичная") : privacy === "unlisted" ? (lang === "en" ? "Unlisted" : "По ссылке") : lang === "en" ? "Private" : "Приватная"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`ces-chevron${privacyOpen ? " open" : ""}`}><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {privacyOpen ? (
            <ul className="ces-menu">
              <li className={privacy === "public" ? "active" : ""} onClick={() => { setPrivacy("public"); setPrivacyOpen(false); }}>
                <strong>{lang === "en" ? "Public" : "Публичная"}</strong>
                <small>{lang === "en" ? "Visible to all" : "Видна всем"}</small>
              </li>
              <li className={privacy === "unlisted" ? "active" : ""} onClick={() => { setPrivacy("unlisted"); setPrivacyOpen(false); }}>
                <strong>{lang === "en" ? "Unlisted" : "По ссылке"}</strong>
                <small>{lang === "en" ? "Only by link" : "Только по ссылке"}</small>
              </li>
              <li className={privacy === "private" ? "active" : ""} onClick={() => { setPrivacy("private"); setPrivacyOpen(false); }}>
                <strong>{lang === "en" ? "Private" : "Приватная"}</strong>
                <small>{lang === "en" ? "Only you" : "Только вы"}</small>
              </li>
            </ul>
          ) : null}
        </div>
      </label>
      <label className="collection-field collection-editor-checkbox">
        <input
          type="checkbox"
          checked={showAuthor}
          onChange={(e) => setShowAuthor(e.target.checked)}
        />
        <span>
          {lang === "en"
            ? "Show author on collection page"
            : "Показывать автора на странице коллекции"}
        </span>
      </label>
      <div className="collection-editor-actions">
        <button
          onMouseDown={(e) => createRipple(e)}
          onClick={onClose}
          className="collection-btn-cancel"
        >
          {lang === "en" ? "Cancel" : "Отмена"}
        </button>
        <button
          onMouseDown={(e) => createRipple(e)}
          onClick={handleSave}
          disabled={saving}
          className="collection-btn-save"
        >
          {saving
            ? <SkeletonBar width={80} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} />
            : initial?.slug
              ? lang === "en"
                ? "Save changes"
                : "Сохранить"
              : lang === "en"
                ? "Create"
                : "Создать"}
        </button>
      </div>

      <style>{`
        .collection-field {
          display: block; margin-bottom: 14px;
        }
        .collection-field > span {
          display: block; font-size: 12px; color: #9ca3af;
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px;
        }
        .collection-field input,
        .collection-field textarea,
        .collection-field select {
          width: 100%; padding: 10px 12px; border-radius: 10px;
          border: 1px solid #2b2b2b; background: #0f0f0f;
          color: #e5e7eb; font: inherit; font-size: 14px;
        }
        .collection-field textarea { resize: vertical; }
        .collection-editor-select { position: relative; width: 100%; }
        .ces-trigger {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 10px 12px; border-radius: 10px;
          border: 1px solid #2b2b2b; background: #0f0f0f;
          color: #e5e7eb; font: inherit; font-size: 14px; cursor: pointer;
          color-scheme: dark; outline: none; transition: .15s;
          position: relative; overflow: hidden;
        }
        .ces-trigger:hover { border-color: #3a3a3a; }
        .ces-chevron { flex-shrink: 0; color: #8b8b8b; transition: transform .2s; }
        .ces-chevron.open { transform: rotate(180deg); }
        .ces-menu {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #111; border: 1px solid #2b2b2b; border-radius: 10px;
          padding: 4px; z-index: 30; list-style: none; margin: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,.6);
        }
        .ces-menu li {
          padding: 10px 12px; border-radius: 8px; cursor: pointer;
          transition: background .12s; display: flex; flex-direction: column; gap: 2px;
        }
        .ces-menu li:hover { background: #1a1a1a; }
        .ces-menu li.active { background: rgba(139,92,246,.1); }
        .ces-menu li strong { font-size: 14px; color: #e5e7eb; }
        .ces-menu li small { font-size: 11px; color: #8b8b8b; }
        .collection-editor-checkbox {
          display: flex; align-items: center; gap: 10px;
        }
        .collection-editor-checkbox input {
          width: auto; accent-color: #8b5cf6;
        }
        .collection-editor-checkbox span {
          font-size: 14px; color: #d1d5db; text-transform: none; letter-spacing: normal;
        }
        .collection-editor-actions {
          display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;
        }
        .collection-btn-cancel {
          cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px;
          color: #d4d4d4; background: #0f0f0f; padding: 9px 13px;
          font: inherit; font-size: 14px; transition: .15s;
          position: relative; overflow: hidden;
        }
        .collection-btn-cancel:hover { border-color: #3a3a3a; background: #171717; color: #fff; }
        .collection-btn-save {
          cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px;
          color: #d4d4d4; background: #111; padding: 11px 15px;
          font: inherit; font-size: 14px; transition: .15s;
          position: relative; overflow: hidden;
        }
        .collection-btn-save:hover { border-color: #3a3a3a; background: #171717; color: #fff; }
        .collection-btn-save:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </>
  );

  return form;
}
