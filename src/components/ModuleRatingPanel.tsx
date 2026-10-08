"use client";

import { useState } from "react";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { DislikeIcon, LikeIcon } from "@/components/RatingIcons";
import { createRipple } from "@/lib/ripple";

type RatingAction = "like" | "dislike";

type RatingState = {
  likes: number;
  dislikes: number;
  userAction: RatingAction | null;
};

export function ModuleRatingPanel({
  owner,
  moduleName,
  initial,
  lang = "ru",
}: {
  owner: string;
  moduleName: string;
  initial: RatingState;
  lang?: "ru" | "en";
}) {
  const [state, setState] = useState(initial);
  const [showLogin, setShowLogin] = useState(false);
  const [busy, setBusy] = useState<RatingAction | null>(null);
  const [animating, setAnimating] = useState<RatingAction | null>(null);
  const [countBump, setCountBump] = useState<RatingAction | null>(null);
  const [countDecay, setCountDecay] = useState<RatingAction | null>(null);

  async function vote(action: RatingAction) {
    const oldAction = state.userAction;
    setBusy(action);
    setAnimating(action);
    const response = await fetch(
      `/api/web/rate/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/${action}`,
      { method: "POST", cache: "no-store" },
    );
    setBusy(null);

    if (response.status === 401) {
      setShowLogin(true);
      setAnimating(null);
      return;
    }

    if (!response.ok) {
      setAnimating(null);
      return;
    }

    const data = (await response.json()) as { summary: RatingState };
    const newAction = data.summary.userAction;

    if (oldAction && oldAction !== newAction) {
      setCountDecay(oldAction);
      setTimeout(() => {
        setState(data.summary);
        setCountBump(newAction!);
        setCountDecay(null);
        setTimeout(() => { setAnimating(null); setCountBump(null); }, 400);
      }, 350);
      setTimeout(() => setAnimating(null), 500);
    } else {
      setState(data.summary);
      if (newAction === action) setCountBump(action);
      setTimeout(() => { setAnimating(null); setCountBump(null); }, 500);
    }
  }

  return (
    <>
      <div className="rating-panel">
        <button
          className={(state.userAction === "like" ? "selected" : "") + (animating === "like" ? " vote-pop-like" : "")}
          disabled={busy !== null}
          onMouseDown={(e) => createRipple(e)}
          onClick={() => vote("like")}
        >
          <span className={animating === "like" ? "vote-pop" : ""}>
            <LikeIcon />
          </span>
          <b className={(countBump === "like" ? "count-bump " : "") + (countDecay === "like" ? "decay-snap" : "")}>{state.likes}</b>
          <em>{lang === "en" ? "like" : "лайк"}</em>
        </button>
        <button
          className={(state.userAction === "dislike" ? "selected" : "") + (animating === "dislike" ? " vote-pop-dislike" : "")}
          disabled={busy !== null}
          onMouseDown={(e) => createRipple(e)}
          onClick={() => vote("dislike")}
        >
          <span className={animating === "dislike" ? "vote-pop" : ""}>
            <DislikeIcon />
          </span>
          <b className={(countBump === "dislike" ? "count-bump " : "") + (countDecay === "dislike" ? "decay-snap" : "")}>{state.dislikes}</b>
          <em>{lang === "en" ? "dislike" : "диз"}</em>
        </button>
      </div>
      {showLogin ? (
        <AuthRequiredModal
          title={lang === "en" ? "Sign in with Telegram" : "Войдите через Telegram"}
          description={lang === "en" ? "After sign in you can leave likes and dislikes." : "После входа можно ставить лайки и дизлайки."}
          onClose={() => setShowLogin(false)}
          lang={lang}
        />
      ) : null}
    </>
  );
}
