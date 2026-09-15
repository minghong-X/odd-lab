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
              <a
                className="nav-github"
                href="https://github.com/minghong-X/odd-lab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("common.github")}
                title={t("common.github")}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.768-.244.768-.542 0-.267-.01-.975-.015-1.913-3.13.68-3.79-1.51-3.79-1.51-.512-1.3-1.25-1.647-1.25-1.647-1.022-.7.077-.685.077-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.724 2.637 1.226 3.28.938.103-.728.393-1.226.715-1.508-2.498-.284-5.125-1.25-5.125-5.566 0-1.23.44-2.234 1.16-3.02-.117-.284-.503-1.43.11-2.98 0 0 .945-.303 3.095 1.153A10.79 10.79 0 0 1 12 6.174c.957.004 1.92.13 2.82.38 2.148-1.456 3.092-1.153 3.092-1.153.615 1.55.228 2.696.112 2.98.722.786 1.158 1.79 1.158 3.02 0 4.327-2.631 5.278-5.138 5.557.404.35.764 1.044.764 2.104 0 1.52-.014 2.747-.014 3.12 0 .3.203.651.774.541A11.252 11.252 0 0 0 12 .75Z" />
                </svg>
              </a>
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
