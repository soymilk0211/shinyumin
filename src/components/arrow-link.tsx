import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 型錄式的連結，取代一般網站的按鈕。
 *
 * 這個網站刻意不用圓角矩形的填色按鈕 —— 那是軟體介面的語彙，不是紙本型錄的。
 * 這裡用的是：極小的字、拉寬的字距、一支細箭頭，
 * 滑鼠移上去時底線由左往右展開、箭頭往前走一小步。
 *
 * 互動感來自「動作」，不是來自「框」。
 */
export function ArrowLink({
  href,
  children,
  tone = "brand",
}: {
  href: string;
  children: ReactNode;
  /** brand = 琥珀色（主要動作）；ink = 墨色（次要動作） */
  tone?: "brand" | "ink";
}) {
  return (
    <Link
      href={href}
      className={`link-rule label group ${
        tone === "brand"
          ? "text-brand hover:text-brand-strong"
          : "text-ink-soft hover:text-brand"
      } transition-colors`}
    >
      <span>{children}</span>
      <svg
        viewBox="0 0 32 8"
        className="h-2 w-8 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        aria-hidden="true"
      >
        <path d="M0 4h30M26 1l4 3-4 3" />
      </svg>
    </Link>
  );
}
