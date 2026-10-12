"use client";

import { useEffect, useRef } from "react";
import "./vector-motion.css";

export function VectorMotion({ tab, loading, revision }: { tab: string; loading: boolean; revision: readonly unknown[] }) {
  const marker = useRef<HTMLSpanElement>(null);
  const entered = useRef(false);
  const previous = useRef<{ tab: string; revision: readonly unknown[]; loading: boolean } | null>(null);
  const animations = useRef(new Set<Animation>());

  useEffect(() => {
    const root = marker.current?.parentElement;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      animations.current.forEach(animation => animation.cancel());
      animations.current.clear();
    };
    const visibility = () => {
      root.dataset.motionHidden = String(document.hidden);
      if (document.hidden) finish();
    };
    const reduce = () => { if (reduced.matches) finish(); };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        element.dataset.motionOffscreen = String(!entry.isIntersecting);
        if (!entry.isIntersecting) {
          animations.current.forEach(animation => {
            const target = (animation.effect as KeyframeEffect | null)?.target;
            if (target instanceof Node && element.contains(target)) animation.cancel();
          });
        }
      }
    });
    const observed = new Set<Element>();
    const observe = () => {
      for (const element of observed) {
        if (!element.isConnected) { observer.unobserve(element); observed.delete(element); }
      }
      root.querySelectorAll(":scope > section").forEach(element => {
        if (!observed.has(element)) { observed.add(element); observer.observe(element); }
      });
    };
    const mutation = new MutationObserver(observe);
    mutation.observe(root, { childList: true });
    observe();
    visibility();
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reduce);
    return () => {
      finish();
      entered.current = false;
      previous.current = null;
      observer.disconnect();
      mutation.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reduce);
      delete root.dataset.motionHidden;
    };
  }, []);

  useEffect(() => {
    const root = marker.current?.parentElement;
    const initial = previous.current === null;
    const prior = previous.current ?? { tab, revision, loading };
    previous.current = { tab, revision, loading };
    if (!root || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const play = (element: Element | null, frames: Keyframe[], duration: number, delay = 0) => {
      if (!element || typeof element.animate !== "function") return;
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      animations.current.forEach(animation => {
        if ((animation.effect as KeyframeEffect | null)?.target === element) animation.cancel();
      });
      const animation = element.animate(frames, { duration, delay, easing: "cubic-bezier(.16,1,.3,1)" });
      animations.current.add(animation);
      void animation.finished.then(() => animations.current.delete(animation), () => animations.current.delete(animation));
    };
    const titleEntering = tab === "search" && !entered.current;
    if (titleEntering) {
      entered.current = true;
      root.querySelectorAll(".vector-title-word").forEach((word, index) => play(word, [
        { transform: "translateX(28px)", opacity: .35 },
        { transform: "translateX(0)", opacity: 1 },
      ], 900, index * 95));
      play(root.querySelector(".vector-signal-word"), [
        { transform: "translateX(90px)", opacity: 0 },
        { transform: "translateX(0)", opacity: .55, offset: .45 },
        { transform: "translateX(0)", opacity: .09 },
      ], 1700);
      play(root.querySelector(".vector-signal-echo"), [
        { transform: "translate(-60px, 42px)", opacity: 0 },
        { transform: "translate(-20px, 14px)", opacity: .14, offset: .35 },
        { transform: "translate(0, 0)", opacity: 0 },
      ], 1400);
      root.querySelectorAll(".vector-signal-track").forEach((track, index) => play(track, [
        { transform: `translateY(${(index - 1) * 44}px) scaleX(0)`, opacity: 0 },
        { transform: `translateY(${(index - 1) * 22}px) scaleX(1)`, opacity: .5, offset: .4 },
        { transform: "translateY(0) scaleX(1)", opacity: .12 },
      ], 1400, index * 80));
      play(root.querySelector(".vector-signal-dot"), [
        { transform: "translateX(-220px) scale(.5)", opacity: 0 },
        { transform: "translateX(0) scale(1.5)", opacity: 1, offset: .55 },
        { transform: "translateX(0) scale(1)", opacity: .5 },
      ], 1500, 80);
    }
    if (prior.tab !== tab || (initial && tab !== "search")) {
      const direction = ["search", "stats", "collections", "profile"].indexOf(tab) > ["search", "stats", "collections", "profile"].indexOf(prior.tab) ? 1 : -1;
      root.querySelectorAll(":scope > section").forEach(section => {
        if (titleEntering && section.classList.contains("vector-explore")) return;
        play(section, [
        { transform: `translateX(${direction * 12}px)`, opacity: .6 },
        { transform: "translateX(0)", opacity: 1 },
      ], 320);
      });
    } else if (!loading && (prior.loading || (prior.revision !== revision && prior.revision[0] !== revision[0]))) {
      play(root.querySelector(".vector-results"), [
        { transform: "translateY(8px)", opacity: .65 },
        { transform: "translateY(0)", opacity: 1 },
      ], 320);
      play(root.querySelector(".catalog-head > span"), [
        { transform: "translateY(-5px)", opacity: .4 },
        { transform: "translateY(0)", opacity: 1 },
      ], 280);
    }
  }, [tab, loading, revision]);

  return <span ref={marker} hidden aria-hidden="true" />;
}
