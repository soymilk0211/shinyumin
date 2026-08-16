"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 網站上方的固定選單列。
 *
 * 手機與電腦是同一份程式、兩種排法：
 *   電腦 —— 連結直接橫向排開
 *   手機 —— 收成右上角的三條線按鈕，點開才展開
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
    <header className="sticky top-0 z-50 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* 品牌名 —— 商標圖檔到位之前先用文字 */}
        <Link href={`/${locale}`} className="group flex items-baseline gap-3">
          <span className="font-display text-xl tracking-[0.3em] text-ink transition-colors group-hover:text-brand">
            {dict.site.name}
          </span>
          <span className="hidden text-xs tracking-widest text-ink-faint sm:inline">
            {dict.site.tagline}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm">
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

          <div className="hidden h-4 w-px bg-line md:block" />

          <LocaleSwitcher current={locale} label={dict.common.switchLanguage} />
          <ThemeToggle label={dict.common.toggleTheme} />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-sunken hover:text-brand md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-line bg-page md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-2 sm:px-8">
            {links.map((link) => (
              <li key={link.href} className="border-b border-line last:border-0">
                <Link
                  href={link.href}
                  // 點了連結就把選單收起來，否則新頁面會被選單蓋住
                  onClick={() => setMenuOpen(false)}
                  className={`block py-3.5 text-sm ${
                    isActive(link.href) ? "text-brand" : "text-ink-soft"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
