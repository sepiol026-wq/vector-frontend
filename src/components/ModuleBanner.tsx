"use client";
import { useRef, useState } from "react";

const fallback = "https://raw.githubusercontent.com/sepiol026-wq/GoyModules/refs/heads/main/assets/vec404.png";

type Props = {
  src: string | null | undefined;
  className?: string;
  alt?: string;
};

export function ModuleBanner({ src, className, alt }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const retried = useRef(false);

  const url = src?.trim() || fallback;
  const displayUrl = errored && !retried.current ? (retried.current = true, fallback) : url;

  function handleError() {
    if (!retried.current) { retried.current = true; setErrored(true); return; }
    setErrored(true);
  }

  return (
    <span className={`module-banner-wrap ${className ?? ""}`}>
      <img
        src={displayUrl}
        alt={alt ?? ""}
        loading="lazy"
        className={`module-banner-img${loaded ? " loaded" : ""}`}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
      {!loaded ? <span className="module-banner-shim" /> : null}
      <style>{`
        .module-banner-wrap {
          display: block; position: relative; overflow: hidden;
        }
        .module-banner-img {
          display: block; width: 100%; height: 100%;
          object-fit: cover; opacity: 0; transition: opacity .35s ease;
        }
        .module-banner-img.loaded { opacity: 1; }
        .module-banner-shim {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 200% 100%;
          animation: mb-shim 1.6s ease-in-out infinite;
        }
        @keyframes mb-shim {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* card banner (catalog + collections) */
        .module-banner-card {
          height: 110px; border-radius: 10px; border: 1px solid #1e1e1e; margin-bottom: 10px;
        }
        .module-banner-card .module-banner-img { border-radius: 10px; }
        .module-banner-card .module-banner-shim { border-radius: 10px; }
        /* hero banner (module source page) */
        .module-banner-hero {
          width: min(100%, 740px); height: 220px; border-radius: 14px;
          margin-bottom: 16px; border: 1px solid #2a2a2a;
        }
        .module-banner-hero .module-banner-img { border-radius: 14px; }
        .module-banner-hero .module-banner-shim { border-radius: 14px; }
        @media (max-width: 820px) {
          .module-banner-hero { height: 150px; border-radius: 18px; }
          .module-banner-hero .module-banner-img { border-radius: 18px; }
          .module-banner-hero .module-banner-shim { border-radius: 18px; }
        }
      `}</style>
    </span>
  );
}
