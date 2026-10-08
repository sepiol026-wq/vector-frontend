import type { Metadata } from "next";
export async function generateMetadata({ params }: { params: Promise<{ module_name: string }> }): Promise<Metadata> {
  const { module_name: name } = await params;
  return { title: `${name} • Vector` };
}
