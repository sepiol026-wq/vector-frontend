import { cookies } from "next/headers";

export type Lang = "ru" | "en";

export async function resolveLang(searchLang?: string): Promise<Lang> {
  if (searchLang === "en" || searchLang === "ru") {
    return searchLang;
  }

  const cookieStore = await cookies();
  return cookieStore.get("vector_lang")?.value === "en" ? "en" : "ru";
}
