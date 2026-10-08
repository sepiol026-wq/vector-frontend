import { notFound } from "next/navigation";
import { ErrorPage } from "@/components/ErrorPage";

const validcodes = new Set([
  400, 401, 402, 403, 404, 405, 408, 409, 410, 429,
  500, 501, 502, 503, 504,
]);

type Props = {
  params: Promise<{ code: string }>;
};

export default async function ErrorCodePage({ params }: Props) {
  const { code } = await params;
  const codeNum = Number(code);

  if (!Number.isFinite(codeNum) || !Number.isInteger(codeNum) || !validcodes.has(codeNum)) {
    notFound();
  }

  return <ErrorPage code={codeNum} />;
}
