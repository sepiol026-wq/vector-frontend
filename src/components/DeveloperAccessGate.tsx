"use client";

import { useState } from "react";
import { SkeletonBar } from "@/components/Skeleton";
import { createRipple } from "@/lib/ripple";
import { toast } from "sonner";

export function DeveloperAccessGate({ mode }: { mode: "telegram" | "pow" }) {
  const [working, setWorking] = useState(false);
  async function unlock() {
    if (mode === "telegram") { window.location.assign(`/login?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    setWorking(true);
    try {
      const challengeResponse = await fetch("/api/developer-access", { cache: "no-store" });
      const challenge = await challengeResponse.json() as { challenge?: string };
      if (!challenge.challenge) throw new Error("challenge");
      let solution = 0;
      const encoder = new TextEncoder();
      for (;;) {
        const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${challenge.challenge}:${solution}`));
        const hex = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
        if (hex.startsWith("00000")) break;
        solution++;
      }
      const response = await fetch("/api/developer-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challenge: challenge.challenge, solution: String(solution) }) });
      if (!response.ok) throw new Error("proof");
      window.location.reload();
    } catch { toast.error("Не удалось подтвердить доступ. Попробуйте ещё раз."); setWorking(false); }
  }
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050505", color: "#fff" }}><section style={{ width: "min(440px,100%)", border: "1px solid #292929", borderRadius: 18, padding: 28, background: "#0d0d0d" }}><div style={{ fontSize: 11, letterSpacing: ".16em", color: "#9a9a9a", marginBottom: 14 }}>VECTOR / RESTRICTED</div><h1 style={{ margin: "0 0 10px", fontSize: 27 }}>Профиль разработчика</h1><p style={{ margin: "0 0 22px", color: "#aaa", lineHeight: 1.55 }}>{mode === "telegram" ? "Страница доступна только после входа через Telegram." : "Подтвердите доступ вычислительным доказательством работы."}</p><button onClick={unlock} onMouseDown={(e) => createRipple(e)} disabled={working} style={{ width: "100%", border: 0, borderRadius: 10, padding: "13px 16px", background: "#fff", color: "#000", fontWeight: 800, cursor: working ? "wait" : "pointer" }}>{working ? <SkeletonBar width={90} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : mode === "telegram" ? "Войти через Telegram" : "Подтвердить доступ"}</button></section></main>;
}
