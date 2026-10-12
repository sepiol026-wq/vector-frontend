"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

let pending: Promise<boolean> | null = null;

export function bootstrapMiniAppSession(): Promise<boolean> {
  const tg = (window as any).Telegram?.WebApp;
  tg?.ready();
  if (!tg?.initData) return Promise.resolve(false);
  pending ??= fetch("/api/auth/miniapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ initData: tg.initData }),
  }).then(async response => {
    if (!response.ok || !(await response.json()).ok) throw new Error("miniapp_auth_failed");
    return true;
  }).finally(() => { pending = null; });
  return pending;
}

export function MiniAppAuth({ requireSession = false }: { requireSession?: boolean }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    bootstrapMiniAppSession().then(authenticated => {
      if (!active) return;
      if (authenticated) router.refresh();
      else if (requireSession) router.replace("/login?return_url=%2F");
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [requireSession, router]);
  return <main aria-busy={!failed} style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
    <div role="status">{failed ? <>Не удалось войти. Откройте приложение заново в Telegram. <a href="/login">Войти другим способом</a></> : "Vector ···"}</div>
  </main>;
}
