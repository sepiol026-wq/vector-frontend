import Link from "next/link";

import { tagHref } from "@/lib/tags";

type TagLinkProps = {
  tag: string;
  index: number;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function TagLink({ tag, index, onClick }: TagLinkProps) {
  return <Link href={tagHref(tag)} className={`tag-pill tag-c${(index % 7) + 1}`} onClick={onClick}>{tag}</Link>;
}
