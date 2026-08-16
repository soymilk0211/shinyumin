/**
 * 網站支援的語言。
 *
 * 網址規則：`/zh/...` 是中文站，`/en/...` 是英文站。
 * 直接打 `/` 會被自動導到其中一個（見專案根目錄的 proxy.ts）。
 */

export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

/** 預設語言。主要客群在台灣，所以是中文。 */
export const defaultLocale: Locale = "zh";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** 語言切換按鈕上顯示的文字 */
export const localeNames: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

/** 給 <html lang="..."> 用的正式語言代碼 */
export const localeHtmlLang: Record<Locale, string> = {
  zh: "zh-Hant-TW",
  en: "en",
};
