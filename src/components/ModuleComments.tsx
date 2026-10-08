"use client";

import { useEffect, useMemo, useState } from "react";
import { sanitizeHtml } from "@/lib/safe-html";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { OfficialBadge } from "@/components/OfficialBadge";
import { SkeletonBar, SkeletonCircle } from "@/components/Skeleton";
import { createRipple } from "@/lib/ripple";
import { toast } from "sonner";

type Comment = {
  id: string;
  body: string;
  author_name: string;
  author_username: string | null;
  author_photo_url: string | null;
  is_official_developer: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
  replies: Comment[];
};

type CommentsResponse = {
  ok: boolean;
  comments: Comment[];
};

type CreateResponse = {
  ok: boolean;
  comment: Comment;
};

function formatCommentDate(value: string, lang: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return lang === "en" ? "just now" : "только что";
  }

  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false
  }).format(date) + " UTC";
}

function insertReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, reply] }
      : { ...comment, replies: insertReply(comment.replies, parentId, reply) }
  );
}

function replaceComment(comments: Comment[], updated: Comment): Comment[] {
  return comments.map((comment) =>
    comment.id === updated.id
      ? { ...updated, replies: comment.replies }
      : { ...comment, replies: replaceComment(comment.replies, updated) }
  );
}

function removeComment(comments: Comment[], id: string): Comment[] {
  return comments
    .filter((comment) => comment.id !== id)
    .map((comment) => ({ ...comment, replies: removeComment(comment.replies, id) }));
}

function shouldShowTranslate(text: string, lang: "ru" | "en"): boolean {
  const chars = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!chars) return false;
  const cyrillic = (chars.match(/[\u0400-\u04FF]/g) || []).length;
  const cjk = (chars.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g) || []).length;
  const latin = (chars.match(/[a-zA-Z]/g) || []).length;
  const other = chars.length - cyrillic - cjk - latin;
  if (cjk > 0 || other > 0) return true;
  if (lang === "ru") return latin / chars.length > 0.5;
  return cyrillic / chars.length > 0.3;
}

