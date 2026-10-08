import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export async function backend<T>(path: string): Promise<T> {
  if (!path.startsWith("/api/") || path.includes("\\")) throw new Error("Invalid API path");
  const origin = process.env.VECTOR_API_ORIGIN;
  if (!origin) throw new Error("Set VECTOR_API_ORIGIN to the backend origin");
  const jar = await cookies();
  const response = await fetch(new URL(path, origin), { headers: { cookie: jar.toString() }, cache: "no-store", redirect: "manual" });
  if (response.status === 401) redirect("/login");
  if (response.status === 404) notFound();
  if (response.status === 418) redirect("/banned");
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
