import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";

/**
 * 語言分流。
 *
 * 網站的每一頁都住在語言資料夾底下（`/zh/...` 或 `/en/...`）。
 * 但訪客通常只會打 `yumin.com`，沒有帶語言。
 * 這支程式就是站在門口的接待員：看一眼瀏覽器的語言設定，
 * 把沒帶語言的訪客送去對應的入口。
 *
 * 註：Next.js 16 把原本的 middleware 改名為 proxy，功能相同。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 已經有語言前綴（/zh 或 /en）就放行
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = pickLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

/**
 * 從瀏覽器送來的語言偏好挑一個我們支援的語言。
 * 只有明確偏好英文的訪客會看到英文站，其餘一律中文。
 */
function pickLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      return {
        tag: tag.toLowerCase(),
        quality: quality ? Number(quality.slice(2)) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferred) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

export const config = {
  // 不處理：Next.js 內部檔案、API、以及任何有副檔名的檔案（圖片、字型…）
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
