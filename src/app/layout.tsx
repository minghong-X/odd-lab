import { getServerI18n } from "@/i18n/server";
import { I18nProvider, LanguageSwitcher } from "@/i18n/provider";
import Link from "next/link";
import "./globals.css";
export async function generateMetadata() {
  const { t } = await getServerI18n();
  return {
    title: { default: t("common.metaTitle"), template: "%s · Odd Lab" },
    description: t("common.metaDescription"),
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t, locale } = await getServerI18n();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} data-scroll-behavior="smooth">
      <body>
        <I18nProvider initialLocale={locale}>
          <a className="skip-link" href="#main">
            {t("common.skipContent")}
          </a>
          <header className="site-header">
            <Link href="/" className="brand" aria-label={t("common.homeLabel")}>
              odd<span>lab</span>
              <i />
            </Link>
            <nav aria-label={t("common.navLabel")}>
              <Link href="/experiments">{t("common.experiments")}</Link>
              <Link href="/leaderboard/pelican">{t("common.leaderboard")}</Link>
              <Link href="/arena/pelican" className="nav-arena">
                {t("common.startArena")}
                <span aria-hidden>↗</span>
              </Link>
            </nav>
            <LanguageSwitcher />
          </header>
          {children}
          <footer className="site-footer">
            <Link href="/" className="brand">
              odd<span>lab</span>
              <i />
            </Link>
            <p>{t("common.footerLine")}</p>
            <span>{t("common.footerCredit")}</span>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
