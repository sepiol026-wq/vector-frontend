export function CollectionDetailSkeleton() {
  return (
    <>
      { }
      <header style={{
        position: "sticky", top: 12, zIndex: 10,
        maxWidth: "min(720px, calc(100% - 24px))",
        margin: "0 auto 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(8,8,8,.94)",
        border: "1px solid rgba(255,255,255,.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,.45)", fontSize: 17 }}>←</span>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: "rgba(255,255,255,.85)" }}>VECTOR</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["Каталог", "Статистика", "Коллекции"].map((label, i) => (
            <span key={i} style={{
              padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
              color: i === 2 ? "#fff" : "rgba(255,255,255,.45)",
              background: i === 2 ? "rgba(255,255,255,.08)" : "transparent",
            }}>{label}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 700, color: "#000", background: "#fff" }}>RU</span>
          <span style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", background: "transparent" }}>EN</span>
        </div>
      </header>

      { }
      <section className="hero-card">
        <div className="hero-topline">
          <span className="live-dot" />
          <span>Коллекция</span>
        </div>
        <div className="hero-content">
          <div>
            <div style={{ height: 64, width: "40%", borderRadius: 12, background: "#151515", marginBottom: 12 }} />
            <div style={{ height: 16, width: "60%", borderRadius: 6, background: "#111" }} />
            <div style={{ height: 16, width: "35%", borderRadius: 6, background: "#111", marginTop: 8 }} />
          </div>
          <div className="meta-panel">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <span style={{ width: 60, height: 10, borderRadius: 4, background: "#1a1a1a", display: "block", marginBottom: 8 }} />
                <div style={{ width: 80, height: 18, borderRadius: 6, background: "#1e1e1e" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      { }
      <section className="collection-module-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="module-card" style={{ cursor: "default" }}>
            <div style={{ height: 110, borderRadius: 10, background: "#111", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ height: 18, width: "55%", borderRadius: 6, background: "#151515" }} />
              <div style={{ height: 10, width: 40, borderRadius: 4, background: "#111" }} />
            </div>
            <div style={{ height: 11, width: "40%", borderRadius: 3, background: "#111", marginBottom: 6 }} />
            <div style={{ height: 13, width: "90%", borderRadius: 4, background: "#0f0f0f", marginBottom: 4 }} />
            <div style={{ height: 13, width: "70%", borderRadius: 4, background: "#0f0f0f", marginBottom: 10 }} />
            <div style={{ height: 12, width: "35%", borderRadius: 4, background: "#111" }} />
          </div>
        ))}
      </section>
    </>
  );
}
