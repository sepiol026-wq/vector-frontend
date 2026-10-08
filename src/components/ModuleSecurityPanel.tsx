"use client";

import { useEffect, useState } from "react";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { SkeletonBar } from "@/components/Skeleton";
import { createRipple } from "@/lib/ripple";
import { toast } from "sonner";

function shouldShowTranslate(text: string, lang: "ru" | "en"): boolean {
  const chars = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!chars) return false;
  const cyrillic = (chars.match(/[\u0400-\u04FF]/g) || []).length;
  const cjk = (chars.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g) || []).length;
  const latin = (chars.match(/[a-zA-Z]/g) || []).length;
  const other = chars.length - cyrillic - cjk - latin;
  if (cjk > 0 || other > 0) return true;
  if (lang === "ru") return latin / chars.length > 0.5;
  return cyrillic / chars.length > 0.3;
}

function getFindingSeverityLabels(lang: "ru" | "en"): { critical: string; warning: string; info: string } {
  return lang === "en" ? { critical: "Critical", warning: "Warning", info: "Info" } : { critical: "Критично", warning: "Предупреждение", info: "Информация" };
}

function getRiskLabels(lang: "ru" | "en"): { clean: string; low: string; medium: string; high: string; critical: string } {
  return lang === "en" ? { clean: "clean", low: "low", medium: "medium", high: "high", critical: "critical" } : { clean: "чистый", low: "низкий", medium: "средний", high: "высокий", critical: "критический" };
}

type SecurityVerdict = "safe" | "suspicious" | "unsafe";

type SecurityCheck = {
  checked: true;
  verdict: SecurityVerdict;
  label: string;
  confidence: number;
  summary: string;
  created_at: string | Date;
  details: unknown;
  quota?: SecurityQuota;
  ai_failed?: boolean;
};

type SecurityQuota = {
  limit: number;
  used: number;
  remaining: number;
  day_key: string;
  reset_at: string;
};

type SecurityFinding = {
  sev?: string;
  title?: string;
  detail?: string;
  source?: string;
  line?: number;
  col?: number;
  score?: number;
  family?: string;
  conf?: number;
};

type SecurityDetails = {
  label?: string;
  summary?: string;
  static?: {
    risk?: string;
    score?: number;
    family?: string;
    findings?: Partial<Record<"critical" | "warning" | "info", SecurityFinding[]>>;
    stats?: Record<string, number>;
    safe_markers?: string[];
  };
  ai?: {
    available?: boolean;
    reason?: string;
    result?: {
      verdict?: string;
      confidence?: number;
      threat_level?: number;
      family?: string;
      reason?: string;
      indicators?: Array<{ type?: string; description?: string }>;
      kill_chain?: string[];
      obfuscation?: { detected?: boolean; type?: string; depth?: string };
      prompt_injection?: { detected?: boolean; details?: string };
    };
  };
};

function verdictClass(verdict: SecurityVerdict): string {
  return verdict === "safe" ? "safe" : verdict === "suspicious" ? "suspicious" : "unsafe";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSecurityDetails(details: unknown): SecurityDetails | null {
  return isRecord(details) ? (details as SecurityDetails) : null;
}

function isOfficialDeveloperCheck(details: unknown): boolean {
  return isRecord(details) && details.official_developer === true;
}

function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "да" : "нет";
  }
  return String(value);
}

function formatRisk(risk: string | undefined, lang: "ru" | "en"): string {
  if (!risk) return "—";
  const labels = getRiskLabels(lang);
  return (labels as Record<string, string>)[risk] ?? risk;
}

