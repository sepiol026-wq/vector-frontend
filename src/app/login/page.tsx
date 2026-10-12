import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";
import { resolveLang } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await resolveLang((await searchParams).lang);
  return (
    <Suspense>
      <LoginPageContent initialLang={lang} />
    </Suspense>
  );
}
