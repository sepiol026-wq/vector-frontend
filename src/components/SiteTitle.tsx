"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const labels = {
  ru: {
    home: "Каталог",
    stats: "Статистика",
    collections: "Коллекции",
    profile: "Профиль",
    login: "Вход",
    banned: "Доступ ограничен",
    module: "Модуль",
    developer: "Разработчик",
    collection: "Коллекция",
    admin: "Админ-панель",
    dev: "Панель разработчика",
  },
  en: {
    home: "Catalog",
    stats: "Stats",
    collections: "Collections",
    profile: "Profile",
    login: "Sign in",
    banned: "Access restricted",
    module: "Module",
    developer: "Developer",
    collection: "Collection",
    admin: "Admin panel",
    dev: "Developer panel",
  },
} as const;

type Lang = keyof typeof labels;
type HomeTab = "search" | "stats" | "collections" | "profile";

const homeLabels = {
  ru: { search: "Каталог", stats: "Статистика", collections: "Коллекции", profile: "Профиль" },
  en: { search: "Catalog", stats: "Stats", collections: "Collections", profile: "Profile" },
} as const;

function language(): Lang {
  return document.cookie.split("; ").find((item) => item.startsWith("vector_lang="))?.split("=")[1] === "en" ? "en" : "ru";
}

function pageLabel(path: string, tab: HomeTab | null): string {
  const lang = language();
  const copy = labels[lang];
  if (path === "/") return homeLabels[lang][tab ?? "search"];
  if (path === "/login") return copy.login;
  if (path === "/banned") return copy.banned;
  if (path.startsWith("/modules/")) return copy.module;
  if (path.startsWith("/developers/")) return copy.developer;
  if (path.startsWith("/collections/")) return copy.collection;
  if (path.startsWith("/admin")) return copy.admin;
  if (path.startsWith("/dev")) return copy.dev;
  return copy.home;
}

export function SiteTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") as HomeTab | null;

  useEffect(() => {
    const update = () => { document.title = `Vector • ${pageLabel(pathname, tab)}`; };
    update();
    window.addEventListener("vector-lang-change", update);
    window.addEventListener("vector-title-change", update);
    return () => {
      window.removeEventListener("vector-lang-change", update);
      window.removeEventListener("vector-title-change", update);
    };
  }, [pathname, tab]);
  return null;
}
