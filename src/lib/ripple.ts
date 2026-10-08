"use client";

import type { MouseEvent as ReactMouseEvent } from "react";

export function createRipple(
  e: ReactMouseEvent<HTMLElement>,
  color = "rgba(255,255,255,.10)"
) {
  const el = e.currentTarget;
  const prevPos = el.style.position || "";
  const prevOverflow = el.style.overflow || "";
  const computedPos = getComputedStyle(el).position;
  if (computedPos === "static") {
    el.style.position = "relative";
  }
  el.style.overflow = "hidden";
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const span = document.createElement("span");
  span.className = "v-ripple";
  span.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:${color};`;
  el.appendChild(span);
  span.addEventListener("animationend", () => {
    span.remove();
    if (computedPos === "static") el.style.position = prevPos;
    el.style.overflow = prevOverflow;
  }, { once: true });
}
