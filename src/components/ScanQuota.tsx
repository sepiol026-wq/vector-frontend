"use client";

export type SecurityQuota = {
  limit: number;
  remaining: number;
  used?: number;
  day_key?: string;
  reset_at?: string;
};

export function ScanQuota({ quota, lang, loading = false, error = false }: {
  quota: SecurityQuota | null;
  lang: "ru" | "en";
  loading?: boolean;
  error?: boolean;
}) {
  const en = lang === "en";
  const title = en ? "Security scans" : "Проверки безопасности";
  const valid = quota && Number.isFinite(quota.limit) && quota.limit >= 0 && Number.isFinite(quota.remaining) && quota.remaining >= 0 && quota.remaining <= quota.limit;
  const available = !loading && !error && valid;
  const reset = available && quota.reset_at ? new Date(quota.reset_at) : null;
  const resetText = reset && !Number.isNaN(reset.getTime()) ? new Intl.DateTimeFormat(en ? "en-GB" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hourCycle: "h23" }).format(reset) : null;
  const remainingText = available ? (en ? `${quota.remaining} of ${quota.limit} scans remaining` : `Осталось ${quota.remaining} из ${quota.limit} проверок`) : "";

  return <section className="scan-quota" data-state={loading ? "loading" : error ? "error" : !valid ? "unavailable" : quota.remaining === 0 ? "exhausted" : "available"} aria-label={title} aria-busy={loading}>
    <div className="scan-quota-heading"><span>{title}</span>{available ? <span className="scan-quota-count" aria-label={remainingText}><strong>{quota.remaining}</strong><span>{en ? `of ${quota.limit} left` : `из ${quota.limit} осталось`}</span></span> : null}</div>
    <div role="status" aria-live="polite">
      {available ? <>
        <progress className="scan-quota-meter" max={quota.limit || 1} value={quota.remaining} aria-label={remainingText} />
        {quota.remaining === 0 ? <p className="scan-quota-empty">{en ? "Daily limit reached" : "Дневной лимит исчерпан"}</p> : null}
        {resetText ? <p className="scan-quota-reset">{en ? "Resets " : "Обновится "}<time dateTime={quota.reset_at}>{resetText} UTC</time></p> : null}
      </> : <><div className="scan-quota-placeholder" aria-hidden="true" /><p className="scan-quota-reset">{loading ? (en ? "Loading remaining scans…" : "Загружаем остаток проверок…") : error ? (en ? "Could not load the limit. Try again later." : "Не удалось загрузить лимит. Попробуйте позже.") : (en ? "Scan limit unavailable" : "Лимит проверок недоступен")}</p></>}
    </div>
    <style>{`
      .scan-quota{min-width:0;padding:16px;border:1px solid #2b2b2b;border-radius:12px;background:#111;color:#f1f1f1;font-size:13px;line-height:1.5;text-align:left}
      .scan-quota-heading{display:flex;align-items:center;justify-content:space-between;gap:8px 16px;flex-wrap:wrap}
      .scan-quota-heading>span:first-child{font-weight:500}
      .scan-quota-count{display:flex;align-items:baseline;gap:7px;white-space:nowrap;font-variant-numeric:tabular-nums}
      .scan-quota-count strong{font-size:24px;line-height:1;font-weight:650;letter-spacing:-.04em}
      .scan-quota-count>span{color:#b5b5b5;font-size:12px}
      .scan-quota-meter,.scan-quota-placeholder{display:block;width:100%;height:6px;margin:12px 0 0;border:0;border-radius:999px;overflow:hidden;background:#303030;appearance:none}
      .scan-quota-meter::-webkit-progress-bar{background:#303030;border-radius:999px}
      .scan-quota-meter::-webkit-progress-value{background:#e5e5e5;border-radius:999px}
      .scan-quota-meter::-moz-progress-bar{background:#e5e5e5;border-radius:999px}
      .scan-quota .scan-quota-reset,.scan-quota .scan-quota-empty{margin:9px 0 0;font-size:12px;line-height:1.5;color:#b5b5b5;overflow-wrap:anywhere}
      .scan-quota .scan-quota-empty{color:#f0ba78}
      .scan-quota[data-state="exhausted"] .scan-quota-count strong{color:#f0ba78}
      .scan-quota[data-state="loading"] .scan-quota-placeholder{background:#262626}
    `}</style>
  </section>;
}
