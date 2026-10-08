"use client";

import { useEffect } from "react";

export function MiniAppAuth() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready();

    if (!tg?.initData) return;
    if (sessionStorage.getItem("ma_auth_done")) return;

    fetch("/api/me", { cache: "no-cache" })
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => {
        if (d?.user) {
          sessionStorage.setItem("ma_auth_done", "1");
          return;
        }

        return fetch("/api/auth/miniapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        });
      })
      .then(r => r?.json ? r.json() : null)
      .then((d: any) => {
        if (d?.ok) {
          sessionStorage.setItem("ma_auth_done", "1");
          window.location.reload();
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
