import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import DevPageClient from "./DevPageClient";
export const dynamic = "force-dynamic";
export default async function Page() {
  const data = await backend<{ github_verified: boolean }>("/api/me");
  if (!data.github_verified) redirect("/");
  return <DevPageClient />;
}
