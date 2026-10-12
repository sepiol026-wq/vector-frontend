"use client";

import { useState } from "react";

type AvatarUser = { telegram_id?: string; display_name: string; photo_url?: string | null };

export function UserAvatar({ user, className = "", size }: { user: AvatarUser; className?: string; size?: number }) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const initial = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(user.display_name.trim().toUpperCase())[Symbol.iterator]().next().value?.segment || "?";
  const photo = user.photo_url && user.photo_url !== failedPhoto ? user.photo_url : null;
  return <span className={className} role="img" aria-label={user.display_name} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, width: size, height: size, borderRadius: "50%", background: "linear-gradient(145deg,#65b7f3,#377fcb)", color: "#fff", fontWeight: 600 }}>
    {photo ? <img key={photo} src={photo} alt="" ref={image => { if (image?.complete && image.naturalWidth === 0) setFailedPhoto(photo); }} onError={() => setFailedPhoto(photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
  </span>;
}
