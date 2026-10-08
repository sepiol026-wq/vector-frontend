export function ModuleSourceSkeleton() {
  return (
    <>
      <section className="hero-card" style={{ maxWidth: 1180, margin: "0 auto 14px" }}>
        <div className="hero-topline">
          <span className="live-dot" />
          <span style={{ width: 160, height: 12, borderRadius: 6, background: "#1a1a1a" }} />
        </div>
        <div className="hero-content">
          <div>
            <div style={{ width: "100%", height: 280, borderRadius: 14, background: "#111", marginBottom: 18 }} />
            <div style={{ width: "60%", height: 64, borderRadius: 12, background: "#1a1a1a", marginBottom: 10 }} />
            <div style={{ width: "80%", height: 18, borderRadius: 6, background: "#151515" }} />
            <div style={{ width: "45%", height: 18, borderRadius: 6, background: "#151515", marginTop: 8 }} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: 14, borderRadius: 12, background: "#111", border: "1px solid #232323" }}>
                <div style={{ width: 60, height: 10, borderRadius: 4, background: "#1a1a1a", marginBottom: 8 }} />
                <div style={{ width: 90, height: 18, borderRadius: 6, background: "#1e1e1e" }} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="info-grid" style={{ maxWidth: 1180, margin: "0 auto 12px" }}>
        {[1, 2].map((i) => (
          <article key={i} className="glass-card">
            <div className="section-heading">
              <div style={{ width: 80, height: 12, borderRadius: 6, background: "#1a1a1a" }} />
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#171717" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ width: 130, height: 60, borderRadius: 14, background: "#111", border: "1px solid #1a1a1a" }} />
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="code-card" style={{ maxWidth: 1180, margin: "0 auto 12px" }}>
        <div className="code-toolbar">
          <div className="code-window-controls"><span className="window-dot red" /><span className="window-dot yellow" /><span className="window-dot green" /></div>
          <div style={{ width: 200, height: 14, borderRadius: 6, background: "#1a1a1a" }} />
          <div />
        </div>
        <div style={{ padding: 18 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 28, height: 14, borderRadius: 4, background: "#151515", flexShrink: 0 }} />
              <div style={{ width: `${40 + Math.random() * 50}%`, height: 14, borderRadius: 4, background: "#121212" }} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
