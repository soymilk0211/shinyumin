"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 網站上方的選單列。
 *
 * 走型錄的路線，不是一般網站的導覽列：沒有底色塊、沒有按鈕框，
 * 只有一條髮絲般的細線把它與內容分開。
 * 選單文字刻意設得很小、字距拉得很寬 —— 精緻感來自留白，不是來自尺寸。
 *
 * 手機上點開選單會蓋滿整個畫面，用巨大的明體排列 ——
 * 翻開一本書的感覺，而不是拉開一個下拉式清單。
 */
export function SiteHeader({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/teas`, label: dict.nav.products },
    { href: `/${locale}/story`, label: dict.nav.story },
    { href: `/${locale}/cart`, label: dict.nav.cart },
  ];

  function isActive(href: string) {
    return href === `/${locale}` ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-6 px-6 py-5 sm:px-10">
        {/* 品牌名。商標圖檔到位之前先用字體處理 */}
        <Link href={`/${locale}`} className="group flex flex-col leading-none">
          <span className="font-display text-2xl tracking-[0.25em] text-ink transition-colors group-hover:text-brand">
            {dict.site.name}
          </span>
          <span className="label mt-1.5 text-ink-faint">
            {dict.site.nameLatin}
          </span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-10">
          <nav className="hidden md:block">
            <ul className="label flex items-center gap-9">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={
                      isActive(link.href)
                        ? "text-brand"
                        : "text-ink-soft transition-colors hover:text-brand"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-5">
            <LocaleSwitcher
              current={locale}
              label={dict.common.switchLanguage}
            />
            <ThemeToggle label={dict.common.toggleTheme} />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={dict.nav.openMenu}
              className="text-ink-soft transition-colors hover:text-brand md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                aria-hidden="true"
              >
                <path d="M3 8h18M3 16h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 手機版：蓋滿整個畫面的選單 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-page md:hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <span className="label text-ink-faint">{dict.site.place}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={dict.nav.closeMenu}
              className="text-ink-soft transition-colors hover:text-brand"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                aria-hidden="true"
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center px-6 pb-24">
            <ul>
              {links.map((link, index) => (
                <li key={link.href} className="border-t border-line last:border-b">
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-baseline gap-5 py-6"
                  >
                    <span className="label w-6 shrink-0 text-ink-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-display text-4xl font-light ${
                        isActive(link.href) ? "text-brand" : "text-ink"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
