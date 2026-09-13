"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const choices = ["pelican", "crocodile", "starship"] as const;

export function ArenaSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = choices.find((slug) => pathname === `/arena/${slug}`) ?? "";

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node))
        setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(slug: string) {
    setOpen(false);
    router.push(`/arena/${slug}`);
  }

  return (
    <div className="arena-picker" ref={root}>
      <button
        type="button"
        className="nav-arena"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("common.arenaSelect")}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{t("common.startArena")}</span>
        <svg
          className="nav-arena-caret"
          viewBox="0 0 12 8"
          width="12"
          height="8"
          aria-hidden
        >
          <path
            d="M1 1.5 6 6.5 11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul className="arena-menu" role="menu">
          {choices.map((slug) => (
            <li key={slug} role="none">
              <button
                type="button"
                role="menuitem"
                className={`arena-menu-item ${current === slug ? "current" : ""}`}
                onClick={() => choose(slug)}
              >
                <span className="arena-menu-dot" aria-hidden />
                <span className="arena-menu-label">
                  {t(`experiments.${slug}Title`)}
                </span>
                {current === slug && (
                  <span className="arena-menu-check" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
