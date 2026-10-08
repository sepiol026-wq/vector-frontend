"use client";
import { useRouter } from "next/navigation";
import { createRipple } from "@/lib/ripple";

type Props = {
  lang: "ru" | "en";
  className?: string;
};

export function CatalogBackButton({ lang, className }: Props) {
  const router = useRouter();
  return (
    <button
      className={className}
      onMouseDown={(e) => createRipple(e)}
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      {lang === "en" ? "← Back to catalog" : "← К каталогу"}
    </button>
  );
}
