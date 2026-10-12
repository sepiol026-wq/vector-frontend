import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { backend } from "@/lib/backend";
import { safeDecodeRouteParam } from "@/lib/route-params";
import { resolveLang } from "@/lib/lang";
import { CollectionDetailContent } from "./CollectionDetailContent";
import { CollectionDetailSkeleton } from "./CollectionDetailSkeleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CollectionDetailPage({ params }: PageProps) {
  return (
    <main className="source-shell">
      <style>{shellcss}</style>
      <Suspense fallback={<CollectionDetailSkeleton />}>
        <CollectionDetailPageAsync params={params} />
      </Suspense>
    </main>
  );
}

async function CollectionDetailPageAsync({ params }: PageProps) {
  const rawSlug = (await params).slug;
  const slug = safeDecodeRouteParam(rawSlug).trim();
  if (!slug || slug.length > 200) notFound();
  const data = await backend<{ collection: ComponentProps<typeof CollectionDetailContent>["initialMeta"] }>(`/api/collections/${encodeURIComponent(rawSlug)}`);
  return <CollectionDetailContent initialMeta={data.collection} initialLang={await resolveLang()} />;
}

const shellcss = `
  html { background: #050816; }
  body { margin: 0; min-height: 100vh; background: #050816; color: #f8fbff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  *, *::before, *::after { box-sizing: border-box; }
  a { color: inherit; text-decoration: none; }
  .source-shell { position: relative; width: 100%; min-height: 100vh; padding: 40px clamp(14px, 4vw, 40px); background: radial-gradient(circle at 20% -10%, rgba(255,255,255,.08), transparent 42%), #000; }
  .source-shell::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 52px 52px; mask-image: radial-gradient(circle at center, black, transparent 70%); pointer-events: none; }
  .hero-card, .glass-card { position: relative; z-index: 1; border: 1px solid #1f1f1f; background: #090909; }
  .hero-card { width: 100%; max-width: 1180px; margin: 0 auto 14px; border-radius: 16px; padding: clamp(16px, 3vw, 26px); }
  .hero-topline { display: inline-flex; align-items: center; gap: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: .14em; font-size: 11px; font-weight: 700; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #fff; }
  .hero-content { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 28px; align-items: end; margin-top: 24px; }
  h1 { margin: 0; min-width: 0; max-width: 100%; font-size: clamp(40px, 8vw, 78px); line-height: .9; letter-spacing: -.06em; overflow-wrap: anywhere; word-break: break-word; color: #fff; }
  .description { max-width: 780px; margin: 18px 0 0; overflow-wrap: anywhere; color: #b8b8b8; font-size: clamp(16px, 2vw, 21px); line-height: 1.5; white-space: pre-wrap; }
  .meta-panel { display: grid; gap: 10px; }
  .meta-panel > div { min-width: 0; padding: 14px; border-radius: 12px; background: #111; border: 1px solid #232323; }
  .meta-panel span, .section-heading span, .muted { color: #8b8b8b; }
  .meta-panel > div > span { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; margin-bottom: 6px; color: #8b8b8b; }
  .meta-panel strong { font-size: 16px; overflow-wrap: anywhere; color: #f3f4f6; }
  .glass-card { min-width: 0; border-radius: 16px; padding: 18px; max-width: 1180px; margin: 0 auto 12px; }
  .section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
  .inline-edit-form { margin-bottom: 0; }
  .inline-field { display: block; margin-bottom: 14px; }
  .inline-field > span { display: block; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
  .inline-field input, .inline-field textarea { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #2b2b2b; background: #0f0f0f; color: #e5e7eb; font: inherit; font-size: 16px; }
  .inline-input-name { font-size: clamp(24px, 4vw, 48px) !important; font-weight: 700; letter-spacing: -.04em; color-scheme: dark; outline: none; }
  .inline-input-desc { font-size: 16px !important; line-height: 1.5; resize: vertical; color-scheme: dark; outline: none; }
  .inline-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .inline-checkbox input { width: auto; accent-color: #8b5cf6; color-scheme: dark; outline: none; }
  .inline-checkbox span { font-size: 14px; color: #d1d5db; letter-spacing: normal; margin: 0 !important; }
  .inline-edit-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
  .inline-btn-cancel { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d4; background: #0f0f0f; padding: 9px 18px; font: inherit; font-size: 14px; transition: .15s; }
  .inline-btn-cancel:hover { border-color: #3a3a3a; background: #171717; color: #fff; }
  .inline-btn-save { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d4; background: #111; padding: 10px 20px; font: inherit; font-size: 14px; transition: .15s; }
  .inline-btn-save:hover { border-color: #3a3a3a; background: #171717; color: #fff; }
  .inline-btn-save:disabled { opacity: .5; cursor: not-allowed; }
  .inline-btn-danger { cursor: pointer; border: 1px solid rgba(248,113,113,.3); border-radius: 10px; color: #f87171; background: rgba(248,113,113,.06); padding: 9px 18px; font: inherit; font-size: 14px; transition: .15s; }
  .inline-btn-danger:hover { border-color: rgba(248,113,113,.5); background: rgba(248,113,113,.12); }
  .inline-btn-danger:disabled { opacity: .5; cursor: not-allowed; }
  .btn-dl-collection { display: inline-flex; align-items: center; padding: 10px 20px; border-radius: 999px; border: 1px solid rgba(255,255,255,.08); background: rgba(8,8,8,.72); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); color: #d4d4d4; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all .18s ease; }
  .btn-dl-collection:hover { border-color: rgba(74,222,128,.3); background: rgba(74,222,128,.08); color: #4ade80; transform: translateY(-1px); }
  .btn-dl-collection:active { transform: scale(.97); }
  .drag-hint { color: #8b8b8b; font-size: 12px; font-style: italic; }
  .collection-module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; }
  .module-card { cursor: pointer; border: 1px solid #1f1f1f; background: #090909; border-radius: 14px; padding: 12px; transition: border-color .15s, transform .12s ease; -webkit-tap-highlight-color: transparent; user-select: none; }
  .module-card:active { transform: scale(.97); }
  .module-card:hover { border-color: #2a2a2a; }
  .module-card-main { display: block; text-decoration: none; }
  .module-head { display: flex; justify-content: space-between; gap: 8px; }
  .module-head strong { font-size: 18px; color: #fff; }
  .module-head em { font-size: 10px; color: #8b8b8b; font-style: normal; font-weight: 500; }
  .module-class { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; margin: 4px 0 6px; }
  .module-meta { color: #d4d4d4; }
  .module-card p { font-size: 13px; line-height: 1.45; min-height: 55px; margin: 6px 0; white-space: pre-wrap; }
  .module-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .module-remove-btn { cursor: pointer; border: 1px solid rgba(248,113,113,.3); border-radius: 8px; background: transparent; color: #f87171; padding: 4px 12px; font: inherit; font-size: 11px; transition: .15s; }
  .module-remove-btn:hover:not(:disabled) { border-color: rgba(248,113,113,.5); background: rgba(248,113,113,.1); }
  .module-remove-btn:disabled { opacity: .5; cursor: default; }

  .mass-add-search { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; min-height: 44px; padding: 10px 16px; border-radius: var(--surface-pill); background: var(--surface-field); border: 1px solid var(--surface-border); }
  .mass-add-search:focus-within { outline: 2px solid #d4d4d4; outline-offset: 3px; }
  .mass-add-search.loading .mass-add-dot { animation: md-pulse .8s ease-in-out infinite; }
  .mass-add-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.25); flex-shrink: 0; transition: all .35s cubic-bezier(.4,0,.2,1); }
  .mass-add-search:focus-within .mass-add-dot, .mass-add-search.active .mass-add-dot { background: rgba(255,255,255,.8); box-shadow: 0 0 10px rgba(255,255,255,.15); }
  .mass-add-search input { flex: 1; min-width: 0; width: 100%; padding: 0; background: transparent; border: 0; color: var(--surface-text); font: inherit; font-size: 16px; }
  dialog.vector-modal-presence .mass-add-search input:focus-visible { outline: none !important; }
  @keyframes md-pulse { 0%, 100% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.6); opacity: 1; } }
  .mass-add-list { max-height: 320px; overflow-y: auto; display: grid; gap: 6px; margin-bottom: 12px; }
  .mass-add-empty { color: #8b8b8b; text-align: center; padding: 24px; }
  .mass-add-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-radius: var(--surface-inset-radius); background: var(--surface-field); border: 1px solid var(--surface-border); cursor: pointer; transition: border-color .12s, background .12s; }
  .mass-add-row:hover { border-color: #2a2a2a; background: #141414; }
  .mass-add-row.selected { border-color: #666; background: #1a1a1a; }
  .mass-add-row-info strong { display: block; font-size: 14px; color: #e5e7eb; }
  .mass-add-row-info { min-width: 0; }
  .mass-add-row-info small { color: var(--surface-muted); font-size: 12px; }
  .mass-add-check { flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; border: 1px solid #2b2b2b; background: #111; display: grid; place-items: center; color: #8b8b8b; transition: .12s; }
  .mass-add-check.on { border-color: #666; background: #222; color: #fff; }
  .mass-add-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid var(--surface-border); padding-top: 16px; margin-top: 20px; }
  .mass-add-actions span { color: #8b8b8b; font-size: 13px; }
  .load-more-wrap { display: flex; justify-content: center; padding: 20px 0; }
  .load-more-btn { cursor: pointer; border: 1px solid #2b2b2b; border-radius: 10px; color: #d4d4d4; background: #0f0f0f; padding: 10px 24px; font: inherit; font-size: 14px; transition: .15s; }
  .load-more-btn:hover:not(:disabled) { border-color: #3a3a3a; background: #171717; color: #fff; }
  .load-more-btn:disabled { opacity: .5; cursor: default; }
  .module-drag-handle { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1px solid #2b2b2b; border-radius: 8px; background: #0f0f0f; color: #8b8b8b; opacity: 0; transition: opacity .15s; z-index: 10; pointer-events: none; }
  .module-card { position: relative; }
  .module-card:hover .module-drag-handle, .module-card:active .module-drag-handle { opacity: 1; }
  .module-drag-handle:hover { border-color: #3a3a3a; background: #171717; color: #d4d4d4; }
  .module-drag-handle:active { border-color: #3a3a3a; background: #1f1f1f; color: #fff; }
  .sortable-ghost { opacity: .35; }
  .sortable-drag { box-shadow: 0 14px 40px rgba(0,0,0,.5); border-color: rgba(255,255,255,.12); z-index: 1000; }
  .sortable-drag .module-drag-handle { opacity: 1; }
  @media (max-width: 1080px) { .collection-module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 820px) { .source-shell { padding: 18px 12px 36px; } .hero-card, .glass-card { border-radius: 22px; padding: 18px; } .hero-content { grid-template-columns: 1fr; gap: 14px; } h1 { font-size: clamp(38px, 16vw, 60px); } .description { font-size: 16px; } .collection-module-grid { grid-template-columns: 1fr; } }
`;
