"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { CartBadge } from "@/components/cart-badge";
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
 * 手機上點開選單會蓋滿整個畫面，用大字的楷書排列 ——
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
    { href: `/${locale}`, label: dict.nav.home, cart: false },
    { href: `/${locale}/teas`, label: dict.nav.products, cart: false },
    { href: `/${locale}/story`, label: dict.nav.story, cart: false },
    { href: `/${locale}/cart`, label: dict.nav.cart, cart: true },
  ];

  function isActive(href: string) {
    return href === `/${locale}`
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-page/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 px-6 py-5 sm:px-10">
          {/* 商標。深色底要換一版：書法字的深紅在炭焙黑上看不見 */}
          <Link
            href={`/${locale}`}
            aria-label={dict.site.nameFull}
            className="transition-opacity hover:opacity-75"
          >
            <BrandLogo
              alt={dict.site.nameFull}
              className="h-8 w-auto sm:h-10"
            />
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
                      {link.cart && <CartBadge />}
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
      </header>

      {/* 手機版：蓋滿整個畫面的選單。
          【必須放在 header 外面】—— 選單列有毛玻璃效果（backdrop-blur），
          而 CSS 規定：帶有 filter／backdrop-filter 的元素會成為它子孫裡
          position: fixed 的定位基準。放在裡面的話，這個「全螢幕」選單
          實際上只會有選單列那麼高（72px），四個連結就會擠成一團。 */}
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

          {/* 四個連結【平均分攤整個畫面高度】，不是擠在中間一小塊。
              每一列自己撐開，點擊區域也跟著變大，手機上好按很多。 */}
          <nav className="flex flex-1 flex-col px-6 pb-10">
            <ul className="flex flex-1 flex-col">
              {links.map((link, index) => (
                <li
                  key={link.href}
                  className="flex flex-1 border-t border-line last:border-b"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-1 items-center gap-7"
                  >
                    <span className="label w-6 shrink-0 text-ink-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-display text-[1.75rem] ${
                        isActive(link.href) ? "text-brand" : "text-ink"
                      }`}
                    >
                      {link.label}
                      {link.cart && <CartBadge />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
