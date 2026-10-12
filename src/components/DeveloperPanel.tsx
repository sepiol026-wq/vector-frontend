"use client";

import { useState, useRef, useEffect, useMemo, type RefObject, type PointerEvent as ReactPointerEvent } from "react";
import { createRipple } from "@/lib/ripple";
import Link from "next/link";

type ModuleCard = {
  id: string; name: string; class_name: string; developer: string;
  description: string; locales?: Record<string,string>; banner: string | null;
  version: string; likes: number; dislikes: number; comments_count?: number;
  score?: number; source_owner: string; source_url: string;
  source_raw_url?: string; source_download_url?: string;
  is_official_developer?: boolean; developer_badge?: "official" | null; tags?: string[];
  hidden?: boolean;
  commands?: string[];
  dependencies?: string[];
  changelog?: string;
  raw_code_size?: number;
  created_at?: string;
  updated_at?: string;
};

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
}

function formatDayShort(d: string, lang: "ru" | "en" = "ru"): string {
  const raw = String(d || "");
  const dateOnly = raw.slice(0, 10);
  const dt = new Date(dateOnly + "T00:00:00Z");
  if (isNaN(dt.getTime())) return raw.slice(5) || raw;
  const mRu = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const mEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = dt.getUTCDate();
  const mon = lang === "ru" ? mRu[dt.getUTCMonth()] : mEn[dt.getUTCMonth()];
  return `${day} ${mon}`;
}

type ChartMode = "bar" | "line" | "overlay";

function useChartWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);
  return [ref, w];
}

