"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

export type MediaType =
  "svg" | "png" | "gif" | "html" | "mp4" | "image" | "video";
export type MediaSource = { id: string; src: string; mediaType: MediaType };

/** HTML scripts execute only inside an opaque-origin sandbox. */
export function ArtworkMedia({
  src,
  mediaType = "image",
  alt,
  interactive = false,
  onError,
}: {
  src: string;
  mediaType?: MediaType;
  alt: string;
  interactive?: boolean;
  onError?: () => void;
}) {
  const { t } = useI18n();
  const isVideo = mediaType === "video" || mediaType === "mp4";
  const htmlWidth = interactive ? 1600 : 1280;
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [scale, setScale] = useState(1);
  const [frameHeight, setFrameHeight] = useState(900);
  const [motion, setMotion] = useState(false);
  const [html, setHtml] = useState<{
    src: string;
    source?: string;
    failed?: boolean;
  } | null>(null);
  const errorHandler = useRef(onError);
  useEffect(() => {
    errorHandler.current = onError;
  }, [onError]);
  useEffect(() => {
    if (mediaType !== "html") return;
    const controller = new AbortController();
    setHtml(null);
    async function loadHtml() {
      try {
        // OSS can return attachment even for text/html. Read its body before embedding.
        const response = await fetch(src, {
          signal: controller.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        if (!response.ok) throw new Error(`HTML response: ${response.status}`);
        const source = await response.text();
        if (controller.signal.aborted) return;
        const document = new DOMParser().parseFromString(source, "text/html");
        const sourceUrl = response.url || src;
        const base =
          document.querySelector("base[href]") ||
          document.createElement("base");
        base.setAttribute(
          "href",
          new URL(base.getAttribute("href") || sourceUrl, sourceUrl).href,
        );
        document.head.prepend(base);
        setHtml({
          src,
          source: `<!DOCTYPE html>\n${document.documentElement.outerHTML}`,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        // A site without CORS may still support direct iframe embedding.
        if (error instanceof TypeError) setHtml({ src });
        else {
          setHtml({ src, failed: true });
          errorHandler.current?.();
        }
      }
    }
    void loadHtml();
    return () => controller.abort();
  }, [src, mediaType]);
  useEffect(() => {
    if (!isVideo) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [isVideo]);
  useEffect(() => {
    if (!isVideo || interactive || !video.current) return;
    if (motion) {
      video.current.muted = true;
      void video.current.play().catch(() => {});
    } else video.current.pause();
  }, [isVideo, motion, interactive, src]);
  useEffect(() => {
    if (mediaType !== "html" || !frame.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      // Keep a desktop layout while fitting its entire width in the preview.
      const nextScale = interactive
        ? Math.min(1, width / htmlWidth)
        : Math.min(width / htmlWidth, height / 900);
      setScale(nextScale);
      setFrameHeight(interactive ? height / nextScale : 900);
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [mediaType, interactive, htmlWidth]);
  if (mediaType === "html")
    return (
      <div
        className={`artwork-html ${interactive ? "interactive" : ""}`}
        ref={frame}
      >
        {html?.src !== src ? (
          <span role="status">{t("common.loading")}</span>
        ) : html.failed ? (
          <span role="alert">{t("errors.mediaLoad")}</span>
        ) : (
          <iframe
            src={html.source === undefined ? src : undefined}
            srcDoc={html.source}
            title={alt}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            tabIndex={interactive ? 0 : -1}
            loading="lazy"
            onError={onError}
            style={{
              transform: `scale(${scale})`,
              width: htmlWidth,
              height: frameHeight,
              left: `calc(50% - ${(htmlWidth / 2) * scale}px)`,
              top: interactive ? 0 : `calc(50% - ${450 * scale}px)`,
            }}
          />
        )}
      </div>
    );
  if (isVideo)
    return (
      <video
        ref={video}
        className="artwork-video"
        src={src}
        aria-label={alt}
        autoPlay={motion && !interactive}
        muted
        loop
        playsInline
        controls={interactive}
        preload="metadata"
        onError={onError}
      />
    );
  return <img src={src} alt={alt} loading="lazy" onError={onError} />;
}
