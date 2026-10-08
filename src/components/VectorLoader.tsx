"use client";

type Props = {
  text?: string;
};

export function VectorLoader({ text }: Props) {
  return (
    <div className="vector-loader">
      <div className="vector-loader-content">
        <h1 className="vector-loader-brand">
          <span className="vl-char" style={{ animationDelay: "0s" }}>V</span>
          <span className="vl-char" style={{ animationDelay: "0.08s" }}>E</span>
          <span className="vl-char" style={{ animationDelay: "0.16s" }}>C</span>
          <span className="vl-char" style={{ animationDelay: "0.24s" }}>T</span>
          <span className="vl-char" style={{ animationDelay: "0.32s" }}>O</span>
          <span className="vl-char" style={{ animationDelay: "0.40s" }}>R</span>
        </h1>
        <div className="vector-loader-bar-track">
          <div className="vector-loader-bar" />
        </div>
        {text ? <p className="vector-loader-text">{text}</p> : null}
      </div>
      <style>{`
        .vector-loader {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
          background: #000; z-index: 99999;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; margin: 0; padding: 40px 20px;
        }
        .vector-loader-content {
          display: flex; flex-direction: column; align-items: center; gap: 24px;
        }
        .vector-loader-brand {
          margin: 0; font-size: clamp(48px, 10vw, 96px);
          font-weight: 900; letter-spacing: .04em; color: #fff;
          display: flex; gap: 2px; user-select: none;
        }
        .vl-char {
          display: inline-block;
          animation: vl-float 2.2s ease-in-out infinite;
        }
        @keyframes vl-float {
          0%, 100% { transform: translateY(0); opacity: .6; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        .vector-loader-bar-track {
          width: min(200px, 40vw); height: 2px; border-radius: 999px;
          background: rgba(255,255,255,.06); overflow: hidden;
        }
        .vector-loader-bar {
          width: 40%; height: 100%; border-radius: 999px;
          background: rgba(255,255,255,.5);
          animation: vl-bar 1.2s ease-in-out infinite;
        }
        @keyframes vl-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .vector-loader-text {
          color: rgba(255,255,255,.3); font-size: 13px; margin: 0;
          letter-spacing: .06em; text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
