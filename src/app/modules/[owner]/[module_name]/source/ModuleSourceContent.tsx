import { backend } from "@/lib/backend";
import type { ModuleView } from "@/lib/module-view";
import Link from "next/link";

import { ModuleComments } from "@/components/ModuleComments";
import { ModuleRatingPanel } from "@/components/ModuleRatingPanel";
import { ModuleSecurityPanel } from "@/components/ModuleSecurityPanel";
import { AddToCollectionButton } from "@/components/AddToCollectionButton";
import { InstallButton } from "@/components/InstallButton";
import CodeBlock from "@/components/CodeBlock";

import { coerceDate } from "@/lib/date";

import { safeDecodeRouteParam } from "@/lib/route-params";
import { ModuleBanner } from "@/components/ModuleBanner";
import { TagLink } from "@/components/TagLink";
import { OfficialBadge } from "@/components/OfficialBadge";
import { parseTags } from "@/lib/tags";
import { NavBar } from "@/components/NavBar";
import { TranslatableText } from "@/components/TranslatableText";
import { resolveLang } from "@/lib/lang";

type PageProps = {
  params: Promise<{ owner: string; module_name: string }>;
  searchParams?: Promise<{ rev?: string; diff?: string; lang?: string }>;
};

type Command = { cmd: string; desc: string; desc_ru?: string; desc_ua?: string; desc_de?: string; desc_jp?: string; desc_leet?: string; desc_neofit?: string; desc_tiktok?: string; desc_uwu?: string; is_inline?: boolean; is_placeholder?: boolean };

const langdesckey: Record<string, string> = {
  ru: "desc_ru", ua: "desc_ua", de: "desc_de", jp: "desc_jp",
  leet: "desc_leet", neofit: "desc_neofit", tiktok: "desc_tiktok", uwu: "desc_uwu",
};

function localizedDesc(cmd: Command, lang: string): string {
  if (lang === "en" || !lang) return cmd.desc;
  const key = langdesckey[lang];
  if (key) {
    const v = (cmd as Record<string, unknown>)[key];
    if (typeof v === "string" && v) return v;
  }
  return cmd.desc;
}

function formatDate(value: Date | string | number | null | undefined, lang: "ru" | "en"): string {
  const date = coerceDate(value);
  if (!date) return lang === "en" ? "Unknown date" : "Дата неизвестна";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ru-RU", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(date);
}

type DiffLine = { type: "add" | "remove" | "same"; text: string; oldNum?: number; newNum?: number };

function myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const n = oldLines.length, m = newLines.length;
  const max = n + m;
  const v: number[] = new Array(2 * max + 1).fill(0);
  const trace: Array<Record<number, number>> = [];
  let x = 0, y = 0;

  for (let d = 0; d <= max; d++) {
    const cur: Record<number, number> = {};
    trace.push(cur);
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && v[max + k - 1]! < v[max + k + 1]!);
      const prevK = down ? k + 1 : k - 1;
      x = down ? v[max + prevK]! : v[max + prevK]! + 1;
      y = x - k;
      while (x < n && y < m && oldLines[x] === newLines[y]) { x++; y++; }
      v[max + k] = x;
      cur[k] = x;
      if (x >= n && y >= m) { d = max; break; }
    }
  }

  const diff: DiffLine[] = [];
  let px = n, py = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const cur = trace[d]!;
    const k = px - py;
    if (k < -d || k > d) continue;
    const down = k === -d || (k !== d && (cur[k - 1] ?? -1) < (cur[k + 1] ?? -1));
    const prevK = down ? k + 1 : k - 1;
    const prevX = cur[prevK] ?? (down ? px : px - 1);
    const prevY = prevX - prevK;

    while (px > prevX && py > prevY) {
      px--; py--;
      diff.unshift({ type: "same", text: oldLines[px]!, oldNum: px + 1, newNum: py + 1 });
    }

    while (px > prevX) {
      px--;
      diff.unshift({ type: "remove", text: oldLines[px]!, oldNum: px + 1 });
    }
    while (py > prevY) {
      py--;
      diff.unshift({ type: "add", text: newLines[py]!, newNum: py + 1 });
    }
    if (px === 0 && py === 0) break;
  }

  while (px > 0) { px--; diff.unshift({ type: "remove", text: oldLines[px]!, oldNum: px + 1 }); }
  while (py > 0) { py--; diff.unshift({ type: "add", text: newLines[py]!, newNum: py + 1 }); }

  return diff.length > 0 ? diff : naiveDiff(oldLines, newLines);
}

function naiveDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const out: DiffLine[] = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const a = oldLines[i], b = newLines[i];
    if (a !== undefined && a === b) { out.push({ type: "same", text: a, oldNum: i + 1, newNum: i + 1 }); continue; }
    if (a !== undefined) out.push({ type: "remove", text: a, oldNum: i + 1 });
    if (b !== undefined) out.push({ type: "add", text: b, newNum: i + 1 });
  }
  return out;
}

function diffLines(oldT: string, newT: string): DiffLine[] {
  return myersDiff(oldT.split("\n"), newT.split("\n"));
}

function buildSourceLink(owner: string, name: string, opts: { rev?: number | null; diff?: number | null; lang: "ru" | "en" }): string {
  const p = new URLSearchParams();
  if (typeof opts.rev === "number" && Number.isFinite(opts.rev)) p.set("rev", String(opts.rev));
  if (typeof opts.diff === "number" && Number.isFinite(opts.diff)) p.set("diff", String(opts.diff));
  if (opts.lang === "en") p.set("lang", "en");
  const q = p.toString();
  return `/modules/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/source${q ? `?${q}` : ""}`;
}

export async function ModuleSourceContent({ params, searchParams }: PageProps) {
  const p = await params;
  const owner = safeDecodeRouteParam(p.owner);
  const decodedName = safeDecodeRouteParam(p.module_name);
  const query = (await searchParams) ?? {};
  const lang = await resolveLang(query.lang);

  const { targetModule, user, revisions, ratingSummary, securityCheck, securityQuota, officialDeveloper, sourceToken } = await backend<ModuleView>(`/api/web/module-view/${encodeURIComponent(p.owner)}/${encodeURIComponent(p.module_name)}`);

  const activeRevisionNo = Number(query.rev);
  const activeRevision = Number.isFinite(activeRevisionNo)
    ? revisions.find((r) => r.revision_no === activeRevisionNo) ?? null : null;
  const displayedCode = activeRevision?.raw_code ?? targetModule.raw_code;
  const displayedUpdatedAt = activeRevision?.created_at ?? targetModule.updated_at;

  const diffRevisionNo = Number(query.diff);
  const diffRevision = Number.isFinite(diffRevisionNo)
    ? revisions.find((r) => r.revision_no === diffRevisionNo) ?? null : null;
  const diffRows = diffRevision
    ? diffLines(diffRevision.raw_code, displayedCode)
    : [];

  const commands = targetModule.commands;
  const dependencies = targetModule.dependencies;
  const lineCount = displayedCode.split("\n").length;
  const codeSize = new Intl.NumberFormat("ru-RU").format(
    activeRevision?.raw_code_size ?? targetModule.raw_code_size ?? Buffer.byteLength(displayedCode, "utf8"));
  const revQuery = activeRevision ? `?rev=${activeRevision.revision_no}` : "";
  const rawUrl = `/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(targetModule.name)}/source/${sourceToken}/raw${revQuery}`;
  const downloadUrl = `/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(targetModule.name)}/source/${sourceToken}/download${revQuery}`;
  const dlCommand = `dlm https://www.0xvector.lol/modules/${encodeURIComponent(owner)}/${encodeURIComponent(targetModule.name)}/source`;

  const navUser = user ? { display_name: user.display_name, username: user.username, photo_url: user.photo_url } : null;

  return (
    <>
      <NavBar backHref="/" user={navUser} tabs={[
        { label: lang === "en" ? "Catalog" : "Каталог", href: "/" },
        { label: lang === "en" ? "Stats" : "Статистика", href: "/?tab=stats" },
        { label: lang === "en" ? "Collections" : "Коллекции", href: "/?tab=collections" },
      ]} lang={lang} />

      <section className="hero-card">
        <div className="hero-topline"><span className="live-dot" /><span>{lang === "en" ? "Vector Module Source" : "Исходник модуля Вектор"}</span></div>
        <div className="hero-content">
          <div>
            <ModuleBanner src={targetModule.banner} className="module-banner-hero" />
            <div className="title-row">
              <h1>{targetModule.name}</h1>
              {officialDeveloper ? <span className="official-badge"><OfficialBadge size={15} title={lang === "en" ? "Official developer" : "Официальный разработчик"} />{lang === "en" ? "official developer" : "офиц. разработчик"}</span> : null}
            </div>
            <TranslatableText text={targetModule.description || (lang === "en" ? "Description is not added yet." : "Описание пока не добавлено.")} lang={lang} className="description" />
          </div>
          <div className="meta-panel">
            <div><span>{lang === "en" ? "Rating" : "Рейтинг"}</span><ModuleRatingPanel moduleName={targetModule.name} owner={owner} initial={ratingSummary} lang={lang} /></div>
            <div><span>{lang === "en" ? "Author" : "Автор"}</span><strong><span className="author-line"><Link href={`/developers/${encodeURIComponent(targetModule.source_owner || owner)}`} prefetch style={{ color: "#58a6ff", textDecoration: "none" }}>{targetModule.developer}</Link>{officialDeveloper ? <OfficialBadge size={15} title={lang === "en" ? "Official developer" : "Официальный разработчик"} /> : null}</span><br /><small style={{ color: "#6b7280", fontSize: 12 }}>{owner}</small></strong></div>
            <div><span>{lang === "en" ? "Class" : "Класс"}</span><strong>{targetModule.class_name}</strong></div>
            <div><span>{lang === "en" ? "Version" : "Версия"}</span><strong>{targetModule.version}</strong></div>
            {targetModule.tags ? <div><span>{lang === "en" ? "Tags" : "Теги"}</span><div className="module-tags">{parseTags(targetModule.tags).map((t, i) => <TagLink key={t} tag={t} index={i} />)}</div></div> : null}
            <div><span>{lang === "en" ? "Updated" : "Обновлено"}</span><strong>{formatDate(displayedUpdatedAt, lang)}</strong></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><AddToCollectionButton moduleName={targetModule.name} owner={owner} lang={lang} /></div>
          </div>
        </div>
      </section>

      <section className="info-grid">
        <article className="glass-card">
          <div className="section-heading"><span>{lang === "en" ? "Commands" : "Команды"}</span><b>{commands.length}</b></div>
          {commands.length ? <div className="command-list">{commands.map((c) => <div className="command-pill" key={c.cmd}><code>{c.is_placeholder ? `{${c.cmd}}` : c.is_inline ? `@bot ${c.cmd}` : `.${c.cmd}`}</code> <TranslatableText text={localizedDesc(c, lang) || (lang === "en" ? "No description" : "Без описания")} lang={lang} /></div>)}</div> : <p className="muted">{lang === "en" ? "No commands found." : "Команды не найдены."}</p>}
        </article>
        <article className="glass-card">
          <div className="section-heading"><span>{lang === "en" ? "Packages" : "Пакеты"}</span><b>{dependencies.length}</b></div>
          {dependencies.length ? <div className="dependency-list">{dependencies.map((d) => <code key={d}>{d}</code>)}</div> : <p className="muted">{lang === "en" ? "No dependencies." : "Зависимости не указаны."}</p>}
        </article>
        <ModuleSecurityPanel owner={owner} moduleName={targetModule.name} initialCheck={securityCheck} initialQuota={securityQuota} canCheck={Boolean(user)} lang={lang} />
      </section>

      <section className="glass-card" style={{ maxWidth: "1180px", margin: "0 auto 22px" }}>
        <div className="section-heading">
          <span>{lang === "en" ? "Revision history" : "История версий"}</span>
          <b>{revisions.length}</b>
        </div>
        <div className="revision-grid">
          <Link className={`revision-link ${!activeRevision ? "active" : ""}`} href={buildSourceLink(owner, targetModule.name, { lang })}>
            <code>{lang === "en" ? "Current card" : "Текущая карточка"}</code>
          </Link>
          {revisions.map((rev) => (
            <div key={rev.id} className={`revision-row ${activeRevision?.id === rev.id ? "active" : ""}`}>
              <Link className="revision-link" href={buildSourceLink(owner, targetModule.name, { rev: rev.revision_no, lang })}>
                <code>r{rev.revision_no}</code>
                <span>{formatDate(rev.created_at, lang)}</span>
              </Link>
              <div className="revision-actions">
                <Link href={buildSourceLink(owner, targetModule.name, { rev: activeRevision?.revision_no ?? null, diff: rev.revision_no, lang })}>
                  {lang === "en" ? "Compare with current" : "Сравнить с текущей"}
                </Link>
                {activeRevision ? (
                  <Link href={buildSourceLink(owner, targetModule.name, { rev: activeRevision.revision_no, diff: rev.revision_no, lang })}>
                    {lang === "en" ? "Compare with viewed" : "Сравнить с выбранной"}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      { }
      <section className="glass-card" style={{ maxWidth: "1180px", margin: "0 auto 22px" }}>
        <div className="section-heading">
          <span>{lang === "en" ? "Install" : "Установка"}</span>
        </div>
        <InstallButton owner={owner} moduleName={targetModule.name} dlCommand={dlCommand} lang={lang} />
      </section>

      {diffRevision ? (
        <section className="code-card" style={{ marginBottom: "22px" }}>
          <div className="code-toolbar">
            <div className="code-title">
              Diff: r{diffRevision.revision_no} → {activeRevision ? `r${activeRevision.revision_no}` : lang === "en" ? "current" : "текущая"}
              {" "}<span className="diff-stats">
                <span className="diff-stat-add">+{diffRows.filter((r) => r.type === "add").length}</span>
                {" "}<span className="diff-stat-remove">-{diffRows.filter((r) => r.type === "remove").length}</span>
              </span>
            </div>
          </div>
          <div className="github-diff-head">
            <span className="diff-head-left">{lang === "en" ? "Old" : "Старая"} (r{diffRevision.revision_no})</span>
            <span className="diff-head-right">{activeRevision ? `r${activeRevision.revision_no}` : lang === "en" ? "Current" : "Текущая"}</span>
          </div>
          <pre className="code-block github-diff">
            {diffRows.map((row, index) => (
              <div key={index} className={`diff-line ${row.type}`}>
                <span className="diff-gutter diff-gutter-old">{row.oldNum ?? " "}</span>
                <span className="diff-gutter diff-gutter-new">{row.newNum ?? " "}</span>
                <span className="diff-sign">{row.type === "add" ? "+" : row.type === "remove" ? "-" : " "}</span>
                <span className="diff-text">{row.text || " "}</span>
              </div>
            ))}
          </pre>
        </section>
      ) : null}

      <section className="code-card">
        <div className="code-toolbar">
          <div className="code-window-controls" aria-hidden="true"><span className="window-dot red" /><span className="window-dot yellow" /><span className="window-dot green" /></div>
          <div className="code-title">{lang === "en" ? "Source code" : "Исходный код"} · {lineCount} {lang === "en" ? "lines" : "строк"} · {codeSize} {lang === "en" ? "bytes" : "байт"}</div>
          <div className="code-actions"><a href={rawUrl} rel="nofollow" target="_blank">Raw</a><a href={downloadUrl} rel="nofollow">{lang === "en" ? "Download" : "Скачать"}</a></div>
        </div>
        <CodeBlock code={displayedCode} language="python" label={`${lang === "en" ? "Module source code" : "Исходный код модуля"} ${targetModule.name}`} />
      </section>

      <ModuleComments owner={owner} moduleName={targetModule.name} canPost={Boolean(user)} lang={lang} />
    </>
  );
}