function formatUtcDate(value: string | Date | number | null | undefined, lang: "ru" | "en"): string {
  if (value === null || value === undefined || value === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(lang === "en" ? "en-US" : "ru-RU", { timeZone: "UTC", hour12: false });
}

function formatQuota(quota: SecurityQuota, lang: "ru" | "en"): string {
  const reset = formatUtcDate(quota.reset_at, lang);
  return lang === "en"
    ? `Used ${quota.used} of ${quota.limit} · ${quota.remaining} left · resets ${reset} UTC`
    : `Использовано ${quota.used} из ${quota.limit} · осталось ${quota.remaining} · сброс ${reset} UTC`;
}

function formatQuotaRemaining(quota: SecurityQuota | null, lang: "ru" | "en"): string {
  if (!quota) return lang === "en" ? "run an automated check" : "запустите автоматическую проверку";
  return lang === "en"
    ? `${quota.remaining} of ${quota.limit} checks left`
    : `осталось ${quota.remaining} из ${quota.limit} проверок`;
}

function formatStatName(name: string): string {
  return name
    .replaceAll("_", " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function statEntries(stats: Record<string, number> | undefined): Array<[string, number]> {
  return Object.entries(stats ?? {})
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8);
}

function findingMeta(finding: SecurityFinding, lang: "ru" | "en"): string {
  const en = lang === "en";
  const parts = [
    finding.line ? (en ? `line ${finding.line}${finding.col ? `:${finding.col}` : ""}` : `строка ${finding.line}${finding.col ? `:${finding.col}` : ""}`) : null,
    finding.family ? (en ? `family: ${finding.family}` : `семейство: ${finding.family}`) : null,
    typeof finding.score === "number" ? `score ${finding.score}` : null,
    typeof finding.conf === "number" ? `conf ${finding.conf}%` : null
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : (en ? "no coordinates" : "без координат");
}

function FindingGroup({ title, findings, lang, t }: { title: string; findings: SecurityFinding[]; lang: "ru" | "en"; t: Record<string, string> | null }) {
  const tr = (s: string) => t?.[s] ?? s;
  if (findings.length === 0) {
    return null;
  }

  return (
    <section className="security-detail-section">
      <h4>{title}</h4>
      <ul className="security-finding-list">
        {findings.slice(0, 8).map((finding, index) => (
          <li key={`${finding.title ?? title}-${finding.line ?? index}-${index}`}>
            <div>
              <strong>{tr(finding.title ?? (lang === "en" ? "Finding" : "Находка"))}</strong>
              <span>{findingMeta(finding, lang)}</span>
            </div>
            {finding.detail ? <p>{tr(finding.detail)}</p> : null}
          </li>
        ))}
      </ul>
      {findings.length > 8 ? <small>{lang === "en" ? `Showing 8 of ${findings.length} findings in this category.` : `Показано 8 из ${findings.length} находок этой категории.`}</small> : null}
    </section>
  );
}

function SecurityDetailsView({ details, lang, t }: { details: unknown; lang: "ru" | "en"; t: Record<string, string> | null }) {
  const tr = (s: string) => t?.[s] ?? s;
  const normalized = asSecurityDetails(details);

  if (!normalized) {
    return <p className="security-detail-muted">{lang === "en" ? "Inspection details are not available in a readable format." : "Детали проверки недоступны в читаемом формате."}</p>;
  }

  const ai = normalized.ai?.result;
  const aiUnavailable = normalized.ai?.available === false;
  const staticResult = normalized.static;
  const findings = staticResult?.findings ?? {};
  const stats = statEntries(staticResult?.stats);

  return (
    <div className="security-detail-body">
      <section className="security-detail-grid" aria-label={lang === "en" ? "Key inspection metrics" : "Ключевые показатели проверки"}>
        <div>
          <span>{lang === "en" ? "Verdict" : "Вердикт"}</span>
          <strong>{tr(normalized.label ?? ai?.verdict ?? "—")}</strong>
        </div>
        <div>
          <span>{lang === "en" ? "Static risk" : "Риск статики"}</span>
          <strong>{formatRisk(staticResult?.risk, lang)}</strong>
        </div>
        <div>
          <span>Score</span>
          <strong>{formatValue(staticResult?.score)}</strong>
        </div>
        <div>
          <span>{lang === "en" ? "Family" : "Семейство"}</span>
          <strong>{tr(formatValue(ai?.family ?? staticResult?.family))}</strong>
        </div>
        <div>
          <span>{lang === "en" ? "AI confidence" : "Уверенность AI"}</span>
          <strong>{typeof ai?.confidence === "number" ? `${ai.confidence}%` : "—"}</strong>
        </div>
        <div>
          <span>Threat level</span>
          <strong>{formatValue(ai?.threat_level)}</strong>
        </div>
      </section>

      {aiUnavailable || ai?.reason || normalized.summary ? (
        <section className="security-detail-section accent">
          <h4>{lang === "en" ? "Why this verdict" : "Почему такой вердикт"}</h4>
          <p>{aiUnavailable ? (lang === "en" ? "AI analysis was temporarily unavailable, so this verdict is based on static analysis only." : "AI-анализ временно недоступен — вердикт основан только на статическом анализе.") : tr(ai?.reason ?? normalized.summary ?? "")}</p>
        </section>
      ) : null}

      {ai?.indicators?.length ? (
        <section className="security-detail-section">
          <h4>{lang === "en" ? "Indicators" : "Индикаторы"}</h4>
          <ul className="security-chip-list">
            {ai.indicators.map((indicator, index) => (
              <li key={`${indicator.type ?? "indicator"}-${index}`}>
                <strong>{indicator.type ?? (lang === "en" ? "Indicator" : "Индикатор")}</strong>
                {indicator.description ? <span>{tr(indicator.description)}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ai?.kill_chain?.length ? (
        <section className="security-detail-section">
          <h4>{lang === "en" ? "Kill chain" : "Цепочка действий"}</h4>
          <ol className="security-step-list">
            {ai.kill_chain.map((step, index) => (
              <li key={`${step}-${index}`}>{tr(step)}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="security-detail-grid compact" aria-label={lang === "en" ? "Additional indicators" : "Дополнительные признаки"}>
        <div>
          <span>{lang === "en" ? "Obfuscation" : "Обфускация"}</span>
          <strong>{formatValue(ai?.obfuscation?.detected)}</strong>
          <em>{tr([ai?.obfuscation?.type, ai?.obfuscation?.depth].filter(Boolean).join(" · ")) || (lang === "en" ? "not specified" : "не указано")}</em>
        </div>
        <div>
          <span>Prompt injection</span>
          <strong>{formatValue(ai?.prompt_injection?.detected)}</strong>
          <em>{tr(ai?.prompt_injection?.details ?? "") || (lang === "en" ? "not specified" : "не указано")}</em>
        </div>
        <div>
          <span>{lang === "en" ? "AI analysis" : "AI анализ"}</span>
          <strong>{normalized.ai?.available === false ? (lang === "en" ? "unavailable" : "недоступен") : normalized.ai?.available === true ? (lang === "en" ? "available" : "доступен") : "—"}</strong>
          <em>{normalized.ai?.available === false ? (lang === "en" ? "static analysis only" : "только статический анализ") : normalized.ai?.available === true ? (lang === "en" ? "response received" : "ответ получен") : (lang === "en" ? "not specified" : "не указано")}</em>
        </div>
      </section>

      {stats.length ? (
        <section className="security-detail-section">
          <h4>{lang === "en" ? "Static analysis statistics" : "Статистика статического анализа"}</h4>
          <div className="security-stat-list">
            {stats.map(([name, value]) => (
              <span key={name}>
                {formatStatName(name)}: <b>{value}</b>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <FindingGroup title={getFindingSeverityLabels(lang).critical} findings={findings.critical ?? []} lang={lang} t={t} />
      <FindingGroup title={getFindingSeverityLabels(lang).warning} findings={findings.warning ?? []} lang={lang} t={t} />
      <FindingGroup title={getFindingSeverityLabels(lang).info} findings={findings.info ?? []} lang={lang} t={t} />

      {staticResult?.safe_markers?.length ? (
        <section className="security-detail-section">
          <h4>{lang === "en" ? "Safe markers" : "Безопасные маркеры"}</h4>
          <div className="security-stat-list">
            {staticResult.safe_markers.map((marker) => (
              <span key={marker}>{marker}</span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ModuleSecurityPanel({
  owner,
  moduleName,
  initialCheck,
  initialQuota,
  canCheck,
  lang = "ru",
}: {
  owner: string;
  moduleName: string;
  initialCheck: SecurityCheck | null;
  initialQuota: SecurityQuota | null;
  canCheck: boolean;
  lang?: "ru" | "en";
}) {
  const [check, setCheck] = useState<SecurityCheck | null>(initialCheck);
  const [quota, setQuota] = useState<SecurityQuota | null>(initialQuota);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [translated, setTranslated] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!check || translated) return;
    const fields: string[] = [];
    const summary = check.summary ?? "";
    const label = check.label ?? "";
    if (summary) fields.push(summary);
    if (label) fields.push(label);

    const d = asSecurityDetails(check.details);
    if (d) {
      if (d.label && d.label !== label) fields.push(d.label);
      if (d.summary && d.summary !== summary) fields.push(d.summary);
      const ai = d.ai?.result;
      if (ai?.reason) fields.push(ai.reason);
      if (ai?.indicators) for (const ind of ai.indicators) { if (ind.description) fields.push(ind.description); }
      if (ai?.kill_chain) for (const step of ai.kill_chain) { fields.push(step); }
      if (ai?.obfuscation?.type) fields.push(ai.obfuscation.type);
      if (ai?.obfuscation?.depth) fields.push(ai.obfuscation.depth);
      if (ai?.prompt_injection?.details) fields.push(ai.prompt_injection.details);
      if (ai?.family) fields.push(ai.family);
      const findings = d.static?.findings;
      if (findings) {
        for (const sev of ["critical", "warning", "info"] as const) {
          for (const f of findings[sev] ?? []) {
            if (f.title) fields.push(f.title);
            if (f.detail) fields.push(f.detail);
          }
        }
      }
    }

    const unique = [...new Set(fields.filter((f) => shouldShowTranslate(f, lang)))];
    if (!unique.length) return;

    let cancelled = false;
    fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts: unique, lang }),
    })
      .then(async (res) => {
        if (res.ok && !cancelled) {
          const data = await res.json();
          const map: Record<string, string> = {};
          for (const [idx, txt] of Object.entries(data.translations as Record<string, string>)) {
            const key = unique[Number(idx)];
            if (key != null) map[key] = txt;
          }
          setTranslated(map);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [check]);

  async function startCheck() {
    if (!canCheck) {
      setShowLogin(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/security-check`, {
        method: "POST",
        cache: "no-cache"
      });
      if (!response.ok) {
        toast.error(response.status === 429 ? (lang === "en" ? "Daily check limit exhausted." : "Лимит проверок на сегодня исчерпан.") : (lang === "en" ? "Failed to check the module." : "Не удалось проверить модуль."));
        return;
      }
      const data = (await response.json()) as { check: SecurityCheck };
      setCheck(data.check);
      setQuota(data.check.quota ?? quota);
      if (data.check.ai_failed) {
        toast.warning(lang === "en" ? "AI analysis is temporarily unavailable — showing the static analysis result only." : "AI-анализ временно недоступен — показан результат только статического анализа.");
      } else {
        toast.success(lang === "en" ? "Module checked" : "Модуль проверен");
      }
    } catch {
      toast.error(lang === "en" ? "Network unavailable, try again later." : "Сеть недоступна, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  const isOfficial = isOfficialDeveloperCheck(check?.details);
  const aiUnavailable = asSecurityDetails(check?.details)?.ai?.available === false;

  return (
    <article className="glass-card security-panel">
      <div className="section-heading">
        <span>{lang === "en" ? "Module check" : "Проверка модуля"}</span>
        <b>{check ? "✓" : "!"}</b>
      </div>
      {check ? (
        <div className="security-result">
          <div className={`security-badge ${verdictClass(check.verdict)}${isOfficial ? " official" : ""}`}>
            <span>{isOfficial ? (lang === "en" ? "Official developer" : "Официальный разработчик") : (lang === "en" ? "Checked" : "Проверен")}</span>
            <strong>{translated?.[check.label] ?? check.label}</strong>
            <em>{isOfficial ? (lang === "en" ? "no scanner needed" : "проверка не требуется") : `confidence ${check.confidence}%`}</em>
          </div>
          <p>{isOfficial ? (lang === "en" ? "This module was made by an official Vector developer. It has been pre-verified and does not require additional security scanning." : "Модуль от официального разработчика Vector. Он предварительно проверен и не требует дополнительного сканирования безопасности.") : aiUnavailable ? (lang === "en" ? "AI analysis is temporarily unavailable — showing the static analysis result only." : "AI-анализ временно недоступен — показан результат только статического анализа.") : (translated?.[check.summary] ?? check.summary)}</p>
          {isOfficial ? null : (
            <details className="security-details">
              <summary>{lang === "en" ? "Detailed breakdown" : "Детальный разбор"}</summary>
              <SecurityDetailsView details={check.details} lang={lang} t={translated} />
            </details>
          )}
        </div>
      ) : (
        <div className="security-result">
          <div className="security-badge unchecked">
            <span>{lang === "en" ? "Status" : "Статус"}</span>
            <strong>{lang === "en" ? "not checked" : "не проверен"}</strong>
            <em>{formatQuotaRemaining(quota, lang)}</em>
          </div>
          <button className="security-check-button" disabled={loading || (canCheck && quota?.remaining === 0)} onMouseDown={(e) => createRipple(e)} onClick={startCheck} type="button">
            {loading ? <SkeletonBar width={90} height={12} radius={4} style={{ display: "inline-block", verticalAlign: "middle" }} /> : (lang === "en" ? "Check module" : "Проверить модуль")}
          </button>
        </div>
      )}
      {quota ? <small className="security-quota">{formatQuota(quota, lang)}</small> : null}
      {showLogin ? (
        <AuthRequiredModal
          title={lang === "en" ? "Sign in with Telegram" : "Войдите через Telegram"}
          description={lang === "en" ? "After sign in you can run module security checks." : "После входа можно запускать проверку модуля."}
          onClose={() => setShowLogin(false)}
          lang={lang}
        />
      ) : null}
    </article>
  );
}
