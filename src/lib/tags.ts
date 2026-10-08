export const TAG_MAX_LENGTH = 100;

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ");
}

export function parseTags(tags: string | null | undefined): string[] {
  const seen = new Set<string>();

  return (tags ?? "").split(/\s*,\s*/).reduce<string[]>((result, tag) => {
    const normalized = normalizeTag(tag);
    const key = normalized.toLocaleLowerCase();
    if (normalized && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
    return result;
  }, []);
}

export function tagHref(tag: string): string {
  return `/?tag=${encodeURIComponent(normalizeTag(tag))}`;
}
