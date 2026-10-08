import type { CSSProperties } from "react";

export function OfficialBadge({ size = 16, title }: { size?: number; title?: string }) {
  const label = title ?? "Official developer";

  return (
    <span
      className="ob"
      style={{ "--ob-size": `${size}px` } as CSSProperties}
      role="img"
      aria-label={label}
      title={label}
    >
      <span className="ob-hex">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            className="ob-check-path"
            d="M5.5 12.5 L10 17 L18.5 7.5"
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

export const OFFICIAL_BADGE_CSS = `
.ob{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex:0 0 auto;margin-left:6px;filter:drop-shadow(0 0 4px rgba(110,175,240,.4));animation:ob-pop .45s cubic-bezier(.34,1.56,.64,1) both}
.ob-hex{display:inline-flex;align-items:center;justify-content:center;width:var(--ob-size,16px);height:var(--ob-size,16px);position:relative;clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:linear-gradient(155deg,#ffffff 0%,#eef3f8 28%,#c9d8e6 60%,#e6eef6 100%)}
.ob-hex::before{content:"";position:absolute;inset:0;clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:linear-gradient(115deg,transparent 34%,rgba(255,255,255,.95) 46%,rgba(255,255,255,.18) 55%,transparent 68%);background-size:300% 300%;background-position:140% 0;animation:ob-sheen 3s ease-in-out infinite;pointer-events:none}
.ob-hex svg{position:relative;z-index:1;display:block;width:56%;height:56%;color:#15283a;filter:drop-shadow(0 1px 1px rgba(255,255,255,.65))}
.ob-check-path{stroke-dasharray:1;stroke-dashoffset:1;animation:ob-draw .55s cubic-bezier(.65,0,.35,1) .08s forwards}
@keyframes ob-sheen{0%,55%{background-position:140% 0}100%{background-position:-140% 0}}
@keyframes ob-draw{to{stroke-dashoffset:0}}
@keyframes ob-pop{0%{transform:scale(0) rotate(-16deg)}60%{transform:scale(1.18) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
`;
