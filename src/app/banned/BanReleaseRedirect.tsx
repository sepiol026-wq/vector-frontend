"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const checkintervalms = 10_000;

type BanReleaseRedirectProps = {
  until: string | null;
};

export function BanReleaseRedirect({ until }: BanReleaseRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let checking = false;

    const checkStatus = async () => {
      if (checking || disposed) return;
      checking = true;
      try {
        const response = await fetch("/api/ban-watch", { cache: "no-store" });
        if (response.ok && (await response.json() as { released?: boolean }).released && !disposed) {
          router.replace("/");
          router.refresh();
        }
      } catch {
      } finally {
        checking = false;
      }
    };

    const interval = window.setInterval(checkStatus, checkintervalms);
    const expiresAt = until ? new Date(until).getTime() : Number.NaN;
    const expiryTimeout = Number.isNaN(expiresAt)
      ? undefined
      : window.setTimeout(checkStatus, Math.max(0, expiresAt - Date.now()) + 100);
    const onFocus = () => void checkStatus();
    void checkStatus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      if (expiryTimeout !== undefined) window.clearTimeout(expiryTimeout);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router, until]);

  return null;
}
