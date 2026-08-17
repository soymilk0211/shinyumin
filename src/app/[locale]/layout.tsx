import type { Metadata } from "next";
import { Geist, Noto_Serif_TC } from "next/font/google";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { isLocale, localeHtmlLang, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import "../globals.css";

/**
 * 全站的外框。
 *
 * 每一個頁面都會被包在這裡面，所以選單列與頁尾只需要寫一次。
 * 網址中的語言（/zh 或 /en）在這一層決定，往下傳給所有頁面。
 */

// 拉丁字母的內文字型
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// 標題用的繁體襯線體（明體）。這個設計的靈魂在字體上，所以值得下載。
//
// 【只要一種字重】：中文字型每一個字重都是一份完整的字型檔。
// 原本抓了 200／300／500 三種，手機要下載 1.4MB；只留 300 一種之後降到約 1/3。
// 這個設計本來就靠「字級大小」拉層次、不靠粗細，所以一種字重完全夠用。
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["300"],
  display: "swap",
});

/** 事先把中文站與英文站都產生好，訪客一進來就是現成的頁面，開得快 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = getDictionary(locale);
  return {
    title: {
      default: `${dict.site.nameFull}｜${dict.site.tagline}`,
      template: `%s｜${dict.site.name}`,
    },
    description: dict.site.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <html
      lang={localeHtmlLang[locale]}
      className={`${geistSans.variable} ${notoSerifTC.variable} h-full`}
      // 深淺色模式是在瀏覽器端才決定的，這一行是告訴 React：
      // <html> 標籤上的 class 兩邊對不起來是正常的，不用警告。
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SiteHeader locale={locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <SiteFooter dict={dict} />
        </ThemeProvider>
      </body>
    </html>
  );
}
