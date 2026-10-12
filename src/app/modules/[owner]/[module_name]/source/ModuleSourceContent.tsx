import type { ComponentProps } from "react";
import { revisionNumber } from "@/lib/diff";
import { backend } from "@/lib/backend";
import type { ModuleView } from "@/lib/module-view";
import Link from "next/link";

import { notFound } from "next/navigation";

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
import { ModuleBannerTheme } from "@/components/ModuleBannerTheme";
import { TranslatableText } from "@/components/TranslatableText";
import { resolveLang } from "@/lib/lang";

import { ModuleDiff } from "@/components/ModuleDiff";

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

export async function ModuleSourceContent({ params, searchParams }: PageProps) {
  const p = await params;
  const owner = safeDecodeRouteParam(p.owner);
  const decodedName = safeDecodeRouteParam(p.module_name);
  const query = (await searchParams) ?? {};
  const lang = await resolveLang(query.lang);

  const { targetModule, user, revisions, ratingSummary, securityCheck, securityQuota, officialDeveloper, sourceToken } = await backend<ModuleView>(`/api/web/module-view/${encodeURIComponent(p.owner)}/${encodeURIComponent(p.module_name)}?rev=${encodeURIComponent(query.rev ?? "")}`);

  const activeRevisionNo = revisionNumber(query.rev);
  const activeRevision = revisions.find((r) => r.revision_no === activeRevisionNo) ?? null;
  if (query.rev !== undefined && !activeRevision) notFound();
  const displayedCode = activeRevision?.raw_code ?? targetModule.raw_code;
  const displayedUpdatedAt = activeRevision?.created_at ?? targetModule.updated_at;

  const diffRevisionNo = revisionNumber(query.diff);
  const diffRevision = revisions.find((r) => r.revision_no === diffRevisionNo) ?? null;
  if (query.diff !== undefined && !diffRevision) notFound();
  const diffQuery = new URLSearchParams({ base: String(diffRevision?.revision_no) });
  if (activeRevision) diffQuery.set("head", String(activeRevision.revision_no));
  const initialDiff = diffRevision
    ? await backend<ComponentProps<typeof ModuleDiff>["initialDiff"]>(`/api/modules/${encodeURIComponent(p.owner)}/${encodeURIComponent(p.module_name)}/diff?${diffQuery}`)
    : null;

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

      <ModuleBannerTheme banner={targetModule.banner} scopeKey={`${owner}/${targetModule.name}/${query.rev ?? "current"}`}>
      <section className="hero-card">
        <nav className="module-sections" aria-label={lang === "en" ? "On this page" : "На этой странице"}>
          <a href="#module-install">{lang === "en" ? "Install" : "Установка"}</a>
          <a href="#module-commands">{lang === "en" ? "Commands" : "Команды"}</a>
          <a href="#module-revisions">{lang === "en" ? "Versions" : "Версии"}</a>
          <a href="#module-code">{lang === "en" ? "Source" : "Исходник"}</a>
          <a href="#module-comments">{lang === "en" ? "Comments" : "Комментарии"}</a>
        </nav>
        <div className="hero-content">
          <div>
            <ModuleBanner src={targetModule.banner} className="module-banner-hero" />
            <div className="title-row">
              <h1>{targetModule.name}</h1>
              {officialDeveloper ? <span className="official-badge"><OfficialBadge size={15} title={lang === "en" ? "Official developer" : "Официальный разработчик"} />{lang === "en" ? "official developer" : "офиц. разработчик"}</span> : null}
            </div>
            <TranslatableText text={targetModule.description || (lang === "en" ? "Description is not added yet." : "Описание пока не добавлено.")} lang={lang} className="description" />
            <section id="module-install" className="module-install">
              <InstallButton owner={owner} moduleName={targetModule.name} dlCommand={dlCommand} lang={lang} />
            </section>
            <section id="module-commands" className="hero-commands">
              <div className="section-heading"><span>{lang === "en" ? "Commands" : "Команды"}</span><b>{commands.length}</b></div>
              {commands.length ? <div className="command-list">{commands.map((c) => <div className="command-pill" key={c.cmd}><code>{c.is_placeholder ? `{${c.cmd}}` : c.is_inline ? `@bot ${c.cmd}` : `.${c.cmd}`}</code> <TranslatableText text={localizedDesc(c, lang) || (lang === "en" ? "No description" : "Без описания")} lang={lang} /></div>)}</div> : <p className="muted">{lang === "en" ? "No commands found." : "Команды не найдены."}</p>}
            </section>
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
          <div className="section-heading"><span>{lang === "en" ? "Packages" : "Пакеты"}</span><b>{dependencies.length}</b></div>
          {dependencies.length ? <div className="dependency-list">{dependencies.map((d) => <code key={d}>{d}</code>)}</div> : <p className="muted">{lang === "en" ? "No dependencies." : "Зависимости не указаны."}</p>}
        </article>
        <ModuleSecurityPanel owner={owner} moduleName={targetModule.name} initialCheck={securityCheck} initialQuota={securityQuota} canCheck={Boolean(user)} lang={lang} />
      </section>

      <section id="module-revisions" className="glass-card" style={{ maxWidth: "1180px", margin: "0 auto 22px" }}>
        <div className="section-heading">
          <span>{lang === "en" ? "Source revisions" : "Ревизии исходника"}</span>
          <b>{revisions.length}</b>
        </div>
        <ModuleDiff
          owner={owner}
          name={targetModule.name}
          lang={lang}
          revisions={revisions.map((rev) => ({ id: rev.id, revision_no: rev.revision_no, source_hash: rev.source_hash, created_at_label: formatDate(rev.created_at, lang) }))}
          currentHash={targetModule.source_hash}
          currentDate={formatDate(targetModule.updated_at, lang)}
          viewedRevision={activeRevision?.revision_no ?? null}
          initialDiff={initialDiff}
        />
      </section>

      { }

      <section id="module-code" className="code-card">
        <div className="code-toolbar">
          <div className="code-window-controls" aria-hidden="true"><span className="window-dot red" /><span className="window-dot yellow" /><span className="window-dot green" /></div>
          <div className="code-title">{lang === "en" ? "Source code" : "Исходный код"} · {lineCount} {lang === "en" ? "lines" : "строк"} · {codeSize} {lang === "en" ? "bytes" : "байт"}</div>
          <div className="code-actions"><a href={rawUrl} rel="nofollow" target="_blank">Raw</a><a href={downloadUrl} rel="nofollow">{lang === "en" ? "Download" : "Скачать"}</a></div>
        </div>
        <CodeBlock code={displayedCode} language="python" label={`${lang === "en" ? "Module source code" : "Исходный код модуля"} ${targetModule.name}`} />
      </section>

      <div id="module-comments"><ModuleComments owner={owner} moduleName={targetModule.name} canPost={Boolean(user)} lang={lang} /></div>
      </ModuleBannerTheme>
    </>
  );
}
