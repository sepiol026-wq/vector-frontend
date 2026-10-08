import type { ComponentProps } from "react";
import { VectorHome } from "@/components/VectorHome";
import { backend } from "@/lib/backend";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await backend<{ user: ComponentProps<typeof VectorHome>["initialUser"] }>("/api/me");
  return <VectorHome initialUser={data.user} />;
}
