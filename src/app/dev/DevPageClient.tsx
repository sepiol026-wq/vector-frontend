"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { ModuleBanner } from "@/components/ModuleBanner";
import { RippleButton } from "@/components/RippleButton";

type Module = {
  id: string; name: string; description: string; hidden: boolean;
  banner: string | null; source_url: string; version: string;
  likes: number; dislikes: number;
};

export default function DevPageClient() {
  const [modules, setModules] = useState<Module[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"ru" | "en">("ru");
  useEffect(() => {
    const sync = () => setLang(document.cookie.match(/(?:^|;\s*)vector_lang=([^;]*)/)?.[1] === "en" ? "en" : "ru");
    sync();
    window.addEventListener("vector-lang-change", sync);
    const controller = new AbortController();
    fetch("/api/me/modules", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json() as { modules: Module[] };
      setModules(data.modules);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Request failed");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); window.removeEventListener("vector-lang-change", sync); };
  }, []);
  async function toggle(module: Module) {
    setPending(previous => new Set(previous).add(module.id));
    try {
      const response = await fetch("/api/me/modules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module_id: module.id, hidden: !module.hidden }) });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setModules(previous => previous.map(item => item.id === module.id ? { ...item, hidden: !item.hidden } : item));
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Request failed");
    } finally {
      setPending(previous => { const next = new Set(previous); next.delete(module.id); return next; });
    }
  }
  return <main className="dev"><NavBar backHref="/" lang={lang} tabs={[]} /><h1>{lang === "en" ? "My modules" : "Мои модули"}</h1>
    {loading ? <p role="status">{lang === "en" ? "Loading…" : "Загрузка…"}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {!loading && !error && !modules.length ? <p>{lang === "en" ? "No modules" : "Нет модулей"}</p> : null}
    {modules.map(module => <article key={module.id}>
      <ModuleBanner src={module.banner} /><h2><Link href={module.source_url}>{module.name}</Link> <small>{module.version}</small></h2>
      <p>{module.description}</p><p>+{module.likes} / −{module.dislikes}</p>
      <RippleButton disabled={pending.has(module.id)} onClick={() => void toggle(module)}>{module.hidden ? (lang === "en" ? "Show" : "Показать") : (lang === "en" ? "Hide" : "Скрыть")}</RippleButton>
    </article>)}
    <style>{`.dev{max-width:1000px;margin:auto;padding:24px;font-family:system-ui}.dev article{padding:20px;margin:16px 0;border:1px solid #242424;border-radius:14px;background:#090909}.dev a{color:inherit}.dev small{color:#999;font-size:14px}.dev img{max-width:100%}.dev button{padding:10px 18px;border:1px solid #333;border-radius:10px;background:#111;color:#fff;cursor:pointer}.dev button:disabled{opacity:.5}`}</style>
  </main>;
}
