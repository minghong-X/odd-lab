import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LANG_STORAGE_KEY,
  translator,
  type TranslationKey,
} from "./index";
export async function getServerI18n() {
  const stored = (await cookies()).get(LANG_STORAGE_KEY)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;
  return { locale, t: translator(locale) };
}
export function pageMetadata(key: TranslationKey) {
  return async () => {
    const { t } = await getServerI18n();
    return { title: t(key) };
  };
}
