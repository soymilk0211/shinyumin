"use client";

import { useState } from "react";

/**
 * 防爬蟲的聯絡方式（信箱與電話共用）。
 *
 * 為什麼要這樣做：網路上有大量程式整天在網頁裡撈 email 與電話號碼，
 * 撈到就拿去寄廣告信、打推銷與詐騙電話。只要以完整格式直接寫在原始碼裡，
 * 幾乎必定會被撈走 —— **手機號碼被撈走的後果比信箱嚴重得多**。
 *
 * 這裡的作法是：網頁原始碼裡只存**倒過來寫**的字串，
 * 訪客按一下之後才由瀏覽器轉回正常順序。
 * 真人看得到、按得到（手機上點了可以直接撥）；
 * 只讀原始碼的爬蟲抓到的是一串沒有意義的數字或文字。
 *
 * 完全擋不掉是不可能的（會執行 JavaScript 的爬蟲仍有辦法），
 * 但這能擋掉絕大多數的自動蒐集程式。
 */

const CONTACTS = {
  /** k6123@ms22.hinet.net */
  email: {
    reversed: "ten.tenih.22sm@3216k",
    scheme: "mailto:",
    /** 顯示用的樣子；未指定就直接顯示還原後的字串 */
    format: (value: string) => value,
  },
  /** 老闆的手機。經本人同意公開，見 CONTEXT.md 的隱私規則 */
  phone: {
    reversed: "5314111190",
    scheme: "tel:",
    format: (value: string) =>
      `${value.slice(0, 4)}-${value.slice(4, 7)}-${value.slice(7)}`,
    /** 顯示在號碼後面，讓客人知道要找誰 */
    contactName: "陳小姐",
  },
} as const;

export function ObfuscatedContact({
  kind,
  revealLabel,
}: {
  kind: keyof typeof CONTACTS;
  revealLabel: string;
}) {
  const [revealed, setRevealed] = useState(false);

  const className =
    "link-rule text-brand transition-colors hover:text-brand-strong";

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className={className}
      >
        {revealLabel}
      </button>
    );
  }

  const contact = CONTACTS[kind];
  const value = contact.reversed.split("").reverse().join("");
  const name = "contactName" in contact ? contact.contactName : null;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3">
      <a href={`${contact.scheme}${value}`} className={className}>
        {contact.format(value)}
      </a>
      {name && <span className="text-ink-soft">{name}</span>}
    </span>
  );
}
