"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import "./vector-motion.css";

export function RouteMotion() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = new URLSearchParams(searchParams.toString());
  query.delete("lang");
  const revision = query.toString();

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const cancel = () => {
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    const enter = () => {
      document.querySelectorAll("main:not(.vector-home)").forEach(main => {
        for (const element of main.children) {
          if (seen.has(element) || element.matches("style,script,link,template,nav,header,dialog,[hidden],[role='dialog'],.glass-bar,.parallax-bg")) continue;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") continue;
          const bounds = element.getBoundingClientRect();
          if (!bounds.width || !bounds.height) continue;
          seen.add(element);
          if (document.hidden || reduced.matches || bounds.bottom < 0 || bounds.top > innerHeight || typeof element.animate !== "function") continue;
          const animation = element.animate([
            { opacity: .6, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
          animations.add(animation);
          void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
        }
      });
    };
    const preference = () => { if (reduced.matches || document.hidden) cancel(); };
    const observer = new MutationObserver(enter);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style"] });
    enter();
    reduced.addEventListener("change", preference);
    document.addEventListener("visibilitychange", preference);
    return () => {
      observer.disconnect();
      cancel();
      reduced.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", preference);
    };
  }, [pathname, revision]);

  return null;
}
