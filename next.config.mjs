const origin = process.env.VECTOR_API_ORIGIN;
if (origin) {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("VECTOR_API_ORIGIN must be an HTTP(S) origin without credentials");
}
export default {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return origin ? [
      { source: "/api/:path*", destination: `${origin}/api/:path*` },
      { source: "/banners/:path*", destination: `${origin}/banners/:path*` }
    ] : [];
  }
};
