"use client";
import { useState } from "react";
import { PrivacySelect } from "@/components/PrivacySelect";
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

  const [showAuthor, setShowAuthor] = useState(
    initial?.show_author ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    if (saving) return;
    setSaveError("");
    if (!name.trim()) {
      setSaveError(lang === "en" ? "Name is required" : "Название обязательно");
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
      setSaveError(err?.message ?? (lang === "en" ? "Save failed" : "Ошибка сохранения"));
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
    <div aria-busy={saving}>
      <h2>{heading}</h2>
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
      <div className="collection-field">
        <span>{lang === "en" ? "Privacy" : "Приватность"}</span>
        <PrivacySelect value={privacy} onChange={setPrivacy} lang={lang} />
      </div>
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
          disabled={saving}
          className="collection-btn-cancel"
        >
          {embedded ? (lang === "en" ? "Back" : "Назад") : (lang === "en" ? "Cancel" : "Отмена")}
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

      {saveError ? <p role="alert" style={{ color: "#f87171" }}>{saveError}</p> : null}

    </div>
  );

  return form;
}
