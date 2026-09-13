"use client";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const choices = ["pelican", "crocodile", "starship"] as const;
export function ArenaSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const current = choices.find((slug) => pathname === `/arena/${slug}`) ?? "";
  return (
    <label className="arena-picker">
      <select
        className="nav-arena"
        aria-label={t("common.arenaSelect")}
        value={current}
        onChange={(event) => {
          const slug = event.target.value;
          if (choices.some((choice) => choice === slug))
            router.push(`/arena/${slug}`);
        }}
      >
        <option value="" disabled>
          {t("common.startArena")}
        </option>
        {choices.map((slug) => (
          <option key={slug} value={slug}>
            {t(`experiments.${slug}Title`)}
          </option>
        ))}
      </select>
      <span aria-hidden>⌄</span>
    </label>
  );
}
