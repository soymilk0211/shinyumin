"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { localeNames, locales, type Locale } from "@/i18n/config";

/**
 * 中英文切換。
 *
 * 切換的作法是「把網址開頭的語言換掉，其餘保持不變」——
 * 例如在 /zh/teas 按下 EN，會到 /en/teas，而不是被丟回首頁。
 *
 * 【問號後面那一段也要一起帶過去。】網址不是只有路徑：
 * 訂單完成頁的編號放在 `?no=YM-20260819-0001`、會員頁的狀態也放在問號後面。
 * 只換路徑、把問號後面丟掉的話，客人下完單一切成英文，
 * 訂單編號就整個不見了 —— 業主 2026-08-19 在真的手機上遇到這件事。
 */

type Props = {
  current: Locale;
  label: string;
};

/**
 * 只負責畫面。`query` 是要接在網址後面的那一段（含問號），沒有就是空字串。
 *
 * 拆出來的原因見下面 LocaleSwitcher 的說明：預先產生的頁面讀不到問號後面，
 * 需要一個不讀網址也能先畫出來的版本。
 */
function SwitcherView({ current, label, query }: Props & { query: string }) {
  const pathname = usePathname();

  function hrefFor(locale: Locale) {
    const segments = pathname.split("/");
    // segments[0] 是空字串（網址以 / 開頭），segments[1] 才是語言
    segments[1] = locale;
    return (segments.join("/") || `/${locale}`) + query;
  }

  return (
    <div className="label flex items-center" role="group" aria-label={label}>
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 h-3 w-px bg-line" aria-hidden="true" />
          )}
          {locale === current ? (
            <span className="text-brand" aria-current="true">
              {localeNames[locale]}
            </span>
          ) : (
            <Link
              href={hrefFor(locale)}
              className="text-ink-faint transition-colors hover:text-brand"
            >
              {localeNames[locale]}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}

function SwitcherWithQuery(props: Props) {
  const search = useSearchParams().toString();
  return <SwitcherView {...props} query={search ? `?${search}` : ""} />;
}

/**
 * 【為什麼要包一層 Suspense。】
 *
 * 大部分頁面（首頁、茶品、品牌故事…）是事先產生好的靜態頁面，
 * 產生的當下根本還不知道訪客的網址問號後面是什麼。Next.js 因此要求
 * 「會讀問號」的元件必須包在 Suspense 裡，先畫一個不讀網址的版本，
 * 到瀏覽器上再補上。
 *
 * 那些靜態頁面本來就沒有問號，所以先畫的版本跟最後的結果一模一樣，
 * 看不出差別。真正需要帶問號的是訂單完成頁與會員頁，
 * 而那兩頁是每次即時產生的，一開始就讀得到。
 */
export function LocaleSwitcher(props: Props) {
  return (
    <Suspense fallback={<SwitcherView {...props} query="" />}>
      <SwitcherWithQuery {...props} />
    </Suspense>
  );
}
