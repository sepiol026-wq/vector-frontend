"use client";

import type { ButtonHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useCallback, useRef } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  rippleColor?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
};

export function RippleButton({
  rippleColor = "rgba(255,255,255,.10)",
  style,
  children,
  onClick,
  ...rest
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const createRipple = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const span = document.createElement("span");
      span.className = "v-ripple";
      span.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:${rippleColor};`;
      btn.appendChild(span);
      span.addEventListener("animationend", () => span.remove(), { once: true });
    },
    [rippleColor]
  );

  const handleDown = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.(e);
    },
    [createRipple, onClick]
  );

  return (
    <button
      ref={btnRef}
      style={{ position: "relative", overflow: "hidden", ...style }}
      onClick={handleDown}
      {...rest}
    >
      {children}
    </button>
  );
}
