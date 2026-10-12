"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import "./modal-presence.css";

let locks = 0;
let previousOverflow = "";
let previousPadding = "";
const stack: HTMLDialogElement[] = [];

export function useSurfacePresence(open: boolean, ref: RefObject<HTMLElement | null>, modal = false) {
  const [present, setPresent] = useState(false);
  const [ready, setReady] = useState(false);
  const mounted = ready && (open || present);
  useEffect(() => setReady(true), []);
  useLayoutEffect(() => {
    if (!mounted) return;
    if (open) setPresent(true);
    const surface = ref.current!;
    const panel = modal ? surface.firstElementChild as HTMLElement | null : surface;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];
    const duration = reduced.matches ? 0 : open ? 280 : 180;
    for (const element of modal ? [surface, panel] : [panel]) {
      if (!element) continue;
      const computed = getComputedStyle(element);
      const from = { opacity: computed.opacity, ...(element === panel ? { transform: computed.transform } : {}) };
      element.getAnimations().forEach(animation => animation.cancel());
      const to = { opacity: open ? 1 : 0, ...(element === panel ? { transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(.98)" } : {}) };
      const animation = element.animate([from, to], { duration, easing: open ? "cubic-bezier(.22,1,.36,1)" : "ease-in", fill: "forwards" });
      animations.push(animation);
    }
    let active = true;
    const finish = () => { if (active && !open) setPresent(false); };
    void Promise.all(animations.map(animation => animation.finished)).then(finish).catch(() => {});
    const timeout = window.setTimeout(finish, duration + 60);
    const reduce = () => { if (reduced.matches) animations.forEach(animation => animation.finish()); };
    reduced.addEventListener("change", reduce);
    return () => { active = false; clearTimeout(timeout); reduced.removeEventListener("change", reduce); };
  }, [open, mounted, modal, ref]);
  return mounted;
}

export function ModalPresence({ open, onClose, busy = false, label, labelledBy, describedBy, children }: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const mounted = useSurfacePresence(open, dialogRef, true);

  useLayoutEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      previousPadding = document.body.style.paddingRight;
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      if (gutter > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
      document.body.style.overflow = "hidden";
    }
    stack.push(dialog);
    dialog.showModal();
    const restoreFocus = () => {
      if (stack.at(-1) !== dialog || dialog.contains(document.activeElement)) return;
      const target = Array.from(dialog.querySelectorAll<HTMLElement>('input:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex="0"]')).find(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      (target ?? dialog).focus({ preventScroll: true });
    };
    const observer = new MutationObserver(restoreFocus);
    observer.observe(dialog, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "inert"] });
    document.addEventListener("focusin", restoreFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", restoreFocus);
      const wasTop = stack.at(-1) === dialog;
      stack.splice(stack.indexOf(dialog), 1);
      dialog.close();
      if (--locks === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPadding;
      }
      const top = stack.at(-1);
      if (wasTop && previousFocus?.isConnected && (!top || top.contains(previousFocus))) previousFocus.focus({ preventScroll: true });
      else if (wasTop && top) top.focus({ preventScroll: true });
    };
  }, [mounted]);

  function dismiss() {
    if (open && !busy && !dialogRef.current?.querySelector('[aria-busy="true"]')) onClose();
  }

  if (!mounted) return null;
  return createPortal(
    <dialog ref={dialogRef} className="modal-backdrop vector-modal-presence" aria-modal="true" aria-label={label} aria-labelledby={labelledBy} aria-describedby={describedBy} aria-busy={busy || undefined} data-state={open ? "open" : "closing"}
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget && backdropPress.current) dismiss(); backdropPress.current = false; }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'));
        const first = items[0], last = items.at(-1);
        if (!first) { event.preventDefault(); event.currentTarget.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
      }}>
      {children}
    </dialog>, document.body,
  );
}
