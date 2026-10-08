"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleBanner } from "@/components/ModuleBanner";
import { TagLink } from "@/components/TagLink";
import { OfficialBadge, OFFICIAL_BADGE_CSS } from "@/components/OfficialBadge";
import { LikeIcon, DislikeIcon } from "@/components/RatingIcons";
import { parseTags } from "@/lib/tags";
import { createRipple } from "@/lib/ripple";

type DevModule = {
  id: string;
  name: string;
  class_name: string;
  developer: string;
  description: string;
  version: string;
  likes_count: number;
  dislikes_count: number;
  banner: string | null;
  tags: string | null;
};

type DevComment = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_username: string | null;
  author_photo_url: string | null;
  module_name: string;
  module_class_name: string;
};

type Props = {
  owner: string;
  developer: string;
  official: boolean;
  githubVerified: boolean;
  initial: string;
  likes: number;
  dislikes: number;
  modules: DevModule[];
  comments: DevComment[];
  lang: "ru" | "en";
};

const modulesstep = 8;
const modulesstart = 8;
const commentsstep = 10;
const commentsstart = 4;

function formatDate(value: string, lang: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return lang === "en" ? "just now" : "только что";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date) + " UTC";
}

export function DeveloperPageClient(props: Props) {
  const { owner, developer, official, githubVerified, initial, likes, dislikes, modules, comments, lang } = props;
  const [modulesLimit, setModulesLimit] = useState(modulesstart);
  const [commentsLimit, setCommentsLimit] = useState(commentsstart);
  const [avatarError, setAvatarError] = useState(false);

  const t = lang === "en"
    ? {
        developer: "DEVELOPER",
        verified: "Verified",
        officialDeveloper: "Official developer",
        modules: "Modules",
        likes: "Likes",
        dislikes: "Dislikes",
        popularComments: "Popular comments",
        showComments: "Show comments",
        collapse: "Show less",
        showMoreModules: "Show more modules",
        showMoreComments: "Show more comments",
      }
    : {
        developer: "РАЗРАБОТЧИК",
        verified: "Подтверждён",
        officialDeveloper: "Официальный разработчик",
        modules: "Модули",
        likes: "Лайки",
        dislikes: "Дизлайки",
        popularComments: "Популярные комментарии",
        showComments: "Показать комментарии",
        collapse: "Свернуть",
        showMoreModules: "Показать ещё модули",
        showMoreComments: "Показать ещё комментарии",
      };

  const visibleModules = modules.slice(0, modulesLimit);
  const visibleComments = comments.slice(0, commentsLimit);
  const modulesExpanded = modulesLimit >= modules.length;
  const commentsExpanded = commentsLimit >= comments.length;

  const avatarUrl = `https://github.com/${encodeURIComponent(owner)}.png?size=164`;

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#f5f5f5", padding: "clamp(20px,5vw,72px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <section className="dp-hero">
          <div className="dp-hero-top">
            <div className="dp-avatar">
              {avatarError ? (
                <span className="dp-avatar-fallback">{initial}</span>
              ) : (
                <img src={avatarUrl} alt={developer} width={82} height={82} onError={() => setAvatarError(true)} />
              )}
            </div>
            <div className="dp-identity">
              <div className="dp-eyebrow">{t.developer}</div>
              <h1 className="dp-name">
                {developer}{" "}
                {official ? <OfficialBadge size={20} title={t.officialDeveloper} /> : githubVerified ? <span className="dp-verified" title={t.verified}>✓</span> : null}
              </h1>
              <a href={`https://github.com/${encodeURIComponent(owner)}`} target="_blank" rel="noreferrer" className="dp-github">
                github.com/{owner}
              </a>
            </div>
          </div>
          <div className="dp-stats">
            {[[t.modules, modules.length], [t.likes, likes], [t.dislikes, dislikes]].map(([label, value]) => (
              <div key={String(label)} className="dp-stat">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dp-section">
          <h2 className="dp-section-title">{t.modules}</h2>
          <div className="dp-module-grid">
            {visibleModules.map((module) => {
              const tags = parseTags(module.tags);
              return (
                <article key={module.id} className="dp-module-card" onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("a.tag-pill")) createRipple(e); }}>
                  <Link
                    className="dp-module-main"
                    href={`/modules/${encodeURIComponent(owner)}/${encodeURIComponent(module.name)}/source`}
                    prefetch
                  >
                    <ModuleBanner src={module.banner} className="module-banner-card" />
                    <span className="dp-module-head">
                      <strong>{module.name}</strong>
                      <em>v{module.version}</em>
                    </span>
                    <span className="dp-module-class">{module.class_name}</span>
                    <p className="dp-module-desc">{module.description}</p>
                    <span className="dp-module-meta">
                      <b>{module.developer}{official ? <OfficialBadge size={14} title={t.officialDeveloper} /> : null}</b>
                      <span className="dp-module-stats">
                        <span className="dp-vote dp-vote-like"><LikeIcon width={14} height={14} />{module.likes_count}</span>
                        <span className="dp-vote dp-vote-dislike"><DislikeIcon width={14} height={14} />{module.dislikes_count}</span>
                      </span>
                    </span>
                  </Link>
                    {tags.length ? (
                      <span className="dp-module-tags">
                        {tags.map((tag, i) => (
                          <TagLink key={tag} tag={tag} index={i} onClick={(e) => e.stopPropagation()} />
                        ))}
                      </span>
                    ) : null}
                </article>
              );
            })}
          </div>
          {modules.length > modulesstart ? (
            <div className="dp-expand-wrap">
              <button
                type="button"
                className="dp-expand"
                onMouseDown={(e) => createRipple(e)}
                onClick={() => setModulesLimit((v) => (modulesExpanded ? modulesstart : Math.min(v + modulesstep, modules.length)))}
              >
                {modulesExpanded ? t.collapse : `${t.showMoreModules} (${modules.length - modulesLimit})`}
              </button>
            </div>
          ) : null}
        </section>

        {comments.length ? (
          <section className="dp-section">
            <h2 className="dp-section-title">{t.popularComments}</h2>
            <div className="dp-comment-list">
              {visibleComments.map((comment) => (
                <article key={comment.id} className="dp-comment-card">
                  <div className="dp-comment-head">
                    {comment.author_photo_url ? (
                      <span className="dp-comment-avatar" style={{ backgroundImage: `url(${comment.author_photo_url})` }} />
                    ) : (
                      <span className="dp-comment-avatar">{(comment.author_name || "?").slice(0, 2).toUpperCase()}</span>
                    )}
                    <div className="dp-comment-head-text">
                      <strong>{comment.author_name || (lang === "en" ? "User" : "Пользователь")}</strong>
                      <small>
                        {comment.author_username ? `@${comment.author_username} · ` : ""}
                        {formatDate(comment.created_at, lang)}
                      </small>
                    </div>
                  </div>
                  <p className="dp-comment-body">{comment.body}</p>
                  <span className="dp-comment-module">
                    {comment.module_name} · <code>{comment.module_class_name}</code>
                  </span>
                </article>
              ))}
            </div>
            {comments.length > commentsstart ? (
              <div className="dp-expand-wrap">
                <button
                  type="button"
                  className="dp-expand"
                  onMouseDown={(e) => createRipple(e)}
                  onClick={() => setCommentsLimit((v) => (commentsExpanded ? commentsstart : Math.min(v + commentsstep, comments.length)))}
                >
                  {commentsExpanded ? t.collapse : `${t.showMoreComments} (${comments.length - commentsLimit})`}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <style>{`
        .dp-hero {
          padding: clamp(24px,4vw,46px);
          border: 1px solid #292929;
          border-radius: 22px;
          background: linear-gradient(135deg,#111,#080808);
        }
        .dp-hero-top { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
        .dp-avatar {
          width: 82px; height: 82px; border-radius: 50%; overflow: hidden;
          display: grid; place-items: center; background: #fff; color: #000;
          font-size: 28px; font-weight: 800; flex: 0 0 auto;
        }
        .dp-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .dp-avatar-fallback { display: grid; place-items: center; width: 100%; height: 100%; }
        .dp-identity { flex: 1; min-width: 220px; }
        .dp-eyebrow { color: #929292; font-size: 12px; letter-spacing: .12em; }
        .dp-name { margin: 7px 0; font-size: clamp(28px,5vw,48px); }
        .dp-verified { font-size: .55em; color: #4ade80; }
        .dp-github { color: #bdbdbd; }
        .dp-stats { display: flex; gap: 12px; margin-top: 34px; flex-wrap: wrap; }
        .dp-stat { min-width: 130px; padding: 16px 18px; border: 1px solid #303030; border-radius: 13px; }
        .dp-stat span { display: block; color: #999; font-size: 12px; }
        .dp-stat strong { font-size: 24px; }
        .dp-section { margin-top: 32px; }
        .dp-section-title { margin: 0 0 16px; font-size: 22px; }

        .dp-module-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
        }
        .dp-module-card {
          border: 1px solid #1f1f1f; background: #090909; border-radius: 14px; padding: 12px;
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .dp-module-card:hover { border-color: #2a2a2a; }
        .dp-module-main { display: block; color: inherit; text-decoration: none; }
        .dp-module-head { display: flex; justify-content: space-between; gap: 8px; }
        .dp-module-head strong { font-size: 18px; color: #fff; }
        .dp-module-head em, .dp-module-class, .dp-module-desc, .dp-module-meta { color: #949494; }
        .dp-module-head em { font-style: normal; }
        .dp-module-class { font-family: ui-monospace, monospace; font-size: 12px; display: block; margin-top: 2px; }
        .dp-module-desc { font-size: 13px; line-height: 1.45; min-height: 55px; margin: 8px 0; }
        .dp-module-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 6px; }
        .dp-module-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; }
        .dp-module-meta b { color: #d4d4d4; }
        .dp-official-mini { margin-left: 5px; color: #000; background: #fff; border-radius: 999px; padding: 0 4px; font-style: normal; font-size: 10px; }
        .dp-module-stats { display: inline-flex; gap: 8px; }
        .dp-vote { display: inline-flex; align-items: center; gap: 4px; }
        .dp-vote-like { color: #4ade80; }
        .dp-vote-dislike { color: #f87171; }

        .tag-pill { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 1.5; }
        .tag-c1 { background: rgba(96,165,250,.15); color: #60a5fa; }
        .tag-c2 { background: rgba(167,139,250,.15); color: #a78bfa; }
        .tag-c3 { background: rgba(52,211,153,.15); color: #34d399; }
        .tag-c4 { background: rgba(251,146,60,.15); color: #fb923c; }
        .tag-c5 { background: rgba(244,114,182,.15); color: #f472b6; }
        .tag-c6 { background: rgba(250,204,21,.15); color: #facc15; }
        .tag-c7 { background: rgba(148,163,184,.15); color: #94a3b8; }

        .dp-expand-wrap { display: flex; justify-content: center; margin-top: 18px; }
        .dp-expand {
          cursor: pointer; border: 1px solid #2b2b2b; border-radius: 999px;
          color: #d4d4d4; background: #111; padding: 11px 22px;
          transition: .2s ease; font: inherit; font-size: 14px;
        }
        .dp-expand:hover { transform: translateY(-1px); border-color: #3a3a3a; background: #171717; color: #fff; }

        .dp-comment-list { display: grid; gap: 12px; }
        .dp-comment-card { border: 1px solid #242424; border-radius: 16px; padding: 16px; background: #101010; }
        .dp-comment-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .dp-comment-avatar {
          width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
          flex: 0 0 auto; background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
          background-position: center; background-size: cover; font-weight: 900; font-size: 15px;
        }
        .dp-comment-head-text strong { display: block; overflow-wrap: anywhere; }
        .dp-comment-head-text small { color: #94a3b8; }
        .dp-comment-body { white-space: pre-wrap; overflow-wrap: anywhere; color: #e2e8f0; line-height: 1.58; margin: 0 0 12px; }
        .dp-comment-module { color: #8b8b8b; font-size: 12px; }
        .dp-comment-module code { font-family: ui-monospace, monospace; }

        @media (max-width: 1024px) { .dp-module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .dp-module-grid { grid-template-columns: 1fr; }
          .dp-name { font-size: clamp(28px, 9vw, 40px); }
        }
        ${OFFICIAL_BADGE_CSS}
      `}</style>
    </main>
  );
}
