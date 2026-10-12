"use client";

import { ModalPresence } from "@/components/ModalPresence";
import { createRipple } from "@/lib/ripple";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";

type AuthRequiredModalProps = {
  open?: boolean;
  title: string;
  description: string;
  lang?: "ru" | "en";
  onClose: () => void;
};

export function AuthRequiredModal({
  open = true,
  title,
  description,
  lang = "ru",
  onClose,
}: AuthRequiredModalProps) {
  return (
    <ModalPresence open={open} onClose={onClose} label={title}>
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
    </ModalPresence>
  );
}
