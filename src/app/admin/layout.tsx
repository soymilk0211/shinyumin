import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

/**
 * 後台的外框。
 *
 * 【後台刻意不套前台那一整套視覺。】前台是型錄，講究留白、巨大標題、
 * 不對稱的版面；後台是工具，業主站在店裡、手上可能還拿著茶葉，
 * 要的是【字大、按鈕好按、一眼看得懂】。兩者的目的不同，長得不一樣是對的。
 *
 * 顏色仍然沿用同一份設定檔（theme.css），所以還是御茗的色。
 *
 * 另外這裡【不載入標題用的楷書字型】—— 那套中文字型接近 1MB，
 * 為了一個每天要開很多次的工具頁面下載它並不划算。
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "御茗後台",
  // 後台永遠不進搜尋引擎
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant-TW">
      <body className={`${geistSans.variable} bg-page text-ink`}>
        <div className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
          {children}
        </div>
      </body>
    </html>
  );
}
