"use client";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { OfficialBadge } from "@/components/OfficialBadge";
import { createRipple } from "@/lib/ripple";

type CollectionCardData = {
  slug: string;
  name: string;
  description: string;
  privacy: string;
  show_author?: boolean;
  created_at?: string;
  updated_at?: string;
  _count: { modules: number };
  owner?: { telegram_id: string; display_name?: string; photo_url?: string | null; is_official_developer?: boolean };
};

export function CollectionCard({
  collection,
  lang,
}: {
  collection: CollectionCardData;
  lang: "ru" | "en";
}) {
  return (
    <article className="collection-card" onMouseDown={(e) => createRipple(e)}>
      <Link
        href={`/collections/${collection.slug}`}
        className="collection-card-main"
      >
        <span className="collection-head">
          <strong>{collection.name}</strong>
          <span className={`privacy-badge privacy-${collection.privacy}`}>
            {collection.privacy === "public"
              ? lang === "en"
                ? "Public"
                : "Публичная"
              : collection.privacy === "unlisted"
                ? lang === "en"
                  ? "Unlisted"
                  : "По ссылке"
                : lang === "en"
                  ? "Private"
                  : "Приватная"}
          </span>
        </span>
        <p>
          {collection.description ||
            (lang === "en" ? "No description" : "Без описания")}
        </p>
        <span className="collection-meta">
          <b>
            {collection._count.modules}{" "}
            {collection._count.modules === 1
              ? lang === "en"
                ? "module"
                : "модуль"
              : lang === "en"
                ? "modules"
                : "модулей"}
          </b>
          {collection.show_author && collection.owner?.telegram_id ? (
            <i style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><UserAvatar size={24} user={{ display_name: collection.owner.display_name ?? `tg:${collection.owner.telegram_id}`, photo_url: collection.owner.photo_url }} />{collection.owner.display_name ?? `tg:${collection.owner.telegram_id}`}{collection.owner.is_official_developer ? <OfficialBadge size={14} /> : null}</i>
          ) : null}
        </span>
      </Link>
    </article>
  );
}
