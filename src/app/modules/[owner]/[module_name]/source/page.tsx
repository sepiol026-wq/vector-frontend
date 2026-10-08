import { Suspense } from "react";
import { ModuleSourceContent } from "./ModuleSourceContent";
import { ModuleSourceSkeleton } from "./ModuleSourceSkeleton";
import { OFFICIAL_BADGE_CSS } from "@/components/OfficialBadge";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ owner: string; module_name: string }>;
  searchParams?: Promise<{ rev?: string; diff?: string; lang?: string }>;
};

export { generateMetadata } from "./metadata";

export default function ModuleSourcePage(props: PageProps) {
  return (
    <main className="source-shell">
      <style>{pagecss}</style>
      <Suspense fallback={<ModuleSourceSkeleton />}>
        <ModuleSourceContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

const pagecss = `
  html { background: #050816; }
  body { margin: 0; min-height: 100vh; background: #050816; color: #f8fbff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  *, *::before, *::after { box-sizing: border-box; }
  .source-shell { position: relative; width: 100%; min-height: 100vh; padding: 16px clamp(14px, 3vw, 30px) 40px; background: radial-gradient(circle at 20% -10%, rgba(255,255,255,.08), transparent 42%), #000; }
  .source-shell::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 52px 52px; mask-image: radial-gradient(circle at center, black, transparent 70%); pointer-events: none; }
  .hero-card, .glass-card, .code-card, .comments-card { position: relative; z-index: 1; border: 1px solid #1f1f1f; background: #090909; box-shadow: none; backdrop-filter: none; }
  .hero-card { width: 100%; max-width: 1180px; margin: 0 auto 14px; border-radius: 16px; padding: clamp(16px, 3vw, 26px); }
  .hero-topline { display: inline-flex; align-items: center; gap: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: .14em; font-size: 11px; font-weight: 700; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: none; }
  .hero-content { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 28px; align-items: end; margin-top: 24px; }
  h1 { margin: 0; min-width: 0; max-width: 100%; font-size: clamp(40px, 8vw, 78px); line-height: .9; letter-spacing: -.06em; overflow-wrap: anywhere; word-break: break-word; color: #fff; }
  .description { max-width: 780px; margin: 18px 0 0; overflow-wrap: anywhere; color: #b8b8b8; font-size: clamp(16px, 2vw, 21px); line-height: 1.5; }
  .title-row { min-width: 0; display: flex; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
  .official-badge, .official-inline { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #2d2d2d; border-radius: 999px; color: #d4d4d4; background: #121212; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 7px 10px; }
  .official-inline { margin-left: 8px; padding: 4px 7px; font-size: 10px; vertical-align: middle; }
  .meta-panel { display: grid; gap: 10px; }
  .meta-panel div { min-width: 0; padding: 14px; border-radius: 12px; background: #111; border: 1px solid #232323; }
  .meta-panel span, .section-heading span, .muted { color: #8b8b8b; }
  .meta-panel span { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; margin-bottom: 6px; }
  .meta-panel strong { font-size: 16px; overflow-wrap: anywhere; color: #f3f4f6; }
  .rating-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .rating-panel button { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 12px; color: #e5e7eb; background: #121212; padding: 12px; display: grid; gap: 4px; justify-items: center; transition: .15s ease; }
  .rating-panel button:hover, .rating-panel button.selected { transform: translateY(-1px); border-color: #3a3a3a; background: #171717; }
  .rating-panel button:disabled { cursor: wait; opacity: .78; }
  .rating-panel span { display: grid; place-items: center; }
  .rating-panel svg { width: 24px; height: 24px; color: #d1d5db; }
  .rating-panel b { font-size: 22px; }
   .rating-panel em { font-size: 11px; color: #94a3b8; font-style: normal; text-transform: uppercase; letter-spacing: .12em; }
   .rating-panel button.vote-pop-like svg { color: #4ade80 !important; }
   .rating-panel button.vote-pop-dislike svg { color: #f87171 !important; }
   @keyframes vote-pop { 0%{transform:scale(1)} 25%{transform:scale(1.35)} 50%{transform:scale(.85)} 75%{transform:scale(1.1)} 100%{transform:scale(1)} }
   @keyframes count-bump { 0%{transform:scale(1)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} }
   .vote-pop svg { animation: vote-pop .45s cubic-bezier(.34,1.56,.64,1); }
    .count-bump { animation: count-bump .35s ease; }
    @keyframes decay-snap { 0%{transform:scale(1);opacity:1;filter:blur(0) grayscale(0) brightness(1)} 30%{transform:scale(.85);opacity:.85;filter:blur(.5px) grayscale(.3) brightness(1.1)} 60%{transform:scale(.3);opacity:.35;filter:blur(2px) grayscale(.8) brightness(1.4)} 100%{transform:scale(0);opacity:0;filter:blur(5px) grayscale(1) brightness(1.6)} }
    .decay-snap { animation: decay-snap .45s cubic-bezier(.4,0,.2,1) forwards; }
  .modal-backdrop { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; min-height: 100dvh; padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom)); overflow-y: auto; background: rgba(0, 0, 0, .85); }
  .login-modal { position: relative; width: min(380px, 100%); max-height: calc(100dvh - 28px); overflow-y: auto; border: 1px solid #1f1f1f; border-radius: 16px; padding: 22px; background: #090909; }
  .login-modal h2 { margin: 16px 52px 10px 0; font-size: clamp(26px, 7vw, 34px); line-height: 1.03; letter-spacing: -.04em; }
  .login-modal p, .tg-login-error { color: #d4d4d4; line-height: 1.45; }
  .login-modal p { margin: 0 0 18px; font-size: 16px; }
  .tg-login-slot { min-height: 46px; display: flex; justify-content: flex-start; align-items: center; }
  .tg-login-loading { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; color: #d4d4d4; background: rgba(255,255,255,.04); text-decoration: none; }
  .modal-close { position: absolute; right: 12px; top: 12px; width: 38px; height: 38px; border: 1px solid #2b2b2b; border-radius: 12px; background: #0f0f0f; color: #d4d4d4; font-size: 24px; line-height: 1; cursor: pointer; transition: .15s; }
  .modal-close:hover { border-color: #3a3a3a; background: #171717; color: #fff; }
  .info-grid { position: relative; z-index: 1; width: 100%; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 12px; max-width: 1180px; margin: 0 auto 12px; }
  .glass-card { min-width: 0; border-radius: 16px; padding: 18px; }
  .section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
  .section-heading b { display: grid; place-items: center; min-width: 34px; height: 34px; border-radius: 999px; background: #171717; color: #d1d5db; border: 1px solid #2a2a2a; }
  .command-list, .dependency-list { display: flex; flex-wrap: wrap; gap: 12px; }
  .revision-grid { display: grid; gap: 10px; }
  .revision-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #27272a; border-radius: 12px; padding: 10px; background: #101010; }
  .revision-row.active { border-color: #52525b; background: #151515; }
  .revision-link { display: inline-flex; align-items: center; gap: 10px; color: #e5e7eb; text-decoration: none; }
  .revision-link code { padding: 6px 10px; border-radius: 8px; background: #18181b; border: 1px solid #2a2a2a; font-weight: 700; }
  .revision-link span { color: #a1a1aa; font-size: 13px; }
  .revision-link.active code { border-color: #4b5563; }
  .revision-actions { display: inline-flex; flex-wrap: wrap; gap: 8px; }
  .revision-actions a { border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d8; background: #151515; padding: 7px 10px; font-size: 12px; text-decoration: none; }
  .revision-actions a:hover { border-color: #3f3f46; background: #1f1f23; }
  .command-pill { min-width: 0; flex: 1 1 230px; padding: 14px; border-radius: 18px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); overflow-wrap: anywhere; word-break: break-word; }
  .command-pill code, .dependency-list code { color: #d1d5db; font-weight: 800; overflow-wrap: anywhere; }
  .command-pill p { margin: 8px 0 0; color: #d4d4d4; line-height: 1.45; overflow-wrap: anywhere; }
  .dependency-list code { min-width: 0; max-width: 100%; padding: 10px 12px; border-radius: 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); }
  .security-panel { display: grid; gap: 14px; }
  .security-result { display: grid; gap: 12px; }
  .security-badge { display: grid; gap: 4px; padding: 14px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); }
  .security-badge span, .security-badge em, .security-quota { color: #94a3b8; font-size: 12px; font-style: normal; text-transform: uppercase; letter-spacing: .1em; }
  .security-badge strong { font-size: 22px; }
  .security-badge.safe strong { color: #86efac; }
  .security-badge.suspicious strong { color: #fde68a; }
  .security-badge.unsafe strong { color: #fda4af; }
  .security-check-button { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 999px; color: #d4d4d4; background: #111; padding: 11px 15px; transition: .2s ease; font: inherit; font-size: 14px; }
  .security-check-button:hover:not(:disabled) { transform: translateY(-1px); border-color: #3a3a3a; background: #171717; color: #fff; }
  .security-check-button:disabled { cursor: not-allowed; opacity: .56; }
  .security-result p { margin: 0; color: #d4d4d4; line-height: 1.5; }
  .security-result details { border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 12px; background: rgba(255,255,255,.02); }
  .security-result summary { cursor: pointer; color: #d1d5db; font-weight: 800; }
  .security-detail-body { display: grid; gap: 14px; margin-top: 14px; color: #d4d4d4; }
  .security-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .security-detail-grid div { min-width: 0; display: grid; gap: 5px; padding: 12px; border: 1px solid rgba(255,255,255,.05); border-radius: 14px; background: rgba(255,255,255,.04); }
  .security-detail-grid span, .security-detail-grid em, .security-detail-section small, .security-finding-list span, .security-detail-muted { color: #94a3b8; font-size: 12px; font-style: normal; }
  .security-detail-grid span { text-transform: uppercase; letter-spacing: .08em; }
  .security-detail-grid strong { color: #f8fbff; overflow-wrap: anywhere; }
  .security-detail-grid.compact { grid-template-columns: 1fr; }
  .security-detail-section { display: grid; gap: 10px; padding: 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 14px; background: rgba(255,255,255,.02); }
  .security-detail-section.accent { border-color: rgba(148,163,184,.22); background: rgba(148,163,184,.08); }
  .security-detail-section h4 { margin: 0; color: #f8fbff; font-size: 13px; text-transform: uppercase; letter-spacing: .1em; }
  .security-detail-section p { margin: 0; color: #d4d4d4; line-height: 1.5; }
  .security-chip-list, .security-step-list, .security-finding-list { margin: 0; padding: 0; list-style: none; }
  .security-chip-list { display: grid; gap: 8px; }
  .security-chip-list li { display: grid; gap: 4px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,.02); }
  .security-step-list { counter-reset: security-step; display: grid; gap: 8px; }
  .security-step-list li { counter-increment: security-step; position: relative; padding: 9px 10px 9px 40px; border-radius: 12px; background: rgba(255,255,255,.02); color: #d4d4d4; line-height: 1.45; }
  .security-step-list li::before { content: counter(security-step); position: absolute; left: 10px; top: 8px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 999px; color: #020617; background: #d1d5db; font-size: 12px; font-weight: 900; }
  .security-stat-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .security-stat-list span { padding: 8px 10px; border-radius: 999px; color: #d4d4d4; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); }
  .security-finding-list { display: grid; gap: 9px; }
  .security-finding-list li { display: grid; gap: 6px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,.02); }
  .security-finding-list div { display: grid; gap: 3px; }
  .security-finding-list strong { color: #f8fbff; overflow-wrap: anywhere; }
  .security-error { color: #fda4af; font-style: normal; }
  .code-card { width: 100%; max-width: 1180px; margin: 0 auto 12px; border-radius: 16px; overflow: hidden; }
  .code-toolbar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px 14px; background: #0d0d0d; border-bottom: 1px solid #1f1f1f; }
  .code-window-controls { white-space: nowrap; }
  .window-dot { display: inline-block; width: 12px; height: 12px; border-radius: 999px; margin-right: 8px; }
  .red { background: #fb7185; } .yellow { background: #facc15; } .green { background: #34d399; }
  .code-title { color: #d4d4d4; font-size: 14px; overflow-wrap: anywhere; }
  .code-actions { display: inline-flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
  .code-actions a { border: 1px solid #2b2b2b; border-radius: 10px; color: #e5e7eb; background: #111; padding: 9px 13px; font-size: 13px; font-weight: 700; text-decoration: none; transition: .15s ease; }
  .code-actions a:hover { transform: translateY(-1px); border-color: #3a3a3a; background: #171717; }
  .code-block { color: #e2e8f0; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; overflow: auto; max-height: 74vh; padding: 18px; font-size: 13px; line-height: 1.7; background: linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.7)); }
  .code-block code { font-family: inherit !important; }
  .comments-card { z-index: 1; width: 100%; max-width: 1180px; margin: 0 auto; border-radius: 16px; padding: 18px; }
  .comments-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .comments-title span { color: #a7f3d0; text-transform: uppercase; letter-spacing: .16em; font-size: 12px; font-weight: 900; }
  .comments-title h2 { margin: 8px 0 0; font-size: clamp(32px, 5vw, 58px); line-height: .92; letter-spacing: -.06em; }
  .comments-title b { display: grid; place-items: center; min-width: 48px; height: 48px; border-radius: 999px; background: rgba(255,255,255,.05); color: #d1d5db; font-size: 22px; }
  .comment-form { display: grid; gap: 10px; margin-bottom: 12px; border: 1px solid #242424; border-radius: 14px; padding: 12px; background: #0d0d0d; }
  .comment-form.compact { margin: 12px 0; border-radius: 18px; padding: 10px; }
  .comment-form textarea { min-height: 118px; resize: vertical; border: 0; outline: 0; border-radius: 18px; padding: 14px; color: #f8fbff; background: rgba(255,255,255,.04); font: inherit; line-height: 1.5; }
  .comment-form.compact textarea { min-height: 86px; }
  .comment-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .comment-actions.wide { justify-content: space-between; }
  .comment-actions button { cursor: pointer; border: 1px solid rgba(148,163,184,.28); border-radius: 999px; color: #d4d4d4; background: rgba(148,163,184,.12); padding: 9px 13px; transition: .2s ease; }
  .comment-actions button:hover:not(:disabled) { transform: translateY(-1px); border-color: rgba(255,255,255,.12); background: rgba(148,163,184,.2); }
  .comment-actions button:disabled { cursor: not-allowed; opacity: .55; }
  .comment-login { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 18px; padding: 16px; border-radius: 20px; color: #d4d4d4; background: rgba(148,163,184,.1); border: 1px solid rgba(255,255,255,.05); }
  .comment-login p { margin: 0; }
  .comment-login-button { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 999px; color: #d4d4d4; background: #111; padding: 11px 15px; transition: .2s ease; font: inherit; font-size: 14px; }
  .comment-login-button:hover { transform: translateY(-1px); border-color: #3a3a3a; background: #171717; color: #fff; }
  .comment-error { display: block; margin: 8px 0 14px; color: #fda4af; font-style: normal; }
  .comment-list, .comment-replies { display: grid; gap: 12px; }
  .comment-replies { margin-top: 12px; padding-left: 18px; border-left: 1px solid rgba(148,163,184,.22); }
  .comment-card { border: 1px solid #242424; border-radius: 12px; padding: 14px; background: #101010; }
  .comment-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .comment-avatar { width: 44px; height: 44px; border-radius: 16px; display: grid; place-items: center; flex: 0 0 auto; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); background-position: center; background-size: cover; font-weight: 900; }
  .comment-head strong { display: block; overflow-wrap: anywhere; }
  .comment-head small, .comment-actions small { color: #94a3b8; }
  .comment-card p { white-space: pre-wrap; overflow-wrap: anywhere; color: #e2e8f0; line-height: 1.58; margin: 0 0 12px; }
  .revision-grid { display: grid; gap: 10px; }
  .revision-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #27272a; border-radius: 12px; padding: 10px; background: #101010; }
  .revision-row.active { border-color: #52525b; background: #151515; }
  .revision-link { display: inline-flex; align-items: center; gap: 10px; color: #e5e7eb; text-decoration: none; }
  .revision-link code { padding: 6px 10px; border-radius: 8px; background: #18181b; border: 1px solid #2a2a2a; font-weight: 700; }
  .revision-link span { color: #a1a1aa; font-size: 13px; }
  .revision-link.active code { border-color: #4b5563; }
  .revision-actions { display: inline-flex; flex-wrap: wrap; gap: 8px; }
  .revision-actions a { border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d8; background: #151515; padding: 7px 10px; font-size: 12px; text-decoration: none; }
  .revision-actions a:hover { border-color: #3f3f46; background: #1f1f23; }
  .github-diff-head { display: flex; gap: 12px; padding: 8px 14px; border-bottom: 1px solid #1f1f1f; background: #0f1115; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; justify-content: space-between; }
  .diff-head-left { color: #f87171; }
  .diff-head-right { color: #4ade80; }
  .diff-stats { font-size: 11px; font-weight: 700; }
  .diff-stat-add { color: #4ade80; }
  .diff-stat-remove { color: #f87171; }
  .github-diff { margin: 0; padding: 0; overflow: auto; max-height: 62vh; }
  .diff-line { display: grid; grid-template-columns: 52px 52px 18px 1fr; font-size: 13px; line-height: 1.6; border-bottom: 1px solid #151515; min-height: 22px; }
  .diff-gutter { display: block; text-align: right; padding: 0 6px; color: rgba(255,255,255,.25); user-select: none; }
  .diff-gutter-old { color: rgba(255,255,255,.2); }
  .diff-gutter-new { color: rgba(255,255,255,.2); }
  .diff-sign, .diff-text { display: block; white-space: pre-wrap; }
  .diff-sign { text-align: center; color: rgba(255,255,255,.3); }
  .diff-text { padding: 0 12px; }
  .diff-line.add { background: rgba(22, 101, 52, .28); }
  .diff-line.add .diff-sign { background: rgba(22, 101, 52, .4); color: #4ade80; }
  .diff-line.add .diff-text { color: #bbf7d0; }
  .diff-line.add .diff-gutter { color: rgba(74,222,128,.5); }
  .diff-line.remove { background: rgba(127, 29, 29, .28); }
  .diff-line.remove .diff-sign { background: rgba(127, 29, 29, .4); color: #f87171; }
  .diff-line.remove .diff-text { color: #fecdd3; }
  .diff-line.remove .diff-gutter { color: rgba(248,113,113,.5); }
  .diff-line.same { background: #090b10; }
  .diff-line.same .diff-sign { color: rgba(255,255,255,.1); }
  @media (max-width: 820px) { .hero-card, .glass-card, .code-card, .comments-card { border-radius: 22px; } .hero-card, .glass-card, .comments-card { padding: 18px; } .hero-content, .info-grid { grid-template-columns: 1fr; gap: 14px; } .hero-topline { letter-spacing: .1em; font-size: 10px; } h1 { font-size: clamp(38px, 16vw, 60px); letter-spacing: -.06em; } .description { font-size: 16px; margin-top: 16px; } .meta-panel div { padding: 14px; border-radius: 16px; } .rating-panel button { min-height: 84px; } .command-pill { flex-basis: 100%; min-width: 0; } .code-toolbar { grid-template-columns: 1fr; align-items: flex-start; padding: 14px; } .code-actions { width: 100%; justify-content: flex-start; } .code-block { max-height: 62vh !important; padding: 14px !important; font-size: 12px !important; } .comments-title { align-items: flex-start; flex-direction: column; } .comment-replies { padding-left: 10px; } }
  @media (max-width: 640px) { .source-shell { padding: 8px 14px 40px; } }

  .module-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
  .tag-pill{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;line-height:1.5}
  .tag-c1{background:rgba(96,165,250,.15);color:#60a5fa}
  .tag-c2{background:rgba(167,139,250,.15);color:#a78bfa}
  .tag-c3{background:rgba(52,211,153,.15);color:#34d399}
  .tag-c4{background:rgba(251,146,60,.15);color:#fb923c}
  .tag-c5{background:rgba(244,114,182,.15);color:#f472b6}
  .tag-c6{background:rgba(250,204,21,.15);color:#facc15}
  .tag-c7{background:rgba(148,163,184,.15);color:#94a3b8}
  ${OFFICIAL_BADGE_CSS}
  .official-badge .ob{margin-left:0}
  .author-line{display:inline-flex;align-items:center;gap:6px;max-width:100%}
  .author-line a{min-width:0}
  .author-line .ob{margin-left:0}
`;