function CommentCard({
  comment,
  owner,
  moduleName,
  canPost,
  lang,
  onReply,
  onUpdate,
  onDelete,
  onLoginRequired,
  rootCommentId,
  depth = 0
}: {
  comment: Comment;
  owner: string;
  moduleName: string;
  canPost: boolean;
  lang: "ru" | "en";
  depth?: number;
  rootCommentId?: string;
  onReply: (parentId: string, reply: Comment) => void;
  onUpdate: (comment: Comment) => void;
  onDelete: (id: string) => void;
  onLoginRequired: () => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editDraft, setEditDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const visibleLang = shouldShowTranslate(comment.body, lang);
  async function toggleTranslate() {
    if (!canPost) {
      onLoginRequired();
      return;
    }
    if (translation) {
      setShowTranslation((v) => !v);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments/translate`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ comment_id: comment.id, lang }) }
      );
      if (response.ok) {
        const data = await response.json();
        setTranslation(data.translation);
        setShowTranslation(true);
      } else {
        toast.error(lang === "en" ? "Translation failed" : "Не удалось перевести");
      }
    } catch {
      toast.error(lang === "en" ? "Translation failed" : "Не удалось перевести");
    }
    setBusy(false);
  }

  async function submitReply() {
    const body = draft.trim();
    if (!body) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, parent_id: rootCommentId ?? comment.id })
      });
      if (!response.ok) {
        throw new Error("reply_failed");
      }
      const data = (await response.json()) as CreateResponse;
      onReply(rootCommentId ?? comment.id, data.comment);
      setDraft("");
      setReplyOpen(false);
      toast.success(lang === "en" ? "Reply sent" : "Ответ отправлен");
    } catch {
      toast.error(lang === "en" ? "Failed to send reply" : "Не удалось отправить ответ.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    const body = editDraft.trim();
    if (!body || body === comment.body) {
      setEditOpen(false);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments/${encodeURIComponent(comment.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (!response.ok) {
        throw new Error("edit_failed");
      }
      const data = (await response.json()) as CreateResponse;
      onUpdate(data.comment);
      setEditOpen(false);
      toast.success(lang === "en" ? "Comment updated" : "Комментарий обновлён");
    } catch {
      toast.error(lang === "en" ? "Failed to update comment" : "Не удалось обновить комментарий.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment() {
    setBusy(true);
    try {
      const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments/${encodeURIComponent(comment.id)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("delete_failed");
      }
      onDelete(comment.id);
      toast.success(lang === "en" ? "Comment deleted" : "Комментарий удалён");
    } catch {
      toast.error(lang === "en" ? "Failed to delete comment" : "Не удалось удалить комментарий.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="comment-card">
      <div className="comment-head">
        {comment.author_photo_url ? (
          <span className="comment-avatar" style={{ backgroundImage: `url(${comment.author_photo_url})` }} />
        ) : (
          <span className="comment-avatar">{comment.author_name.slice(0, 2).toUpperCase()}</span>
        )}
        <div>
          <strong>{comment.author_name}{comment.is_official_developer ? <OfficialBadge size={14} title={lang === "en" ? "Official developer" : "Официальный разработчик"} /> : null}</strong>
          <small>
            {comment.author_username ? `@${comment.author_username} · ` : ""}
            {formatCommentDate(comment.created_at, lang)}
          </small>
        </div>
      </div>

      {editOpen ? (
        <div className="comment-form compact">
          <textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={1800} />
          <div className="comment-actions">
            <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={submitEdit}>{lang === "en" ? "Save" : "Сохранить"}</button>
            <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={() => setEditOpen(false)}>{lang === "en" ? "Cancel" : "Отмена"}</button>
          </div>
        </div>
      ) : (
        <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(showTranslation && translation ? translation : comment.body) }} />
      )}

      {showTranslation && translation ? (
        <p className="muted" style={{ fontSize: "0.8em", marginTop: "-0.5em" }}>
          {lang === "en" ? "Translated automatically" : "Переведено автоматически"}
        </p>
      ) : null}

      <div className="comment-actions">
        {visibleLang ? (
          <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={toggleTranslate}>
            {showTranslation && translation
              ? (lang === "en" ? "Original" : "Оригинал")
              : (lang === "en" ? "Translate" : "Перевести")}
          </button>
        ) : null}
        <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={() => (canPost ? setReplyOpen((value) => !value) : onLoginRequired())}>
          {lang === "en" ? "Reply" : "Ответить"}
        </button>
        {comment.can_edit ? <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={() => setEditOpen(true)}>{lang === "en" ? "Edit" : "Править"}</button> : null}
        {comment.can_edit ? <button disabled={busy} onMouseDown={(e) => createRipple(e)} onClick={deleteComment}>{lang === "en" ? "Delete" : "Удалить"}</button> : null}
      </div>

      {replyOpen ? (
        <div className="comment-form compact">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Быстрый ответ автору…"
            maxLength={1800}
          />
          <div className="comment-actions">
            <button disabled={busy || draft.trim().length < 2} onMouseDown={(e) => createRipple(e)} onClick={submitReply}>{lang === "en" ? "Send reply" : "Отправить ответ"}</button>
            <small>{draft.trim().length}/1800</small>
          </div>
        </div>
      ) : null}

      {comment.replies.length ? (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentCard owner={owner}
              canPost={canPost}
              comment={reply}
              key={reply.id}
              depth={depth + 1}
              rootCommentId={rootCommentId ?? comment.id}
              moduleName={moduleName}
              lang={lang}
              onDelete={onDelete}
              onReply={onReply}
              onUpdate={onUpdate}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ModuleComments({ owner, moduleName, canPost, lang = "ru" }: { owner: string; moduleName: string; canPost: boolean; lang?: "ru" | "en" }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const commentCount = useMemo(
    () => comments.reduce((total, comment) => total + 1 + comment.replies.length, 0),
    [comments]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadComments() {
      setLoading(true);
      try {
        const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments`, {
          cache: "no-cache",
          signal: controller.signal
        });
        if (response.ok) {
          const data = (await response.json()) as CommentsResponse;
          setComments(data.comments);
        }
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(lang === "en" ? "Failed to load comments." : "Комментарии не загрузились.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadComments();
    return () => controller.abort();
  }, [moduleName]);

  async function submitComment() {
    const draft = body.trim();
    if (!draft) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/modules/${encodeURIComponent(owner)}/${encodeURIComponent(moduleName)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: draft })
      });
      if (!response.ok) {
        throw new Error("comment_failed");
      }
      const data = (await response.json()) as CreateResponse;
      setComments((current) => [data.comment, ...current]);
      setBody("");
      toast.success(lang === "en" ? "Comment posted" : "Комментарий опубликован");
    } catch {
      toast.error(lang === "en" ? "Failed to post comment" : "Не удалось отправить комментарий.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comments-card">
      <div className="comments-title">
        <div>
          <span>{lang === "en" ? "Comments" : "Комментарии"}</span>
          <h2>{lang === "en" ? "Live module discussion" : "Живое обсуждение модуля"}</h2>
        </div>
        <b>{commentCount}</b>
      </div>

      {canPost ? (
        <div className="comment-form">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Оставь отзыв, идею, баг-репорт или спасибо автору…"
            maxLength={1800}
          />
          <div className="comment-actions wide">
            <button disabled={submitting || body.trim().length < 2} onMouseDown={(e) => createRipple(e)} onClick={submitComment}>{lang === "en" ? "Post" : "Опубликовать"}</button>
            <small>{body.trim().length}/1800</small>
          </div>
        </div>
      ) : (
        <div className="comment-login">
          <p>{lang === "en" ? "Reviews and replies are available after signing in via Telegram." : "Отзывы и ответы доступны после входа через Telegram."}</p>
          <button className="comment-login-button" onMouseDown={(e) => createRipple(e)} onClick={() => setShowLogin(true)} type="button">
            Написать комментарий
          </button>
        </div>
      )}

      {error ? <em className="comment-error">{error}</em> : null}
      {!loading && !comments.length ? <p className="muted">{lang === "en" ? "Quiet here. Be the first to bring this module to life." : "Пока тихо. Будь первым, кто оживит этот модуль."}</p> : null}

      <div className="comment-list">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <article key={i} className="comment-card">
                <div className="comment-head">
                  <SkeletonCircle size={44} />
                  <div style={{ display: "grid", gap: 6 }}>
                    <SkeletonBar width={140} height={13} />
                    <SkeletonBar width={90} height={10} />
                  </div>
                </div>
                <SkeletonBar width="100%" height={12} />
                <SkeletonBar width="86%" height={12} style={{ marginTop: 8 }} />
                <SkeletonBar width="58%" height={12} style={{ marginTop: 8 }} />
              </article>
            ))
          : comments.map((comment) => (
          <CommentCard owner={owner}
            canPost={canPost}
            comment={comment}
            key={comment.id}
            moduleName={moduleName}
            lang={lang}
            onDelete={(id) => setComments((current) => removeComment(current, id))}
            onReply={(parentId, reply) => setComments((current) => insertReply(current, parentId, reply))}
            onUpdate={(updated) => setComments((current) => replaceComment(current, updated))}
            onLoginRequired={() => setShowLogin(true)}
          />
        ))}
      </div>
      {showLogin ? (
        <AuthRequiredModal
          title={lang === "en" ? "Sign in with Telegram" : "Войдите через Telegram"}
          description={lang === "en" ? "After sign in you can post comments and replies." : "После входа можно писать комментарии и отвечать другим."}
          onClose={() => setShowLogin(false)}
          lang={lang}
        />
      ) : null}
    </section>
  );
}
