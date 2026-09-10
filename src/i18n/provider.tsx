"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  isLocale,
  LANG_STORAGE_KEY,
  translator,
  type Locale,
  type Translate,
} from "./index";
const Context = createContext<{
  locale: Locale;
  t: Translate;
  setLocale: (locale: Locale) => void;
} | null>(null);
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, update] = useState(initialLocale);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const setLocale = useCallback(
    (next: Locale) => {
      update(next);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {}
      document.cookie = `${LANG_STORAGE_KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
      startTransition(() => router.refresh());
    },
    [router],
  );
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLocale(stored) && !document.cookie.includes(`${LANG_STORAGE_KEY}=`))
        setLocale(stored);
    } catch {}
    const sync = (event: StorageEvent) => {
      if (event.key === LANG_STORAGE_KEY && isLocale(event.newValue))
        setLocale(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [setLocale]);
  const value = useMemo(
    () => ({ locale, t: translator(locale), setLocale }),
    [locale, setLocale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("I18nProvider is required");
  return context;
}
export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div
      className="language-switch"
      role="group"
      aria-label={t("common.language")}
    >
      <button
        type="button"
        aria-label="中文"
        aria-pressed={locale === "zh"}
        onClick={() => setLocale("zh")}
      >
        中
      </button>
      <span aria-hidden>/</span>
      <button
        type="button"
        aria-label="English"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
