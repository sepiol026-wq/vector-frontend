"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useSurfacePresence } from "@/components/ModalPresence";
import { createRipple } from "@/lib/ripple";

export function PrivacySelect({ value, onChange, lang }: {
  value: "public" | "unlisted" | "private";
  onChange: (value: "public" | "unlisted" | "private") => void;
  lang: "ru" | "en";
}) {
  return <VectorSelect value={value} onChange={onChange} label={lang === "en" ? "Privacy" : "Приватность"} options={[
    { value: "public", title: lang === "en" ? "Public" : "Публичная", detail: lang === "en" ? "Visible to all" : "Видна всем" },
    { value: "unlisted", title: lang === "en" ? "Unlisted" : "По ссылке", detail: lang === "en" ? "Only by direct link" : "Только по прямой ссылке" },
    { value: "private", title: lang === "en" ? "Private" : "Приватная", detail: lang === "en" ? "Only you" : "Только вы" },
  ]} />;
}

export function VectorSelect<T extends string>({ value, onChange, label, options, showDetail = false }: {
  value: T; onChange: (value: T) => void; label: string; showDetail?: boolean;
  options: readonly { value: T; title: string; detail: string }[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const mounted = useSurfacePresence(open, menu);
  const id = useId();
  const close = () => { trigger.current?.focus({ preventScroll: true }); setOpen(false); };
  useLayoutEffect(() => {
    if (open && mounted) menu.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
  }, [open, mounted]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return <div className="vector-select" ref={root} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={trigger} type="button" className="vector-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={mounted ? id : undefined}
      onMouseDown={createRipple} onClick={() => setOpen(value => !value)}
      onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }}>
      <span>{options.find(option => option.value === value)?.title}{showDetail ? <small>{options.find(option => option.value === value)?.detail}</small> : null}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined }}><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {mounted ? <ul ref={menu} id={id} className="vector-menu" role="listbox" aria-label={label} data-state={open ? "open" : "closing"} inert={!open} aria-hidden={!open || undefined}
      onKeyDown={event => {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
        }
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); (event.target as HTMLElement).click(); }
      }}>
      {options.map(option => <li key={option.value} role="option" tabIndex={value === option.value ? 0 : -1} aria-selected={value === option.value}
        onClick={() => { onChange(option.value); close(); }}>
        <strong>{option.title}</strong><small>{option.detail}</small>
      </li>)}
    </ul> : null}
  </div>;
}
