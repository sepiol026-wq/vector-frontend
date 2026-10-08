"use client";

import { createPortal } from "react-dom";
import { createRipple } from "@/lib/ripple";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";

type AuthRequiredModalProps = {
  title: string;
  description: string;
  lang?: "ru" | "en";
  onClose: () => void;
};

export function AuthRequiredModal({
  title,
  description,
  lang = "ru",
  onClose,
}: AuthRequiredModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="login-modal">
        <button
          className="modal-close"
          onMouseDown={(e) => createRipple(e)}
          onClick={onClose}
          aria-label={lang === "en" ? "Close" : "Закрыть"}
          type="button"
        >
          ×
        </button>
        <div className="hero-topline">
          <span className="live-dot" /> {lang === "en" ? "Telegram required" : "Требуется Telegram"}
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <TelegramLoginButton compact lang={lang} />
      </div>
    </div>,
    document.body,
  );
}
