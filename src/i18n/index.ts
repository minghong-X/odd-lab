import enCommon from "./locales/en/common.json";
import enStory from "./locales/en/story.json";
import enExperiments from "./locales/en/experiments.json";
import enArena from "./locales/en/arena.json";
import enRank from "./locales/en/rank.json";
import enErrors from "./locales/en/errors.json";
import zhCommon from "./locales/zh/common.json";
import zhStory from "./locales/zh/story.json";
import zhExperiments from "./locales/zh/experiments.json";
import zhArena from "./locales/zh/arena.json";
import zhRank from "./locales/zh/rank.json";
import zhErrors from "./locales/zh/errors.json";
export const resources = {
  en: {
    common: enCommon,
    story: enStory,
    experiments: enExperiments,
    arena: enArena,
    rank: enRank,
    errors: enErrors,
  },
  zh: {
    common: zhCommon,
    story: zhStory,
    experiments: zhExperiments,
    arena: zhArena,
    rank: zhRank,
    errors: zhErrors,
  },
};
export type Locale = keyof typeof resources;
type Namespaces = typeof resources.en;
export type TranslationKey = {
  [N in keyof Namespaces]: `${N}.${keyof Namespaces[N] & string}`;
}[keyof Namespaces];
export type ErrorCode = keyof typeof enErrors;
export type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;
export const LANG_STORAGE_KEY = "odd-lab-lang";
export const DEFAULT_LOCALE: Locale = "en";
export const isLocale = (value: unknown): value is Locale =>
  value === "en" || value === "zh";
export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === "string" && Object.hasOwn(enErrors, value);
export function translator(locale: Locale): Translate {
  return (key, values = {}) => {
    const [ns, name] = key.split(".") as [keyof Namespaces, string];
    const dictionary = resources[locale][ns] as Record<string, string>;
    const fallback = resources.en[ns] as Record<string, string>;
    return (dictionary[name] ?? fallback[name] ?? key).replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => String(values[key] ?? `{{${key}}}`),
    );
  };
}
export function localeFromCookie(cookie: string | null): Locale {
  const match = cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LANG_STORAGE_KEY}=`))
    ?.split("=")[1];
  return isLocale(match) ? match : DEFAULT_LOCALE;
}
export function numberFormatter(
  locale: Locale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", options);
}
