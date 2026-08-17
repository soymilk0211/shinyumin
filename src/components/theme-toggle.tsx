"use client";

import { useTheme } from "next-themes";

/**
 * 深淺色切換按鈕。
 *
 * 這裡有一個看起來奇怪、但很重要的作法：**太陽與月亮兩個圖示都畫出來，
 * 再用 CSS 把不該出現的那個藏起來。**
 *
 * 原因是網頁先在伺服器上產生、再送到瀏覽器，而「這位訪客現在是深色還是淺色」
 * 只有瀏覽器知道。如果用程式去判斷該畫哪一個，伺服器與瀏覽器會給出不同答案，
 * 畫面會先閃一下、React 也會報錯。
 * 兩個都畫、交給 CSS 決定，兩邊產生的內容就完全一致 —— 不閃、不報錯。
 */
export function ThemeToggle({ label }: { label: string }) {
  const { setTheme } = useTheme();

  function toggle() {
    // 直接看網頁目前的狀態，比記在 React 裡更可靠
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="text-ink-soft transition-colors hover:text-brand"
    >
      {/* 深色模式時顯示太陽（按下去會變亮） */}
      <SunIcon className="hidden dark:block" />
      {/* 淺色模式時顯示月亮（按下去會變暗） */}
      <MoonIcon className="block dark:hidden" />
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.6 6.6 0 0 0 9.5 9.5Z" />
    </svg>
  );
}
