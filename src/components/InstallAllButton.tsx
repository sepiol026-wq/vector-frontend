"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRipple } from "@/lib/ripple";
import { SkeletonBar } from "@/components/Skeleton";
import { toast } from "sonner";

type Props = {
  modules: { developer: string; name: string }[];
  lang: string;
};

type ModStatus = { name: string; status: "idle" | "pending" | "ok" | "error" };

export function InstallAllButton({ modules, lang }: Props) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ModStatus[]>([]);
  const [hover, setHover] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [blockedName, setBlockedName] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const abortRef = useRef(false);

  useEffect(() => {
    fetch("/api/tg-bot").then(r => r.json()).then(d => {
      if (d.username) setBotUsername(d.username);
    }).catch(() => {});
  }, []);

  if (modules.length === 0) return null;

  function mark(name: string, status: ModStatus["status"]) {
    setResults(prev => prev.map(r => r.name === name ? { ...r, status } : r));
  }

  async function installOne(m: { developer: string; name: string }): Promise<"ok" | "error" | "skipped"> {
    if (abortRef.current) return "skipped";
    mark(m.name, "pending");
    try {
      const r = await fetch("/api/tg-bot/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: m.developer, module_name: m.name }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        if ((errData as any).error) { mark(m.name, "error"); if (!abortRef.current) { abortRef.current = true; setBlockedName(m.name); setShowModal(true); } return "error"; }
        mark(m.name, "error"); return "error";
      }
      const data = await r.json();
      if (!data.request_id) { mark(m.name, "error"); return "error"; }

      const om = encodeURIComponent(`${m.developer}|${m.name}`);
      for (let i = 0; i < 14; i++) {
        await new Promise(res => setTimeout(res, 1500));
        const s = await fetch(`/api/tg-bot/install?id=${data.request_id}&om=${om}`);
        const st = await s.json();
        if (st.status === "ok" || st.status === "error") {
          mark(m.name, st.status);
          return st.status;
        }
      }
      mark(m.name, "error");
      return "error";
    } catch {
      mark(m.name, "error");
      if (!abortRef.current) { abortRef.current = true; setBlockedName(m.name); setShowModal(true); }
      return "error";
    }
  }

  async function handleInstallAll() {
    setRunning(true);
    setResults(modules.map(m => ({ name: m.name, status: "idle" })));
    abortRef.current = false;
    const statuses = await Promise.all(modules.map(m => installOne(m)));
    setRunning(false);
    const ok = statuses.filter(s => s === "ok").length;
    const err = statuses.filter(s => s === "error").length;
    if (err === 0 && ok > 0) {
      toast.success(lang === "en" ? `Installed ${ok} module(s)` : `Установлено ${ok} модулей`);
    } else if (ok > 0) {
      toast.error(lang === "en" ? `Installed ${ok}, failed ${err}` : `Установлено ${ok}, ошибок ${err}`);
    } else if (err > 0) {
      toast.error(lang === "en" ? `Failed to install ${err} module(s)` : `Не удалось установить ${err} модулей`);
    }
  }

  const done = results.filter(r => r.status === "ok").length;
  const failed = results.filter(r => r.status === "error").length;

  const dlCommand = `dlm https://www.0xvector.lol/modules/sepiol026-wq/Vector/source`;

  async function copyDl() {
    try {
      await navigator.clipboard.writeText(dlCommand);
    } catch {   }
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleInstallAll}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => { setHover(false); setPressing(false); }}
          onMouseDown={(e) => { setPressing(true); createRipple(e); }}
          onMouseUp={() => setPressing(false)}
          disabled={running}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 999,
            border: `1px solid ${running ? "rgba(255,255,255,.08)" : hover ? "rgba(74,222,128,.3)" : "rgba(255,255,255,.08)"}`,
            background: running ? "rgba(8,8,8,.72)" : hover ? "rgba(74,222,128,.08)" : "rgba(8,8,8,.72)",
            backdropFilter: "blur(18px)",
            color: running ? "#d4d4d4" : hover ? "#4ade80" : "#d4d4d4",
            fontSize: 14, fontWeight: 600,
            cursor: running ? "default" : "pointer",
            transition: "all .18s ease",
            opacity: running ? 0.6 : 1,
            transform: pressing ? "scale(.97)" : hover ? "translateY(-1px)" : "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            {running
              ? <SkeletonBar width={110} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} />
              : lang === "en" ? `Install all (${modules.length})` : `Установить всё (${modules.length})`
            }
          </span>
        </button>
        {results.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            {done > 0 && <span style={{ color: "#4ade80" }}>✓ {done} {lang === "en" ? "installed" : "установлено"}</span>}
            {done > 0 && failed > 0 && " · "}
            {failed > 0 && <span style={{ color: "#f87171" }}>✕ {failed} {lang === "en" ? "failed" : "ошибок"}</span>}
          </div>
        )}
      </div>

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
                {dlCommand}
              </code>
              <button onMouseDown={(e) => createRipple(e)} onClick={copyDl} style={{
                padding: "10px 14px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(8,8,8,.72)", color: "#d4d4d4",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
              }}>
                {lang === "en" ? "Copy" : "Копировать"}
              </button>
            </div>
            <button onMouseDown={(e) => createRipple(e)} onClick={() => { setShowModal(false); }} style={{
              width: "100%", padding: "10px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(148,163,184,.12)", color: "#d4d4d4",
              fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>
              {lang === "en" ? "OK" : "Ок"}
            </button>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
