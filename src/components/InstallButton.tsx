"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRipple } from "@/lib/ripple";
import { SkeletonBar } from "@/components/Skeleton";
import { toast } from "sonner";

type Props = {
  owner: string;
  moduleName: string;
  dlCommand: string;
  lang?: "ru" | "en";
};

export function InstallButton({ owner, moduleName, dlCommand, lang = "ru" }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error" | "nouserbot">("idle");
  const [showModal, setShowModal] = useState(false);
  const [modalReason, setModalReason] = useState<"timeout" | "blocked">("timeout");
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [botUsername, setBotUsername] = useState("");

  useEffect(() => {
    fetch("/api/tg-bot").then(r => r.json()).then(d => {
      if (d.username) setBotUsername(d.username);
    }).catch(() => {});
  }, []);

  async function handleInstall(e: React.MouseEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const r = await fetch("/api/tg-bot/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, module_name: moduleName }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        if ((errData as any).error) { setShowModal(true); setModalReason("blocked"); setState("nouserbot"); return; }
        setState("error"); setTimeout(() => setState("idle"), 2500); toast.error(lang === "en" ? "Install failed" : "Ошибка установки"); return;
      }
      const data = await r.json();
      if (!data.request_id) { setState("error"); setTimeout(() => setState("idle"), 2500); toast.error(lang === "en" ? "Install failed" : "Ошибка установки"); return; }

      const om = encodeURIComponent(`${owner}|${moduleName}`);
      for (let i = 0; i < 14; i++) {
        await new Promise(res => setTimeout(res, 1500));
        const s = await fetch(`/api/tg-bot/install?id=${data.request_id}&om=${om}`);
        const st = await s.json();
        if (st.status === "ok") { setState("ok"); setTimeout(() => setState("idle"), 3000); toast.success(lang === "en" ? "Module installed" : "Модуль установлен"); return; }
        if (st.status === "error") { setState("error"); setTimeout(() => setState("idle"), 2500); toast.error(lang === "en" ? "Install failed" : "Ошибка установки"); return; }
      }
      setState("nouserbot");
      setModalReason("timeout");
      setShowModal(true);
    } catch {
      setShowModal(true); setModalReason("blocked"); setState("nouserbot");
    }
  }

  async function copyDl() {
    try {
      await navigator.clipboard.writeText(dlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {   }
  }

  return (
    <>
      <button
        onClick={handleInstall}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setPressing(false); }}
        onMouseDown={(e) => { setPressing(true); createRipple(e); }}
        onMouseUp={() => setPressing(false)}
        disabled={state !== "idle"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 20px", borderRadius: 999,
          border: `1px solid ${state !== "idle" ? "rgba(255,255,255,.08)" : hover ? "rgba(74,222,128,.3)" : "rgba(255,255,255,.08)"}`,
          background: state !== "idle" ? "rgba(8,8,8,.72)" : hover ? "rgba(74,222,128,.08)" : "rgba(8,8,8,.72)",
          backdropFilter: "blur(18px)",
          color: state === "ok" ? "#4ade80" : state === "error" || state === "nouserbot" ? "#f87171" : hover ? "#4ade80" : "#d4d4d4",
          font: "inherit", fontSize: 14, fontWeight: 600,
          cursor: state !== "idle" ? "default" : "pointer",
          transition: "all .18s ease",
          opacity: state !== "idle" ? 0.6 : 1,
          transform: pressing ? "scale(.97)" : hover ? "translateY(-1px)" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          {state === "loading" ? <SkeletonBar width={70} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> :
           state === "ok" ? (lang === "en" ? "\u2713 Installed" : "\u2713 Установлен") :
           state === "error" ? (lang === "en" ? "\u2715 Failed" : "\u2715 Ошибка") :
           state === "nouserbot" ? (lang === "en" ? "\u2715 No response" : "\u2715 Нет ответа") :
           lang === "en" ? "Install" : "Установить"}
        </span>
      </button>

      {showModal && createPortal((
        <div style={{
          position: "fixed", inset: 0, zIndex: 2147483647,
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100dvh", overflowY: "auto",
          background: "rgba(0,0,0,.85)", padding: "max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))"
        }} onClick={() => setShowModal(false)}>
          <div style={{
            position: "relative", width: "min(420px, 100%)",
            border: "1px solid #1f1f1f", borderRadius: 16, padding: 22,
            background: "#090909"
          }} onClick={e => e.stopPropagation()}>
            <button onMouseDown={(e) => createRipple(e)} onClick={() => setShowModal(false)} style={{
              position: "absolute", right: 12, top: 12,
              width: 38, height: 38, border: "1px solid #2b2b2b", borderRadius: 12,
              background: "#0f0f0f", color: "#d4d4d4", fontSize: 24, lineHeight: 1, cursor: "pointer"
            }}>×</button>
            <h2 style={{ margin: "12px 52px 10px 0", fontSize: "clamp(22px, 5vw, 28px)", letterSpacing: "-.03em", color: "#fff" }}>
              {lang === "en" ? "Module not installed" : "Модуль не установлен"}
            </h2>
            {modalReason === "blocked" && (
              <p style={{ color: "#f87171", lineHeight: 1.5, margin: "0 0 12px", fontSize: 13 }}>
                {lang === "en"
                  ? "Bot can't reach you. Start a chat with the bot first:"
                  : "Бот не может вам написать. Начните диалог с ботом:"}
                {" "}
                {botUsername && (
                  <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" style={{ color: "#4ade80" }}>
                    @{botUsername}
                  </a>
                )}
              </p>
            )}
            <p style={{ color: "#d4d4d4", lineHeight: 1.5, margin: "0 0 18px" }}>
              {lang === "en"
                ? "Install the module in your userbot with this command:"
                : "Установите модуль в юзербот этой командой:"}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <code style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.04)", color: "#4ade80",
                fontSize: 13, overflowX: "auto", whiteSpace: "nowrap"
              }}>
                dlm https://www.0xvector.lol/modules/sepiol026-wq/Vector/source
              </code>
              <button onMouseDown={(e) => createRipple(e)} onClick={copyDl} style={{
                padding: "10px 14px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(8,8,8,.72)", color: copied ? "#4ade80" : "#d4d4d4",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
              }}>
                {copied ? (lang === "en" ? "Copied!" : "Скопировано!") : (lang === "en" ? "Copy" : "Копировать")}
              </button>
            </div>
            <button onMouseDown={(e) => createRipple(e)} onClick={() => { setShowModal(false); setState("idle"); }} style={{
              width: "100%", padding: "10px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(148,163,184,.12)", color: "#d4d4d4",
              fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>
              {lang === "en" ? "OK, installed" : "Ок, установил"}
            </button>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
