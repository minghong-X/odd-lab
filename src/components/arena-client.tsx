"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { appPath } from "@/lib/paths";
import { useI18n } from "@/i18n/provider";
import { isErrorCode, numberFormatter } from "@/i18n";
import { ArtworkMedia, type MediaSource } from "./artwork-media";
import type { Choice } from "@/lib/arena";
type Pair =
  { id: string; token: string } | { left: MediaSource; right: MediaSource };
type Revealed = {
  choice: Choice;
  left: { model: string; title: string };
  right: { model: string; title: string };
};
const buttons: {
  choice: Choice;
  text: "arena.left" | "arena.right" | "arena.draw" | "arena.neither";
  key: string;
}[] = [
  { choice: "left", text: "arena.left", key: "1" },
  { choice: "right", text: "arena.right", key: "2" },
  { choice: "neither", text: "arena.neither", key: "3" },
  { choice: "draw", text: "arena.draw", key: "4" },
];
function previewSide(choice: Choice, index: number): "good" | "bad" {
  if (choice === "draw") return "good";
  if (choice === "neither") return "bad";
  return choice === (index === 0 ? "left" : "right") ? "good" : "bad";
}
export function ArenaClient({
  slug,
  internalArtworks,
}: {
  slug: string;
  internalArtworks?: MediaSource[];
}) {
  const { t, locale } = useI18n();
  const format = numberFormatter(locale);
  const [pair, setPair] = useState<Pair | null>(null),
    [images, setImages] = useState<string[]>([]),
    [mediaTypes, setMediaTypes] = useState<MediaSource["mediaType"][]>([]),
    [result, setResult] = useState<Revealed | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [count, setCount] = useState(0),
    [zoom, setZoom] = useState<number | null>(null),
    [preview, setPreview] = useState<Choice | null>(null);
  const controller = useRef<AbortController | null>(null),
    urls = useRef<string[]>([]),
    dialog = useRef<HTMLDialogElement>(null),
    inFlight = useRef(false);
  const next = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setPair(null);
    setResult(null);
    setError("");
    setImages([]);
    setMediaTypes([]);
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    try {
      let data: Pair;
      if (internalArtworks) {
        const leftIndex = Math.floor(Math.random() * internalArtworks.length);
        const others = internalArtworks.filter((_, i) => i !== leftIndex);
        data = {
          left: internalArtworks[leftIndex],
          right: others[Math.floor(Math.random() * others.length)],
        };
      } else {
        const response = await fetch(appPath("/api/arena"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pair", experiment: slug }),
          signal: abort.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.code);
        data = result;
      }
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "0"
        : "1";
      if ("token" in data) {
        const blobs = await Promise.all(
          ["A", "B"].map(async (side) => {
            const r = await fetch(
              appPath(
                `/api/media?battle=${data.id}&side=${side}&motion=${motion}`,
              ),
              {
                headers: { Authorization: `Bearer ${data.token}` },
                signal: abort.signal,
              },
            );
            if (!r.ok) throw new Error("mediaLoad");
            return r.blob();
          }),
        );
        if (abort.signal.aborted) return;
        urls.current = blobs.map(URL.createObjectURL);
        setImages(urls.current);
        setMediaTypes(
          blobs.map((blob) =>
            blob.type.startsWith("text/html") ? "html" : "image",
          ),
        );
      } else {
        setImages([data.left.src, data.right.src]);
      }
      setPair(data);
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error && isErrorCode(e.message) ? e.message : "load",
        );
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }, [slug, internalArtworks]);
  useEffect(() => {
    next();
    return () => {
      controller.current?.abort();
      urls.current.forEach(URL.revokeObjectURL);
    };
  }, [next]);
  const vote = useCallback(
    async (choice: Choice) => {
      if (!pair || loading || inFlight.current || result) return;
      inFlight.current = true;
      setSending(true);
      setError("");
      try {
        const response = await fetch(appPath("/api/arena"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            "token" in pair
              ? { action: "vote", ...pair, choice }
              : {
                  action: "vote",
                  leftId: pair.left.id,
                  rightId: pair.right.id,
                  choice,
                },
          ),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.code);
        setResult(data);
        setCount((n) => n + 1);
      } catch (e) {
        setError(
          e instanceof Error && isErrorCode(e.message) ? e.message : "submit",
        );
      } finally {
        setSending(false);
        inFlight.current = false;
      }
    },
    [pair, loading, result, slug],
  );
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat || zoom !== null)
        return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      const button = buttons.find((b) => b.key === e.key);
      if (button) {
        e.preventDefault();
        void vote(button.choice);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vote, zoom]);
  useEffect(() => {
    if (zoom !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [zoom]);
  const typeAt = (i: number) =>
    pair && !("token" in pair)
      ? i === 0
        ? pair.left.mediaType
        : pair.right.mediaType
      : mediaTypes[i] || "image";
  return (
    <div className="arena-workspace">
      <div className="arena-status">
        <span>
          <i />
          {result
            ? t("arena.revealed")
            : loading
              ? t("arena.choosing")
              : t("arena.hidden")}
        </span>
        <span>{t("arena.sessionVotes", { count: format.format(count) })}</span>
      </div>
      <p className="generation-rules">{t("arena.generationRules")}</p>
      <div className="comparison">
        {["A", "B"].map((label, i) => {
          const previewState =
            !result && preview && pair ? previewSide(preview, i) : null;
          return (
            <div
              className={`comparison-card ${result?.choice === (i === 0 ? "left" : "right") ? "chosen" : ""} ${previewState ? `preview-${previewState}` : ""}`}
              key={label}
            >
              {previewState && (
                <span
                  className={`preview-flag preview-flag-${previewState}`}
                  aria-hidden="true"
                >
                  {previewState === "good"
                    ? t("arena.previewGood")
                    : t("arena.previewBad")}
                </span>
              )}
              <div className="comparison-top">
                <span className="side-label">{label}</span>
                <span>
                  {result
                    ? i === 0
                      ? result.left.title
                      : result.right.title
                    : t("arena.mystery")}
                </span>
                {images[i] && (
                  <button
                    className="zoom-button"
                    onClick={() => setZoom(i)}
                    aria-label={t("arena.enlarge", { side: label })}
                  >
                    ⤢
                  </button>
                )}
              </div>
              <div className="comparison-image">
                {images[i] && !["video", "mp4"].includes(typeAt(i) || "") && (
                  <button
                    className="media-enlarge-overlay"
                    onClick={() => setZoom(i)}
                    aria-label={t("arena.enlarge", { side: label })}
                  />
                )}

                {loading ? (
                  <div className="image-loading">
                    <span className="loader" />
                    {t("arena.unfolding")}
                  </div>
                ) : images[i] ? (
                  <ArtworkMedia
                    src={images[i]}
                    mediaType={typeAt(i)}
                    interactive={["video", "mp4"].includes(typeAt(i) || "")}
                    alt={t("arena.artAlt", { side: label })}
                    onError={() => setError("imageDisplay")}
                  />
                ) : (
                  <span>{t("arena.imageUnavailable")}</span>
                )}
              </div>
              <div className="comparison-bottom">
                {result ? (
                  <span>
                    {result.choice === "draw"
                      ? t("arena.tieFeedback")
                      : result.choice === "neither"
                        ? t("arena.neitherFeedback")
                        : result.choice === (i === 0 ? "left" : "right")
                          ? t("arena.winnerFeedback")
                          : t("arena.otherFeedback")}
                  </span>
                ) : (
                  <span>{t("arena.beforeReveal")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div aria-live="polite" className="vote-feedback">
        {error ? (
          <p role="alert">
            {t(`errors.${isErrorCode(error) ? error : "load"}`)}
          </p>
        ) : result ? (
          <p>
            {t("arena.recorded")}{" "}
            {result.choice === "neither"
              ? t("arena.rejectedFeedback")
              : t("arena.rankUpdated")}
          </p>
        ) : (
          <p>{t("arena.question")}</p>
        )}
      </div>
      <div className="vote-dock">
        {result ? (
          <>
            <Link className="text-link" href={`/leaderboard/${slug}`}>
              {t("arena.seeRank")} ↗
            </Link>
            <button className="button primary" onClick={next}>
              {t("arena.next")}
              <span>↗</span>
            </button>
          </>
        ) : (
          <>
            <div className="vote-buttons">
              {buttons.map((b) => (
                <button
                  key={b.choice}
                  disabled={loading || sending || !pair}
                  onClick={() => vote(b.choice)}
                  onMouseEnter={() => setPreview(b.choice)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(b.choice)}
                  onBlur={() => setPreview(null)}
                  className={`vote-button vote-${b.choice}`}
                >
                  {t(b.text)}
                  <kbd>{b.key}</kbd>
                </button>
              ))}
            </div>
            <button className="skip-pair" onClick={next} disabled={sending}>
              {loading ? t("common.reload") : t("arena.skip")} ↻
            </button>
          </>
        )}
      </div>
      <p className="arena-footnote">
        {t(internalArtworks ? "arena.internalFootnote" : "arena.footnote")}
      </p>
      <dialog
        ref={dialog}
        className={`image-dialog ${zoom !== null && typeAt(zoom) === "html" ? "html-dialog" : ""}`}
        onCancel={() => setZoom(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoom(null);
        }}
      >
        <button
          className="dialog-close"
          onClick={() => setZoom(null)}
          aria-label={t("common.closeImage")}
        >
          ×
        </button>
        {zoom !== null && images[zoom] && (
          <ArtworkMedia
            src={images[zoom]}
            mediaType={typeAt(zoom)}
            interactive
            alt={t("arena.enlarge", { side: zoom === 0 ? "A" : "B" })}
          />
        )}
      </dialog>
    </div>
  );
}