function ActivityChart({ breakdown, lang, bucket, title }: { breakdown: any[]; lang: "ru" | "en"; bucket: string; title: string }) {
  const [mode, setMode] = useState<ChartMode>("bar");
  const [hover, setHover] = useState<number | null>(null);
  const [pin, setPin] = useState<number | null>(null);
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [brush, setBrush] = useState<[number, number] | null>(null);
  const [wrapRef, wrapW] = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const brushStartRef = useRef<number | null>(null);

  const types = ["view", "install", "raw_source", "search_impression"];
  const colors: Record<string, string> = {
    view: "#58a6ff", install: "#3fb950", raw_source: "#bc8cff", search_impression: "#d29922",
  };
  const labels: Record<string, string> = {
    view: lang === "en" ? "Views" : "Просмотры",
    install: lang === "en" ? "Installs" : "Установки",
    raw_source: lang === "en" ? "Source" : "Исходник",
    search_impression: lang === "en" ? "Search" : "Поиск",
  };

  const { dayMap, days } = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    const order: string[] = [];
    for (const r of breakdown) {
      const d = String(r.day);
      if (!m.has(d)) { m.set(d, {}); order.push(d); }
      m.get(d)![r.event_type] = (m.get(d)![r.event_type] || 0) + (r.count || 0);
    }
    order.sort((a, b) => (a < b ? -1 : 1));
    return { dayMap: m, days: order };
  }, [breakdown]);

  const lo = zoom ? Math.min(zoom[0], zoom[1]) : 0;
  const hi = zoom ? Math.max(zoom[0], zoom[1]) : days.length - 1;
  const visible = days.slice(lo, hi + 1);

  const wvalue = Math.max(300, wrapW || 660);
  const hvalue = 260, pl = 46, pr = 16, pt = 16, pb = 32;
  const plotW = wvalue - pl - pr;
  const plotH = hvalue - pt - pb;
  const maxTotal = Math.max(1, ...visible.map((d) => types.reduce((s, t) => s + (dayMap.get(d)![t] || 0), 0)));
  const yFor = (v: number) => pt + plotH - (v / maxTotal) * plotH;
  const slotW = plotW / Math.max(1, visible.length);
  const xFor = (i: number) => pl + slotW * i + slotW / 2;
  const active = pin !== null ? pin : hover;
  const activeDay = active !== null && visible[active] ? visible[active] : null;
  const activeVals = activeDay
    ? types.map((t) => ({ t, v: dayMap.get(activeDay)![t] || 0 })).filter((v) => v.v > 0)
    : [];
  const barW = Math.max(3, Math.min(slotW * 0.72, 40));
  const xStep = Math.max(1, Math.ceil(visible.length / Math.max(2, Math.floor(plotW / 52))));

  const idxFromEvent = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg || visible.length <= 1) return 0;
    const rect = svg.getBoundingClientRect();
    const i = Math.floor((clientX - rect.left - pl) / slotW);
    return Math.max(0, Math.min(visible.length - 1, i));
  };
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const i = idxFromEvent(e.clientX);
    brushStartRef.current = i;
    setBrush([i, i]);
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const i = idxFromEvent(e.clientX);
    setHover(i);
    if (brushStartRef.current !== null) setBrush([brushStartRef.current, i]);
  };
  const onPointerUp = () => {
    if (brushStartRef.current !== null && brush) {
      const a = Math.min(brush[0], brush[1]);
      const b = Math.max(brush[0], brush[1]);
      if (b - a >= 1) { setZoom([lo + a, lo + b]); setPin(null); setHover(null); }
    }
    brushStartRef.current = null;
    setBrush(null);
  };
  const resetZoom = () => { setZoom(null); setPin(null); setHover(null); };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const scale = 2;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(wvalue * scale));
    clone.setAttribute("height", String(hvalue * scale));
    clone.setAttribute("viewBox", `0 0 ${wvalue} ${hvalue}`);
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", String(wvalue)); bg.setAttribute("height", String(hvalue));
    bg.setAttribute("fill", "#0d1117");
    clone.insertBefore(bg, clone.firstChild);
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = wvalue * scale; canvas.height = hvalue * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${(title || "chart").toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]+/g, "-").replace(/^-+|-+$/g, "") || "chart"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  };

  const brushX: [number, number] | null = brush ? [xFor(brush[0]), xFor(brush[1])] : null;

  return (
    <div className="ac-chart">
      <div className="ac-chart-head">
        <span className="ac-title" style={{ marginBottom: 0 }}>{title}</span>
        <div className="ac-toolbar">
          <div className="ac-mode">
            <button type="button" className={mode === "bar" ? "on" : ""} onClick={() => setMode("bar")}>{lang === "en" ? "Bars" : "Столбцы"}</button>
            <button type="button" className={mode === "line" ? "on" : ""} onClick={() => setMode("line")}>{lang === "en" ? "Line" : "Линия"}</button>
            <button type="button" className={mode === "overlay" ? "on" : ""} onClick={() => setMode("overlay")}>{lang === "en" ? "Both" : "Налож."}</button>
          </div>
          {zoom && <button type="button" className="ac-btn" onClick={resetZoom}>{lang === "en" ? "Reset" : "Сброс"}</button>}
          <button type="button" className="ac-btn" onClick={exportPng}>PNG</button>
        </div>
      </div>

      <div className="ac-readout">
        {activeDay ? (
          <span className="ac-readout-day">
            <b>{formatDate(activeDay)}</b>
            {activeVals.map((v) => (
              <span key={v.t} className="ac-tt-item">
                <i style={{ background: colors[v.t] }} />{labels[v.t]}: <b>{v.v}</b>
              </span>
            ))}
          </span>
        ) : (
          <span className="ac-tt-hint">{lang === "en" ? "Hover a bar or drag to zoom" : "Наведи на столбец или выдели диапазон для зума"}</span>
        )}
      </div>

      <div className="ac-svg-wrap" ref={wrapRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${wvalue} ${hvalue}`}
          width={wvalue}
          height={hvalue}
          className="ac-svg"
          role="img"
          aria-label={title}
          style={{ display: "block", touchAction: "none", cursor: brush ? "crosshair" : "pointer" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { setHover(null); brushStartRef.current = null; setBrush(null); }}
        >
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={pl} x2={wvalue - pr} y1={yFor(maxTotal * f)} y2={yFor(maxTotal * f)} stroke="#1d2632" strokeWidth="1" />
          ))}
          {[0, 0.5, 1].map((f) => (
            <text key={f} x={pl - 8} y={yFor(maxTotal * f) + 3.5} textAnchor="end" fontSize="10" fill="#7d8590">{Math.round(maxTotal * f)}</text>
          ))}

          {mode !== "line" && visible.map((d, i) => {
            const gx = xFor(i) - barW / 2;
            let cum = 0;
            const on = active === i;
            return (
              <g key={d}>
                {types.map((t) => {
                  const v = dayMap.get(d)![t] || 0;
                  const top = yFor(cum + v);
                  const h = (v / maxTotal) * plotH;
                  cum += v;
                  if (v <= 0) return null;
                  return (
                    <rect
                      key={t} x={gx} y={top} width={barW} height={h}
                      fill={colors[t]} opacity={mode === "overlay" ? 0.45 : on ? 1 : 0.82}
                    />
                  );
                })}
              </g>
            );
          })}

          {mode !== "bar" && types.map((t) => {
            const pts = visible.map((d, i) => ({ x: xFor(i), y: yFor(dayMap.get(d)![t] || 0) }));
            return (
              <g key={t}>
                <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={colors[t]} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={active === i ? 3.8 : 2.4} fill={colors[t]} stroke="#0d1117" strokeWidth="1" opacity={active === i ? 1 : 0.9} />
                ))}
              </g>
            );
          })}

          {visible.map((d, i) => (
            (i % xStep === 0 || i === visible.length - 1) ? (
              <text key={d} x={xFor(i)} y={hvalue - 10} textAnchor="middle" fontSize="10" fill="#7d8590">{formatDayShort(d, lang)}</text>
            ) : null
          ))}

          {brushX && (
            <rect x={Math.min(brushX[0], brushX[1])} y={pt} width={Math.abs(brushX[1] - brushX[0])} height={plotH} fill="#58a6ff" opacity={0.14} stroke="#58a6ff" strokeWidth="1" strokeDasharray="3 2" />
          )}
        </svg>
      </div>

      <div className="ac-legend">
        {types.map((t) => (
          <span key={t} className="ac-legend-item">
            <span className="ac-legend-dot" style={{ background: colors[t] }} />{labels[t]}
          </span>
        ))}
        <span style={{ color: "#6b7683", fontSize: 11 }}>{lang === "en" ? "per " : "за "}{bucket}</span>
        {zoom && <span style={{ color: "#58a6ff", fontSize: 11 }}>· {formatDayShort(days[lo]!, lang)} – {formatDayShort(days[hi]!, lang)}</span>}
      </div>
      <details className="analytics-data"><summary>{lang === "en" ? "View chart data" : "Данные графика"}</summary><div role="region" aria-label={title} tabIndex={0}><table><thead><tr><th scope="col">{lang === "en" ? "Date" : "Дата"}</th>{types.map(type => <th scope="col" key={type}>{labels[type]}</th>)}</tr></thead><tbody>{days.map(day => <tr key={day}><th scope="row">{formatDayShort(day, lang)}</th>{types.map(type => <td key={type}>{dayMap.get(day)?.[type] || 0}</td>)}</tr>)}</tbody></table></div></details>
    </div>
  );
}

function PerModuleAnalytics({ data, loading, lang, days, onDaysChange }: {
  data: any;
  loading: boolean;
  lang: "ru" | "en";
  days: number;
  onDaysChange: (d: number) => void;
}) {
  if (loading) {
    return (
      <div className="pm-analytics">
        <div className="pm-grid">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="pm-card">
              <div className="skel-line skel-text" />
              <div className="skel-line skel-title" style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
        <div className="pm-chart" style={{ height: 120 }}>
          <div className="skel-line" style={{ width: "100%", height: 90 }} />
        </div>
      </div>
    );
  }
  if (data?.error) return <p role="alert">{lang === "en" ? "Analytics could not be loaded." : "Не удалось загрузить аналитику."} <button type="button" onClick={() => onDaysChange(days)}>{lang === "en" ? "Try again" : "Повторить"}</button></p>;
  if (!data) {
    return (
      <div className="pm-analytics">
        <p className="empty">
          {lang === "en"
            ? "No analytics data for this module yet."
            : "По этому модулю пока нет данных аналитики."}
        </p>
      </div>
    );
  }

  const totals = data.totals || {};
  const breakdown = [
    ...((data.daily_breakdown || []) as any[]),
    ...((data.installs_breakdown || []) as any[]).map((r: any) => ({ ...r, event_type: "install" })),
  ];

  return (
    <div className="pm-analytics">
      <div className="pm-period">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={days === d ? "active" : ""}
            onMouseDown={(e) => createRipple(e)}
            onClick={() => onDaysChange(d)}
          >
            {d}d
          </button>
        ))}
      </div>
      <div className="pm-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="pm-card">
          <span className="pm-label">{lang === "en" ? "Views" : "Просмотров"}</span>
          <span className="pm-value">{totals.views_total || 0}</span>
          <span className="pm-recent">+{totals.recent_views || 0} {days}d</span>
        </div>
        <div className="pm-card">
          <span className="pm-label">{lang === "en" ? "Installs" : "Установок"}</span>
          <span className="pm-value">{totals.installs_total || 0}</span>
          <span className="pm-recent">+{totals.recent_installs || 0} {days}d</span>
        </div>
        <div className="pm-card">
          <span className="pm-label">{lang === "en" ? "Search hits" : "В поиске"}</span>
          <span className="pm-value">{totals.search_impressions_total || 0}</span>
          <span className="pm-recent">+{totals.recent_search_impressions || 0} {days}d</span>
        </div>
        <div className="pm-card">
          <span className="pm-label">{lang === "en" ? "Conversion" : "Конверсия"}</span>
          <span className="pm-value">{data.conversion?.rate ?? 0}%</span>
          <span className="pm-recent">{totals.unique_installers || 0} {lang === "en" ? "users" : "юзеров"}</span>
        </div>
      </div>

      {breakdown.length > 0 && (
        <ActivityChart
          breakdown={breakdown}
          lang={lang}
          bucket={data.period?.bucket === "week" ? (lang === "en" ? "week" : "неделя") : (lang === "en" ? "day" : "день")}
          title={lang === "en" ? "Activity" : "Активность"}
        />
      )}
    </div>
  );
}

function DevModuleRow({ m, lang, hidingModules, onToggle, expanded, onExpand, perModuleAnalytics, perModuleLoading, onPerModuleAnalytics, analyticsDays, onAnalyticsDays }: {
  m: ModuleCard;
  lang: "ru" | "en";
  hidingModules: Set<string>;
  onToggle: (id: string, hidden: boolean) => void;
  expanded: boolean;
  onExpand: (id: string | null) => void;
  perModuleAnalytics: Record<string, any>;
  perModuleLoading: Set<string>;
  onPerModuleAnalytics: (moduleId: string, days: number) => void;
  analyticsDays: number;
  onAnalyticsDays: (moduleId: string, d: number) => void;
}) {
  const hidden = m.hidden as boolean;
  const isHiding = hidingModules.has(m.id);
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div className={"dpr-wrapper" + (expanded ? " expanded" : "")}>
      <div className="dev-panel-row">
        <button type="button" className="dpr-info dpr-expand" aria-expanded={expanded} onClick={() => onExpand(expanded ? null : m.id)}>
          <strong>{m.name}</strong>
          <small>v{m.version || "?"} · {m.likes || 0} ▲ · {m.dislikes || 0} ▼ · {m.comments_count ?? 0} 💬</small>
        </button>
        <div className="dpr-actions">
          <span className={"dpr-hint" + (hidden ? " hidden" : "")}>
            {hidden ? (lang === "en" ? "Hidden" : "Скрыт") : (lang === "en" ? "Public" : "Публичный")}
          </span>
          <button
            className={"dpr-toggle" + (hidden ? " restore" : " hide")}
            onMouseDown={(e) => { createRipple(e); e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onToggle(m.id, !hidden); }}
            disabled={isHiding}
          >
            {isHiding ? <span className="dpr-spin" /> : hidden
              ? (lang === "en" ? "Restore" : "Вернуть")
              : (lang === "en" ? "Hide" : "Скрыть")}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="dpr-detail">
          {m.banner && (
            <div className="dpr-banner">
              <img src={m.banner} alt={m.name} />
            </div>
          )}
          <div className="dpr-meta">
            <Link href={m.source_url}>{lang === "en" ? "Open module" : "Открыть модуль"}</Link>
            <span><strong>{m.class_name}</strong></span>
            <span>{formatBytes(m.raw_code_size)}</span>
            <span>{formatDate(m.created_at)} → {formatDate(m.updated_at)}</span>
          </div>
          {(m.description || m.changelog) && (
            <div className="dpr-text-block">
              {m.description && <p className="dpr-desc">{m.description}</p>}
              {m.changelog && (
                <details className="dpr-changelog">
                  <summary>{lang === "en" ? "Changelog" : "Изменения"}</summary>
                  <pre>{m.changelog}</pre>
                </details>
              )}
            </div>
          )}
          {m.tags && m.tags.length > 0 && (
            <div className="dpr-tags">
              {(Array.isArray(m.tags) ? m.tags : String(m.tags).split(", ")).filter(Boolean).map((t: string, i: number) => <span key={i} className="dpr-tag">{t}</span>)}
            </div>
          )}
          {(m.commands && m.commands.length > 0) || (m.dependencies && m.dependencies.length > 0) ? (
            <div className="dpr-lists">
              {m.commands && m.commands.length > 0 && (
                <div className="dpr-list">
                  <span className="dpr-list-label">{lang === "en" ? "Commands" : "Команды"}</span>
                  <div className="dpr-tags">
                    {m.commands.map((c: any, i: number) => <span key={i} className="dpr-tag cmd">{c.cmd || c}</span>)}
                  </div>
                </div>
              )}
              {m.dependencies && m.dependencies.length > 0 && (
                <div className="dpr-list">
                  <span className="dpr-list-label">{lang === "en" ? "Dependencies" : "Зависимости"}</span>
                  <div className="dpr-tags">
                    {m.dependencies.map((d, i) => <span key={i} className="dpr-tag dep">{d}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="dpr-analytics-toggle">
            <button
              type="button"
              className={showAnalytics ? "active" : ""}
              onMouseDown={(e) => createRipple(e)}
              onClick={() => {
                const next = !showAnalytics;
                setShowAnalytics(next);
                if (next && !perModuleAnalytics[m.id]) {
                  onPerModuleAnalytics(m.id, analyticsDays);
                }
              }}
            >
              {lang === "en" ? "Analytics" : "Аналитика"} ▾
            </button>
          </div>

          {showAnalytics && (
            <PerModuleAnalytics
              data={perModuleAnalytics[m.id]}
              loading={perModuleLoading.has(m.id)}
              lang={lang}
              days={analyticsDays}
              onDaysChange={(d) => onAnalyticsDays(m.id, d)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AnalyticsView({ data, lang, days, onDaysChange }: {
  data: any;
  lang: "ru" | "en";
  days: number;
  onDaysChange: (d: number) => void;
}) {
  const totals = data.totals || {};
  const breakdown = [
    ...((data.daily_breakdown || []) as any[]),
    ...((data.installs_breakdown || []) as any[]).map((r: any) => ({ ...r, event_type: "install" })),
  ];
  const modules = (data.modules || []) as any[];
  const queries = (data.search_queries || []) as any[];
  const maxViews = Math.max(1, ...modules.map((m: any) => (m.views_total || 0) + (m.installs_total || 0)));

  return (
    <div className="analytics-content">
      <div className="analytics-period">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={days === d ? "active" : ""}
            onMouseDown={(e) => createRipple(e)}
            onClick={() => onDaysChange(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <span className="ac-label">{lang === "en" ? "Views" : "Просмотров"} ({days}d)</span>
          <span className="ac-value">{modules.reduce((s: number, m: any) => s + (m.recent_views || 0), 0)}</span>
        </div>
        <div className="analytics-card">
          <span className="ac-label">{lang === "en" ? "Installs" : "Установок"} ({days}d)</span>
          <span className="ac-value">{modules.reduce((s: number, m: any) => s + (m.recent_installs || 0), 0)}</span>
        </div>
        <div className="analytics-card">
          <span className="ac-label">{lang === "en" ? "Search hits" : "В поиске"} ({days}d)</span>
          <span className="ac-value">{modules.reduce((s: number, m: any) => s + (m.recent_search_impressions || 0), 0)}</span>
        </div>
        <div className="analytics-card">
          <span className="ac-label">{lang === "en" ? "Installs / search, all time" : "Установки / поиск, всё время"}</span>
          <span className="ac-value">{data.conversion?.rate ?? 0}%</span>
        </div>
      </div>

      {breakdown.length > 0 && (
        <ActivityChart
          breakdown={breakdown}
          lang={lang}
          bucket={data.period?.bucket === "week" ? (lang === "en" ? "week" : "неделя") : (lang === "en" ? "day" : "день")}
          title={`${lang === "en" ? "Activity" : "Активность"} ${days}d`}
        />
      )}

      {modules.length > 0 && (
        <div className="analytics-modules">
          <div className="ac-title">{lang === "en" ? "Module performance" : "Эффективность модулей"}</div>
          {modules.map((m: any) => {
            const total = (m.views_total || 0) + (m.installs_total || 0);
            const barPct = Math.max(2, (total / maxViews) * 100);
            const conv = (m.search_impressions_total || 0) > 0
              ? Math.round(((m.installs_total || 0) / m.search_impressions_total) * 1000) / 10
              : 0;
            return (
              <div className="am-row" key={m.name}>
                <div className="am-info">
                  <strong>{m.name}</strong>
                  <small>
                    {m.views_total || 0} {lang === "en" ? "views" : "просм"} ·{" "}
                    {m.installs_total || 0} {lang === "en" ? "installs" : "устан"} ·{" "}
                    {m.search_impressions_total || 0} {lang === "en" ? "search" : "поиск"} ·{" "}
                    {conv}% {lang === "en" ? "conv" : "конв"}
                  </small>
                </div>
                <div className="am-bar-bg">
                  <div className="am-bar" style={{ width: barPct + "%" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {queries.length > 0 && (
        <div className="analytics-queries">
          <div className="ac-title">{lang === "en" ? "Search queries" : "Поисковые запросы"}</div>
          <div className="aq-table">
            <div className="aq-row aq-head">
              <span>{lang === "en" ? "Query" : "Запрос"}</span>
              <span>{lang === "en" ? "Impressions" : "Показов"}</span>
            </div>
            {queries.slice(0, 20).map((q: any, i: number) => (
              <div className="aq-row" key={i}>
                <span className="aq-query">{q.search_query}</span>
                <span className="aq-count">{q.impressions}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type AbuseFlag = {
  id: string; module_id: string; module_name: string; github_owner: string;
  pattern: string; severity: number; vote_count: number;
  ip: string | null; fingerprint: string | null;
  details: any; reviewed: boolean; reviewed_by: string | null;
  reviewed_at: string | null; created_at: string;
};

function patternLabel(pattern: string, lang: "ru" | "en"): string {
  const map: Record<string, [string, string]> = {
    ip_cluster: ["IP cluster", "IP кластер"],
    fp_cluster: ["Fingerprint cluster", "Фингерпринт кластер"],
    new_account_brigade: ["New accounts sharing an IP", "Новые аккаунты с общим IP"],
    velocity_anomaly: ["Velocity anomaly", "Аномалия скорости"],
  };
  return map[pattern]?.[lang === "en" ? 0 : 1] ?? pattern;
}

function severityColor(severity: number): string {
  if (severity >= 0.7) return "#da3633";
  if (severity >= 0.4) return "#d29922";
  return "#3fb950";
}

export type AbuseSummary = { total: number; modules: number; ip_cluster: number; fp_cluster: number; velocity_anomaly: number; new_account_brigade: number };

function SignalSummary({ data, lang }: { data: AbuseSummary | null; lang: "ru" | "en" }) {
  const patterns = [
    { key: "ip_cluster", label: "IP · 5 мин", en: "IP · 5 min", color: "#58a6ff" },
    { key: "fp_cluster", label: "Устройства · 5 мин", en: "Devices · 5 min", color: "#bc8cff" },
    { key: "velocity_anomaly", label: "Частота · 5 мин", en: "Velocity · 5 min", color: "#d29922" },
    { key: "new_account_brigade", label: "Новые аккаунты · 1 ч", en: "New accounts · 1 h", color: "#f0a16e" },
  ] as const;
  let offset = 0;
  return <div className="signal-summary">
    <div className="signal-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#242424" strokeWidth="8" />
        {patterns.map(item => {
          const length = data?.total ? data[item.key] / data.total * 100 : 0;
          const start = offset; offset += length;
          return <circle key={item.key} cx="60" cy="60" r="50" fill="none" stroke={item.color} strokeWidth="8" pathLength="100" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />;
        })}
      </svg>
      <div><strong>{data?.total ?? "—"}</strong><small>{lang === "en" ? "suspicions" : "подозрений"}</small></div>
    </div>
    <div className="signal-bars">
      {patterns.map(item => <div key={item.key} className="signal-bar-row">
        <span>{lang === "en" ? item.en : item.label}</span><b>{data?.[item.key] ?? "—"}</b>
        <i><span style={{ width: `${data?.total ? data[item.key] / data.total * 100 : 0}%`, background: item.color }} /></i>
      </div>)}
    </div>
    <div className="signal-module-count"><strong>{data?.modules ?? "—"}</strong><span>{lang === "en" ? "modules with suspected manipulation" : "модулей с подозрением на накрутку"}</span></div>
  </div>;
}

export function DeveloperPanel({
  modules,
  lang,
  hidingModules,
  onToggleModule,
  analyticsData,
  analyticsLoading,
  analyticsDays,
  onFetchAnalytics,
  perModuleAnalytics,
  perModuleLoading,
  onPerModuleAnalytics,
  abuseFlags,
  abuseSummary = null,
  flagsLoading,
  flagsError,
  onFetchFlags,
  onReviewFlag,
}: {
  modules: ModuleCard[];
  lang: "ru" | "en";
  hidingModules: Set<string>;
  onToggleModule: (id: string, hidden: boolean) => void;
  analyticsData: any;
  analyticsLoading: boolean;
  analyticsDays: number;
  onFetchAnalytics: (days: number) => void;
  perModuleAnalytics: Record<string, any>;
  perModuleLoading: Set<string>;
  onPerModuleAnalytics: (moduleId: string, days: number) => void;
  abuseFlags: AbuseFlag[];
  abuseSummary?: AbuseSummary | null;
  flagsLoading: boolean;
  flagsError?: boolean;
  onFetchFlags: () => void;
  onReviewFlag: (flagId: string) => void;
}) {
  const [tab, setTab] = useState<"modules" | "analytics" | "flags">("modules");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [perModuleDays, setPerModuleDays] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  const visibleModules = modules.filter(module => `${module.name} ${module.class_name}`.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <>
      <article className="dev-panel-card">
      <div className="section-title dev-panel-title">
        <span>{lang === "en" ? "Your modules" : "Твои модули"}</span>
        <span className="dev-panel-stats">
          {modules.length} {lang === "en" ? "loaded" : "загружено"} ·{" "}
          {modules.reduce((s, m) => s + (m.likes || 0), 0)} {lang === "en" ? "likes" : "лайков"} ·{" "}
          {modules.filter((m) => (m as any).hidden).length} {lang === "en" ? "hidden" : "скрыто"}
        </span>
      </div>

      <div className="dev-panel-tabs" role="group" aria-label={lang === "en" ? "Developer panel sections" : "Разделы панели разработчика"}>
        <button
          type="button"
          aria-pressed={tab === "modules"}
          className={tab === "modules" ? "active" : ""}
          onMouseDown={(e) => createRipple(e)}
          onClick={() => setTab("modules")}
        >
          {lang === "en" ? "Modules" : "Модули"}
        </button>
        <button
          type="button"
          aria-pressed={tab === "analytics"}
          className={tab === "analytics" ? "active" : ""}
          onMouseDown={(e) => createRipple(e)}
          onClick={() => {
            setTab("analytics");
            if (!analyticsData) onFetchAnalytics(analyticsDays);
          }}
        >
          {lang === "en" ? "Analytics" : "Аналитика"}
        </button>
        <button
          type="button"
          aria-pressed={tab === "flags"}
          className={tab === "flags" ? "active" : ""}
          onMouseDown={(e) => createRipple(e)}
          onClick={() => setTab("flags")}
        >
          {lang === "en" ? "Vote manipulation" : "Накрутка"}
          {abuseFlags.length > 0 && (
            <span className="dpr-badge">{abuseFlags.length}</span>
          )}
        </button>
      </div>

      {tab === "modules" ? <label className="dev-filter"><span>{lang === "en" ? "Find a module" : "Найти модуль"}</span><input type="search" value={filter} onChange={event => setFilter(event.target.value)} /></label> : null}
      {tab === "modules" ? (
        visibleModules.length ? (
          visibleModules.map((m) => (
            <DevModuleRow
              key={m.id}
              m={m}
              lang={lang}
              hidingModules={hidingModules}
              onToggle={onToggleModule}
              expanded={expandedId === m.id}
              onExpand={setExpandedId}
              perModuleAnalytics={perModuleAnalytics}
              perModuleLoading={perModuleLoading}
              onPerModuleAnalytics={onPerModuleAnalytics}
              analyticsDays={perModuleDays[m.id] ?? 30}
              onAnalyticsDays={(id, d) => { setPerModuleDays(prev => ({ ...prev, [id]: d })); onPerModuleAnalytics(id, d); }}
            />
          ))
        ) : (
          <p className="empty">
            {lang === "en"
              ? "No modules found. Try another name or upload a module from Telegram."
              : "Модули не найдены. Попробуй другое название или загрузи модуль через Telegram."}
          </p>
        )
      ) : tab === "flags" ? (
        <section className="vote-signals" aria-label={lang === "en" ? "Vote manipulation" : "Накрутка"}>
          <div className="vote-signals-heading">
            <div><h2>{lang === "en" ? "Vote manipulation" : "Накрутка"}</h2><p>{lang === "en" ? "Unreviewed · all dates" : "Непросмотренные · за всё время"}</p></div>
            <button type="button" onClick={onFetchFlags} disabled={flagsLoading}>{lang === "en" ? "Refresh" : "Обновить"}</button>
          </div>
          <SignalSummary data={flagsLoading || flagsError ? null : abuseSummary} lang={lang} />
        {flagsLoading ? (
          <div className="dpr-loading-sk">
            {Array.from({ length: 3 }, (_, i) => {
              const pcts = [35, 55, 25];
              return (
                <div key={i} className="dpr-flag-row">
                  <div className="dpr-flag-info">
                    <div className="skel-line skel-title" />
                    <div className="skel-line skel-text" style={{ marginTop: 6 }} />
                    <div className="dpr-flag-bar-wrap">
                      <div className="dpr-flag-bar-bg"><div className="dpr-flag-bar" style={{ width: pcts[i] + "%" }} /></div>
                      <div className="skel-line" style={{ width: 36, height: 16 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : flagsError ? <p role="alert" className="empty">{lang === "en" ? "— Data unavailable" : "— Данные недоступны"}</p> : abuseFlags.length ? (
          <div className="dpr-flags">
            <p className="vote-signals-count">{lang === "en" ? "Reports" : "Отчёты"}: {abuseFlags.length} / {abuseSummary?.total ?? "—"} · {lang === "en" ? "by score" : "по оценке"}</p>
            {abuseFlags.map((f) => (
              <div key={f.id} className="dpr-flag-row">
                <div className="dpr-flag-info">
                  <div className="dpr-flag-header">
                    <strong>{f.module_name}</strong>
                    <span className="dpr-flag-byline">
                      {f.github_owner} · {new Date(f.created_at).toLocaleString(lang === "en" ? "en-GB" : "ru-RU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC
                    </span>
                  </div>
                  <div className="dpr-flag-bar-wrap">
                    <div className="dpr-flag-bar-bg">
                      <div
                        className="dpr-flag-bar"
                        style={{
                          width: `${Math.round(f.severity * 100)}%`,
                          backgroundColor: severityColor(f.severity),
                        }}
                      />
                    </div>
                    <span className="dpr-flag-pct" style={{ color: severityColor(f.severity) }}>
                      {Math.round(f.severity * 100)}/100
                    </span>
                  </div>
                  <div className="dpr-flag-meta">
                    <span className={`dpr-flag-pattern dpr-flag-pattern-${f.pattern}`}>
                      {patternLabel(f.pattern, lang)}
                    </span>
                    <span>{f.vote_count} {lang === "en" ? "votes" : "голосов"}</span>
                    <span>{lang === "en" ? "Pattern score" : "Оценка паттерна"}</span>
                  </div>
                </div>
                <button
                  className="dpr-flag-review"
                  onMouseDown={(e) => createRipple(e)}
                  onClick={() => onReviewFlag(f.id)}
                >
                  {lang === "en" ? "Review" : "Просмотрено"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">
            {lang === "en"
              ? "No pending reports"
              : "Нет отчётов для просмотра"}
          </p>
        )}
        </section>
      ) : analyticsLoading ? (
        <div className="analytics-sk">
          <div className="analytics-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="analytics-card">
                <div className="skel-line skel-text" />
                <div className="skel-line skel-title" style={{ marginTop: 6 }} />
              </div>
            ))}
          </div>
          <div className="analytics-chart" style={{ height: 160 }}>
            <div className="skel-line" style={{ width: "100%", height: 130 }} />
          </div>
        </div>
      ) : analyticsData?.error ? (
        <p className="empty" role="alert">{lang === "en" ? "Analytics could not be loaded." : "Не удалось загрузить аналитику."} <button type="button" onClick={() => onFetchAnalytics(analyticsDays)}>{lang === "en" ? "Try again" : "Повторить"}</button></p>
      ) : analyticsData ? (
        <AnalyticsView
          data={analyticsData}
          lang={lang}
          days={analyticsDays}
          onDaysChange={onFetchAnalytics}
        />
      ) : (
        <p className="empty">
          {lang === "en"
            ? "No analytics data yet. Data accumulates as users interact with your modules."
            : "Данных аналитики пока нет. Они накапливаются по мере взаимодействия пользователей с твоими модулями."}
        </p>
      )}
    </article>
<style>{`.dev-panel-card{border:1px solid #1f1f1f;border-radius:14px;background:#090909;padding:18px}.dev-panel-title{display:flex;justify-content:space-between;align-items:center}.dev-panel-stats{font-size:12px;color:#8b949e}.dev-panel-tabs{display:flex;align-items:center;gap:2px;min-height:38px;margin:14px 0;padding:4px;border:1px solid rgba(255,255,255,.06);border-radius:999px;background:rgba(8,8,8,.72);overflow-x:auto;scrollbar-width:none}.dev-panel-tabs::-webkit-scrollbar{display:none}.dev-panel-tabs button{position:relative;overflow:hidden;flex:0 0 auto;padding:7px 14px;border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.45);font:500 13px inherit;letter-spacing:.02em;cursor:pointer;transition:.18s ease}.dev-panel-tabs button.active{color:#fff;background:rgba(255,255,255,.08)}.dev-panel-tabs button:hover:not(.active){color:rgba(255,255,255,.75);background:rgba(255,255,255,.04)}@media(max-width:640px){.dev-panel-tabs{min-height:34px;margin:12px 0;padding:3px}.dev-panel-tabs button{padding:5px 10px;font-size:11px}}.dpr-wrapper{margin-bottom:6px}.dpr-wrapper.expanded{margin-bottom:10px}.dev-panel-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid #21262d;border-radius:10px;background:#0d1117;cursor:pointer;transition:.15s}.dev-panel-row:hover{border-color:#30363d}.dpr-wrapper.expanded .dev-panel-row{border-radius:10px 10px 0 0;border-bottom-color:transparent}.dpr-info{display:flex;flex-direction:column;gap:2px;min-width:0}.dpr-info strong{font-size:13px;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dpr-info small{font-size:11px;color:#8b949e}.dpr-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.dpr-hint{font-size:11px;color:#8b949e}.dpr-hint.hidden{color:#da3633}.dpr-toggle{padding:5px 12px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#c9d1d9;font-size:12px;cursor:pointer;transition:.15s;position:relative;overflow:hidden}.dpr-toggle:hover{border-color:#58a6ff}.dpr-toggle.hide{color:#da3633;border-color:#da3633;background:rgba(218,54,51,.08)}.dpr-toggle.restore{color:#3fb950;border-color:#3fb950;background:rgba(63,185,80,.08)}.dpr-spin{width:14px;height:14px;border:2px solid rgba(139,148,158,.2);border-top-color:#8b949e;border-radius:50%;animation:dpr-spin .5s linear infinite;display:inline-block}@keyframes dpr-spin{to{transform:rotate(360deg)}}
.dpr-detail{border:1px solid #21262d;border-top:none;border-radius:0 0 10px 10px;background:#0a0a0a;padding:14px;display:flex;flex-direction:column;gap:12px}
.dpr-banner{width:100%;max-height:160px;overflow:hidden;border-radius:8px;border:1px solid #1f1f1f}
.dpr-banner img{width:100%;height:auto;object-fit:cover;display:block}
.dpr-meta{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#8b949e}
.dpr-meta span{background:#0d1117;padding:3px 8px;border-radius:5px;border:1px solid #1f1f1f}
.dpr-text-block{display:flex;flex-direction:column;gap:8px}
.dpr-desc{font-size:13px;color:#c9d1d9;line-height:1.5;margin:0}
.dpr-changelog{margin:0}
.dpr-changelog summary{font-size:12px;color:#8b949e;cursor:pointer;user-select:none}
.dpr-changelog pre{font-size:11px;color:#8b949e;white-space:pre-wrap;background:#0d1117;padding:10px;border-radius:6px;margin-top:6px;max-height:200px;overflow-y:auto}
.dpr-tags{display:flex;flex-wrap:wrap;gap:4px}
.dpr-tag{font-size:10px;color:#8b949e;background:#111;border:1px solid #1f1f1f;padding:2px 8px;border-radius:4px}
.dpr-tag.cmd{color:#a5d6ff;border-color:#1e3a5f}
.dpr-tag.dep{color:#d2a8ff;border-color:#2a1a3e}
.dpr-lists{display:flex;flex-direction:column;gap:8px}
.dpr-list{display:flex;flex-direction:column;gap:4px}
.dpr-list-label{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:.04em}
.dpr-analytics-toggle{margin-top:2px}
.dpr-analytics-toggle button{padding:5px 14px;border-radius:6px;border:1px solid #21262d;background:transparent;color:#8b949e;font-size:12px;cursor:pointer;transition:.15s}
.dpr-analytics-toggle button:hover{border-color:#30363d;color:#c9d1d9}
.dpr-analytics-toggle button.active{border-color:#58a6ff;color:#58a6ff;background:rgba(56,139,253,.08)}
.dpr-loading{display:flex;align-items:center;gap:8px;font-size:12px;color:#8b949e;padding:8px 0}
.dpr-loading-sk{display:flex;flex-direction:column;gap:8px}
@keyframes skel-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skel-line{height:14px;border-radius:6px;background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);background-size:200% 100%;animation:skel-shimmer 1.6s ease-in-out infinite}
.skel-title{width:65%;height:18px}
.skel-text{width:90%;height:12px}
.pm-analytics{display:flex;flex-direction:column;gap:10px}
.pm-period{display:flex;gap:4px}
.pm-period button{padding:3px 10px;border-radius:5px;border:1px solid #21262d;background:transparent;color:#8b949e;font-size:11px;cursor:pointer}
.pm-period button.active{border-color:#58a6ff;color:#58a6ff;background:rgba(56,139,253,.08)}
.pm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.pm-card{border:1px solid #1f1f1f;border-radius:8px;background:#060606;padding:10px;display:flex;flex-direction:column;gap:2px}
.pm-label{font-size:10px;color:#8b949e;text-transform:uppercase;letter-spacing:.04em}
.pm-value{font-size:18px;font-weight:700;color:#e6edf3}
.pm-recent{font-size:10px;color:#3fb950}
.pm-chart{border:1px solid #1f1f1f;border-radius:8px;background:#060606;padding:10px;display:flex;flex-direction:column;gap:8px}
.pm-svg{width:100%;height:auto}
.pm-legend{display:flex;gap:12px;font-size:10px;color:#8b949e;flex-wrap:wrap}
.pm-legend-item{display:inline-flex;align-items:center;gap:4px}
.pm-legend-dot{display:inline-block;width:8px;height:8px;border-radius:2px;flex-shrink:0}
.analytics-period{display:flex;gap:6px;margin-bottom:14px}.analytics-period button{padding:4px 12px;border-radius:6px;border:1px solid #21262d;background:transparent;color:#8b949e;font-size:12px;cursor:pointer;transition:.15s}.analytics-period button.active{border-color:#58a6ff;color:#58a6ff;background:rgba(56,139,253,.08)}.analytics-period button:hover:not(.active){border-color:#30363d;color:#c9d1d9}.analytics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}@media(max-width:640px){.analytics-grid{grid-template-columns:repeat(2,1fr)}}.analytics-card{border:1px solid #21262d;border-radius:10px;background:#0d1117;padding:14px;display:flex;flex-direction:column;gap:4px}.ac-label{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:.04em}.ac-value{font-size:22px;font-weight:700;color:#e6edf3}.analytics-chart{border:1px solid #21262d;border-radius:10px;background:#0d1117;padding:16px;margin-bottom:16px}.ac-title{font-size:14px;font-weight:600;color:#e6edf3;margin-bottom:12px}.ac-svg{width:100%;height:auto}.ac-legend{display:flex;gap:14px;margin-top:8px;font-size:11px;color:#8b949e;flex-wrap:wrap}.acle-view::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;background:#58a6ff;margin-right:4px;vertical-align:middle}.acle-dl::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;background:#3fb950;margin-right:4px;vertical-align:middle}.acle-src::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;background:#bc8cff;margin-right:4px;vertical-align:middle}.acle-imp::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;background:#d29922;margin-right:4px;vertical-align:middle}.analytics-modules{border:1px solid #21262d;border-radius:10px;background:#0d1117;padding:16px;margin-bottom:16px}.am-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}.am-info{min-width:0;flex:1}.am-info strong{font-size:12px;color:#c9d1d9;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.am-info small{font-size:10px;color:#8b949e}.am-bar-bg{height:6px;background:#21262d;border-radius:3px;flex:1;overflow:hidden}.am-bar{height:100%;background:#58a6ff;border-radius:3px;transition:width .3s}.analytics-queries{border:1px solid #21262d;border-radius:10px;background:#0d1117;padding:16px}.aq-table{display:flex;flex-direction:column}.aq-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #161b22;font-size:12px}.aq-head{color:#8b949e;font-weight:600;font-size:11px;text-transform:uppercase}.aq-query{color:#c9d1d9}.aq-count{color:#8b949e}
.dpr-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:#da3633;color:#fff;font-size:10px;font-weight:700;vertical-align:middle}
.dpr-flags{display:flex;flex-direction:column;gap:6px}
.dpr-flag-row{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid #1f1f1f;border-radius:10px;background:#0a0a0a;transition:.15s}
.dpr-flag-row:hover{border-color:#30363d}
.dpr-flag-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.dpr-flag-header{display:flex;flex-direction:column;gap:2px}
.dpr-flag-header strong{font-size:13px;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dpr-flag-byline{font-size:11px;color:#8b949e}
.dpr-flag-bar-wrap{display:flex;align-items:center;gap:8px}
.dpr-flag-bar-bg{flex:1;height:5px;background:#1f1f1f;border-radius:3px;overflow:hidden}
.dpr-flag-bar{height:100%;border-radius:3px;transition:width .3s}
.dpr-flag-pct{font-size:11px;font-weight:600;min-width:36px;text-align:right}
.dpr-flag-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:10px;color:#8b949e}
.dpr-flag-meta span{background:#0d1117;padding:2px 7px;border-radius:4px;border:1px solid #1f1f1f}
.dpr-flag-pattern-ip_cluster{color:#f0a16e;border-color:#3a2818}
.dpr-flag-pattern-fp_cluster{color:#e2c08d;border-color:#3a2f18}
.dpr-flag-pattern-new_account_brigade{color:#da3633;border-color:#3a1818}
.dpr-flag-pattern-velocity_anomaly{color:#d29922;border-color:#3a2a18}
.dpr-flag-review{flex-shrink:0;padding:5px 12px;border-radius:6px;border:1px solid #30363d;background:transparent;color:#8b949e;font-size:11px;cursor:pointer;transition:.15s;position:relative;overflow:hidden}
.dpr-flag-review:hover{border-color:#3fb950;color:#3fb950}.ac-chart{border:1px solid #21262d;border-radius:10px;background:#0d1117;padding:16px;margin-bottom:16px}.ac-chart-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.ac-mode{display:flex;gap:4px}.ac-mode button{padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:transparent;color:#8b949e;font-size:11px;cursor:pointer;transition:.15s}.ac-mode button.on{border-color:#58a6ff;color:#58a6ff;background:rgba(56,139,253,.08)}.ac-mode button:hover:not(.on){border-color:#30363d;color:#c9d1d9}.ac-readout{min-height:26px;display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:12px;color:#c9d1d9}.ac-readout-day{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.ac-readout-day b{color:#e6edf3}.ac-tt-item{display:inline-flex;align-items:center;gap:5px}.ac-tt-item i{display:inline-block;width:8px;height:8px;border-radius:2px}.ac-tt-hint{color:#6b7683;font-size:11px}.ac-legend{display:flex;gap:14px;margin-top:8px;font-size:11px;color:#8b949e;flex-wrap:wrap}.ac-legend-item{display:inline-flex;align-items:center;gap:5px}.ac-legend-dot{display:inline-block;width:9px;height:9px;border-radius:2px}.ac-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ac-btn{padding:4px 10px;border-radius:6px;border:1px solid #30363d;background:transparent;color:#8b949e;font-size:11px;cursor:pointer;transition:.15s}.ac-btn:hover{border-color:#58a6ff;color:#58a6ff}.ac-svg-wrap{width:100%;overflow-x:auto}.ac-svg{max-width:100%}@media(max-width:520px){.ac-chart{padding:12px}.ac-chart-head{flex-direction:column;align-items:flex-start;gap:8px}.ac-toolbar{width:100%;justify-content:space-between}.ac-legend{gap:8px 14px}}`}</style>
    </>
  );
}
