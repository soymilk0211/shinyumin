"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

/**
 * 中英文切換。
 *
 * 切換的作法是「把網址開頭的語言換掉，其餘保持不變」——
 * 例如在 /zh/teas 按下 EN，會到 /en/teas，而不是被丟回首頁。
 * 訪客看到一半切語言時，還會停在原本那一頁。
 */
export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();

  function hrefFor(locale: Locale) {
    const segments = pathname.split("/");
    // segments[0] 是空字串（網址以 / 開頭），segments[1] 才是語言
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
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
