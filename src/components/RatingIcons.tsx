import type { SVGProps } from "react";

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function LikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 10v10" strokeWidth="2" />
      <path
        d="M15 6.6 14 10h4.8a2 2 0 0 1 1.95 2.43l-1.15 5.2A3 3 0 0 1 16.67 20H5.8A1.8 1.8 0 0 1 4 18.2v-6.4A1.8 1.8 0 0 1 5.8 10h1.8l4.32-5.08A1.84 1.84 0 0 1 15 6.6Z"
        strokeWidth="2"
      />
    </IconBase>
  );
}

export function DislikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M17 14V4" strokeWidth="2" />
      <path
        d="M9 17.4 10 14H5.2a2 2 0 0 1-1.95-2.43l1.15-5.2A3 3 0 0 1 7.33 4H18.2A1.8 1.8 0 0 1 20 5.8v6.4a1.8 1.8 0 0 1-1.8 1.8h-1.8l-4.32 5.08A1.84 1.84 0 0 1 9 17.4Z"
        strokeWidth="2"
      />
    </IconBase>
  );
}

export function ScoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" strokeWidth="2" />
    </IconBase>
  );
}

export function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"
        strokeWidth="2"
      />
    </IconBase>
  );
}

export function InstallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3v12" strokeWidth="2" />
      <path d="m8 11 4 4 4-4" strokeWidth="2" />
      <path d="M4 17v3h16v-3" strokeWidth="2" />
    </IconBase>
  );
}
