"use client";

import { Fragment, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VectorSelect } from "@/components/PrivacySelect";
import type { DiffHunk } from "@/lib/diff";

type RevisionItem = { id: string; revision_no: number; created_at_label: string; source_hash: string };
type DiffPayload = { base: number; head: number | null; add: number; remove: number; hunks: DiffHunk[]; truncated: boolean };

type Props = {
  owner: string;
  name: string;
  lang: "ru" | "en";
  revisions: RevisionItem[];
  currentHash: string;
  currentDate: string;
  viewedRevision: number | null;
  initialDiff: DiffPayload | null;
};

function sourceLink(owner: string, name: string, opts: { rev?: number | null; diff?: number | null; lang: "ru" | "en" }): string {
  const p = new URLSearchParams();
  if (typeof opts.rev === "number") p.set("rev", String(opts.rev));
  if (typeof opts.diff === "number") p.set("diff", String(opts.diff));
  if (opts.lang === "en") p.set("lang", "en");
  const q = p.toString();
  return `/modules/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/source${q ? `?${q}` : ""}`;
}

export function ModuleDiff({ owner, name, lang, revisions, currentHash, currentDate, viewedRevision, initialDiff }: Props) {
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const diff = initialDiff;
  const loading = navigating;

  const t = {
    current: lang === "en" ? "Current source" : "Текущий исходник",

    diffTitle: lang === "en" ? "Diff" : "Изменения",
    oldSide: lang === "en" ? "Old" : "Старая",
    newSide: lang === "en" ? "Current" : "Текущая",
    loading: lang === "en" ? "Loading changes" : "Загрузка изменений",
    failed: lang === "en" ? "Could not build the diff." : "Не удалось построить diff.",
    noChanges: lang === "en" ? "No changes between these revisions." : "Между этими ревизиями нет изменений.",
    tooLarge: lang === "en" ? "Comparison exceeded the size or time limit. Download the sources to compare locally." : "Сравнение превысило лимит объёма или времени. Скачайте исходники для локального сравнения."
  };

  const hashLabel = (revision: number | null) => (revision === null ? currentHash : revisions.find(item => item.revision_no === revision)?.source_hash)?.slice(0, 10) || "—";
  const headLabel = diff ? hashLabel(diff.head) : "";
  const options = revisions.map(rev => ({ value: String(rev.revision_no), title: hashLabel(rev.revision_no), detail: `${rev.created_at_label} UTC` }));
  const navigate = (rev: number | null, base: number | null) => {
    if (!navigating && rev === viewedRevision && base === (diff?.base ?? null)) return;
    startTransition(() => router.push(sourceLink(owner, name, { rev, diff: base, lang }), { scroll: false }));
  };

  return (
    <>
      <div className="revision-controls" aria-busy={navigating}>
        <div className="revision-control">
          <span>{lang === "en" ? "From" : "От"}</span>
          <VectorSelect showDetail label={lang === "en" ? "Compare from" : "Сравнить от"} value={String(diff?.base ?? "")} onChange={value => navigate(viewedRevision, value ? Number(value) : null)} options={[
            { value: "", title: lang === "en" ? "No comparison" : "Без сравнения", detail: lang === "en" ? "Choose a source" : "Выбери исходник" }, ...options,
          ]} />
        </div>
        <div className="revision-control">
          <span>{lang === "en" ? "To · viewing source" : "До · открыт исходник"}</span>
          <VectorSelect showDetail label={lang === "en" ? "Viewing source" : "Открыт исходник"} value={String(viewedRevision ?? "current")} onChange={value => navigate(value === "current" ? null : Number(value), diff?.base ?? null)} options={[
            { value: "current", title: `${hashLabel(null)} · ${t.current}`, detail: `${currentDate} UTC` }, ...options,
          ]} />
        </div>
      </div>
      <p className="revision-caption" role="status">{navigating ? (lang === "en" ? "Opening source…" : "Открываем исходник…") : (lang === "en" ? "Source hash · latest 12 snapshots" : "Хеш исходника · последние 12 снимков")}</p>

      <div className="diff-slot" aria-live="polite" aria-busy={loading}>
        {loading ? <div className="diff-skeleton" role="status" aria-label={t.loading}>
          <div className="diff-skeleton-title" />
          {Array.from({ length: 7 }, (_, i) => <div className="diff-skeleton-row" key={i} aria-hidden="true"><i /><i /><span style={{ width: `${[72, 48, 86, 61, 78, 42, 65][i]}%` }} /></div>)}
        </div> : null}
        {diff && !loading ? (
          diff.truncated ? (
            <p className="muted diff-note">{t.tooLarge}</p>
          ) : diff.hunks.length === 0 ? (
            <p className="muted diff-note">{t.noChanges}</p>
          ) : (
            <div className="diff-block">
              <div className="code-toolbar diff-toolbar">
                <div className="code-title">
                  {t.diffTitle}: {hashLabel(diff.base)} → {headLabel}
                  {" "}
                  <span className="diff-stats">
                    <span className="diff-stat-add">+{diff.add}</span>
                    {" "}
                    <span className="diff-stat-remove">-{diff.remove}</span>
                  </span>
                </div>
              </div>
              <div className="github-diff-head">
                <span className="diff-head-left">{t.oldSide} ({hashLabel(diff.base)})</span>
                <span className="diff-head-right">{headLabel}</span>
              </div>
              <pre className="code-block github-diff">
                {diff.hunks.map((hunk, hunkIndex) => (
                  <div className="diff-hunk-group" key={hunkIndex}>
                    <div className="diff-hunk">{hunk.header}</div>
                    {hunk.rows.map((row, index) => (
                      <Fragment key={`${hunkIndex}-${index}`}><div className={`diff-line ${row.type}`}>
                        <span className="diff-gutter diff-gutter-old">{row.oldNum ?? " "}</span>
                        <span className="diff-gutter diff-gutter-new">{row.newNum ?? " "}</span>
                        <span className="diff-sign">{row.type === "add" ? "+" : row.type === "remove" ? "-" : " "}</span>
                        <span className="diff-text">{row.parts ? row.parts.map((part, i) => part.changed ? <mark className="diff-char" key={i}>{part.text}</mark> : <Fragment key={i}>{part.text}</Fragment>) : row.text || " "}</span>
                      </div>
                      {row.noNewline ? <div className="diff-eof">{lang === "en" ? "\\ No newline at end of file" : "\\ Нет перевода строки в конце файла"}</div> : null}</Fragment>
                    ))}
                  </div>
                ))}
              </pre>
            </div>
          )
        ) : null}
      </div>
    </>
  );
}
