import type { ComponentProps } from "react";
import { VectorHome } from "@/components/VectorHome";
import { MiniAppAuth } from "@/components/MiniAppAuth";
import { backend } from "@/lib/backend";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await backend<{ user: ComponentProps<typeof VectorHome>["initialUser"] | null }>("/api/me", { user: null });
  if (!data.user) return <MiniAppAuth requireSession />;
  return <VectorHome initialUser={data.user} />;
}
