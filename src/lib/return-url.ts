export function safeReturnUrl(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

export function loginUrl(returnUrl: string): string {
  return `/login?return_url=${encodeURIComponent(safeReturnUrl(returnUrl))}`;
}
