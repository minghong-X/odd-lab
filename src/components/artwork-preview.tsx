"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/provider";
import { ArtworkMedia, type MediaType } from "./artwork-media";

export function ArtworkPreview({
  src,
  reducedMotionSrc,
  label,
  mediaType = "image",
  className = "artwork-preview",
}: {
  src: string;
  reducedMotionSrc?: string;
  label: string;
  mediaType?: MediaType;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open) element?.showModal();
    return () => element?.close();
  }, [open]);
  function closePreview() {
    dialog.current?.close();
    setOpen(false);
  }
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={t("experiments.enlargeModel", { model: label })}
        onClick={() => setOpen(true)}
      >
        <ArtworkMedia
          src={src}
          reducedMotionSrc={reducedMotionSrc}
          mediaType={mediaType}
          alt={label}
        />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={`image-dialog ${mediaType === "html" ? "html-dialog" : ""}`}
            aria-label={label}
            onCancel={closePreview}
            onClick={(event) => {
              if (event.target === event.currentTarget) closePreview();
            }}
          >
            <button
              className="dialog-close"
              aria-label={t("common.closeImage")}
              onClick={closePreview}
            >
              ×
            </button>
            <ArtworkMedia
              src={src}
              reducedMotionSrc={reducedMotionSrc}
              mediaType={mediaType}
              alt={label}
              interactive
            />
          </dialog>,
          document.body,
        )}
    </>
  );
}
