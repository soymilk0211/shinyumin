import type { Metadata } from "next";
import { Geist, LXGW_WenKai_TC } from "next/font/google";
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

// 標題字型：霞鶩文楷（LXGW WenKai TC）。
//
// 這是一套楷書風格的繁體字型，筆畫帶手寫的起收，跟商標上那兩個毛筆字
// 是同一種語氣。刻意不用明體 —— 明體（新細明體那一類）在螢幕上太像
// 公文與教科書，沒有品牌個性。
//
// 【只要一種字重】：中文字型每一個字重都是一份完整的字型檔，
// 多載一種就多幾百 KB。這個設計本來就靠字級大小拉層次、不靠粗細。
const displayFont = LXGW_WenKai_TC({
  variable: "--font-display-cjk",
  subsets: ["latin"],
  weight: ["400"],
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
      className={`${geistSans.variable} ${displayFont.variable} h-full`}
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
