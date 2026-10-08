import { cookies } from "next/headers";

export default async function CollectionsLoading() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("vector_lang")?.value;
  const lang = langCookie === "en" ? "en" : "ru";

  return (
    <main style={{
      minHeight: "100vh", padding: "16px clamp(14px,3vw,30px) 40px",
      background: "radial-gradient(circle at 18% -20%, rgba(255,255,255,.1), transparent 45%), #000",
      opacity: 1
    }}>
      { }
      <header style={{
        position: "sticky", top: 12, zIndex: 10,
        maxWidth: "min(720px, calc(100% - 24px))",
        margin: "0 auto 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(8,8,8,.72)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: ".06em", color: "rgba(255,255,255,.85)" }}>VECTOR</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["Catalog", "Stats", "Collections"].map((label, i) => (
            <span key={i} style={{
              padding: "7px 14px", borderRadius: 999,
              fontSize: 13, fontWeight: 500,
              color: i === 2 ? "#fff" : "rgba(255,255,255,.45)",
              background: i === 2 ? "rgba(255,255,255,.08)" : "transparent",
            }}>{lang === "en" ? label : label === "Catalog" ? "Каталог" : label === "Stats" ? "Статистика" : "Коллекции"}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 700, color: "#000", background: "#fff" }}>RU</span>
          <span style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", background: "transparent" }}>EN</span>
        </div>
      </header>

      { }
      <section style={{
        maxWidth: 1240, margin: "0 auto 14px",
        border: "1px solid #1f1f1f", background: "#090909",
        borderRadius: 16, padding: "clamp(18px,4vw,30px)",
      }}>
        <div style={{ color: "#8f8f8f", fontSize: 12, letterSpacing: ".09em", textTransform: "uppercase" }}>
          {lang === "en" ? "Module collections" : "Коллекции модулей"}
        </div>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px,6vw,64px)", letterSpacing: "-.04em" }}>
          {lang === "en" ? "Collections" : "Коллекции"}
        </h1>
      </section>

      { }
      <section style={{
        maxWidth: 1240, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12,
      }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ border: "1px solid #1f1f1f", background: "#090909", borderRadius: 14, padding: 16 }}>
            <div style={{ height: 18, width: "65%", borderRadius: 6, background: "linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)", backgroundSize: "200% 100%", marginBottom: 10 }} />
            <div style={{ height: 12, width: "90%", borderRadius: 6, background: "linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)", backgroundSize: "200% 100%", marginBottom: 8 }} />
            <div style={{ height: 12, width: "55%", borderRadius: 6, background: "linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)", backgroundSize: "200% 100%" }} />
          </div>
        ))}
      </section>
    </main>
  );
}
