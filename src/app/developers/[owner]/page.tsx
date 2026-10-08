import type { ComponentProps } from "react";
import { notFound } from "next/navigation";
import { backend } from "@/lib/backend";
import { resolveLang } from "@/lib/lang";
import { safeDecodeRouteParam } from "@/lib/route-params";
import { NavBar } from "@/components/NavBar";
import { DeveloperPageClient } from "./DeveloperPageClient";

export const dynamic = "force-dynamic";
type Profile = ComponentProps<typeof DeveloperPageClient>;
type Result = Omit<Profile, "modules"> & {
  github_verified: boolean;
  modules: Array<Omit<Profile["modules"][number], "tags"> & { tags: string[] }>;
};

export default async function Page({ params }: { params: Promise<{ owner: string }> }) {
  const owner = safeDecodeRouteParam((await params).owner);
  if (!owner) notFound();
  const [data, me, lang] = await Promise.all([
    backend<Result>(`/api/developers/${encodeURIComponent(owner)}`),
    backend<{ user: ComponentProps<typeof NavBar>["user"] }>("/api/me"),
    resolveLang()
  ]);
  return <><NavBar backHref="/" user={me.user} lang={lang} tabs={[
    { label: lang === "en" ? "Catalog" : "Каталог", href: "/" },
    { label: lang === "en" ? "Stats" : "Статистика", href: "/?tab=stats" },
    { label: lang === "en" ? "Collections" : "Коллекции", href: "/?tab=collections" }
  ]} /><DeveloperPageClient owner={owner} developer={data.developer} official={data.official}
    githubVerified={data.github_verified} initial={data.developer.trim().slice(0, 2).toUpperCase()}
    likes={data.likes} dislikes={data.dislikes} comments={data.comments} lang={lang}
    modules={data.modules.map(module => ({ ...module, tags: module.tags.join(", ") }))} /></>;
}
