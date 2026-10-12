"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./module-banner-theme.css";

type Palette = { accent: string; surface: string; raised: string; border: string; primary: string; secondary: string };
const palettes = new Map<string, { palette: Palette; expires: number }>();

function bannerUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    const path = decodeURIComponent(url.pathname);
    if (!/^https?:$/.test(url.protocol) || /(?:^|\/)(?:_fallback|vec404|default404)(?:\.[^/]*)?$/i.test(path)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function sample(image: HTMLImageElement): Palette | null {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, 64, 32);
  const pixels = context.getImageData(0, 0, 64, 32).data;
  const bins = new Map<number, { score: number; count: number; rgb: [number, number, number] }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!, alpha = pixels[i + 3]!;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (alpha < 192 || max < 24 || min > 232) continue;
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
    const bin = bins.get(key) ?? { score: 0, count: 0, rgb: [0, 0, 0] };
    bin.score += 1 + (max - min) / 128;
    bin.count++;
    bin.rgb[0] += r; bin.rgb[1] += g; bin.rgb[2] += b;
    bins.set(key, bin);
  }
  const ranked = [...bins.values()].sort((a, b) => b.score - a.score);
  const vivid = ranked.filter(bin => {
    const channels = bin.rgb.map(value => value / bin.count);
    const high = Math.max(...channels), low = Math.min(...channels);
    return bin.count >= 16 && high >= 85 && (high - low) / high >= 0.3;
  }).sort((a, b) => {
    const score = (bin: typeof a) => {
      const channels = bin.rgb.map(value => value / bin.count);
      const high = Math.max(...channels), low = Math.min(...channels);
      return Math.sqrt(bin.count) * ((high - low) / 255) ** 2;
    };
    return score(b) - score(a);
  });
  const dominant = vivid[0] ?? ranked[0];
  const base = dominant ? dominant.rgb.map(value => value / dominant.count) : [160, 160, 160];
  const rgb = base;
  const secondary = rgb;
  const mix = (base: number, weight: number) => rgb.map(value => Math.round(base * (1 - weight) + value * weight));
  const color = (values: number[]) => `rgb(${values.map(Math.round).join(" ")})`;
  return {
    accent: color(mix(230, 0.32)),
    surface: color(mix(9, 0.12)),
    raised: color(mix(17, 0.13)),
    border: color(mix(36, 0.28)),
    primary: color(rgb),
    secondary: color(secondary),
  };
}

export function ModuleBannerTheme({ banner, scopeKey, children }: {
  banner: string | null | undefined;
  scopeKey: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const identity = `${scopeKey}\n${banner ?? ""}`;
  const [sampled, setSampled] = useState<{ key: string; palette: Palette } | null>(null);
  const palette = sampled?.key === identity ? sampled.palette : null;

  useEffect(() => {
    const image = root.current?.querySelector<HTMLImageElement>(".module-banner-hero img");
    const expected = bannerUrl(banner);
    if (!image || !expected) return;
    let active = true;
    let probe: HTMLImageElement | null = null;
    const reset = () => { if (active) setSampled(null); };
    const update = () => {
      if (!active) return;
      if (!image.complete || !image.naturalWidth || bannerUrl(image.currentSrc || image.src) !== expected) {
        reset();
        return;
      }
      try {
        const cached = palettes.get(expected);
        const next = cached && cached.expires > Date.now() ? cached.palette : sample(image);
        if (next) {
          palettes.delete(expected);
          palettes.set(expected, { palette: next, expires: Date.now() + 300_000 });
          if (palettes.size > 32) palettes.delete(palettes.keys().next().value!);
        }
        setSampled(next ? { key: identity, palette: next } : null);
      } catch {
        reset();
        if (!probe && new URL(expected).origin !== window.location.origin) {
          probe = new Image();
          probe.crossOrigin = "anonymous";
          probe.onload = () => {
            if (!active || !probe || bannerUrl(image.currentSrc || image.src) !== expected) return;
            try {
              const next = sample(probe);
              if (next) {
                palettes.set(expected, { palette: next, expires: Date.now() + 300_000 });
                if (palettes.size > 32) palettes.delete(palettes.keys().next().value!);
                setSampled({ key: identity, palette: next });
              }
            } catch { reset(); }
          };
          probe.onerror = reset;
          probe.src = expected;
        }
      }
    };
    image.addEventListener("load", update);
    image.addEventListener("error", reset);
    const observer = new MutationObserver(() => { reset(); update(); });
    observer.observe(image, { attributes: true, attributeFilter: ["src", "srcset"] });
    queueMicrotask(update);
    return () => {
      active = false;
      if (probe) { probe.onload = null; probe.onerror = null; }
      observer.disconnect();
      image.removeEventListener("load", update);
      image.removeEventListener("error", reset);
    };
  }, [banner, identity]);

  const style = palette ? {
    "--module-accent": palette.accent,
    "--module-surface": palette.surface,
    "--module-raised": palette.raised,
    "--module-border": palette.border,
    "--module-primary": palette.primary,
    "--module-secondary": palette.secondary,
  } as CSSProperties : undefined;

  return <div ref={root} className="module-banner-theme" data-banner-theme={palette ? "ready" : undefined} style={style}>
    {palette ? <div className="module-banner-atmosphere" aria-hidden="true" /> : null}
    {children}
  </div>;
}
