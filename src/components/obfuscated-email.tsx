"use client";

import { useState } from "react";

/**
 * 防爬蟲的電子信箱。
 *
 * 為什麼要這樣做：網路上有大量程式整天在網頁裡撈 email 位址，撈到就拿去寄廣告信。
 * 只要信箱以完整的 `帳號@網域` 形式直接寫在網頁原始碼裡，幾乎必定會被撈走。
 *
 * 這裡的作法是：網頁原始碼裡只存**倒過來寫**的字串，
 * 訪客按一下之後才由瀏覽器把它轉回正常順序。
 * 真人看得到、按得到；只會讀原始碼的爬蟲程式抓到的是一串沒有意義的文字。
 *
 * 完全擋不掉是不可能的（會執行 JavaScript 的爬蟲仍有辦法），
 * 但這能擋掉絕大多數的自動撈信程式。
 */
const REVERSED = "ten.tenih.22sm@3216k";

export function ObfuscatedEmail({ revealLabel }: { revealLabel: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="text-brand underline underline-offset-4 transition-colors hover:text-brand-strong"
      >
        {revealLabel}
      </button>
    );
  }

  const address = REVERSED.split("").reverse().join("");

  return (
    <a
      href={`mailto:${address}`}
      className="text-brand underline underline-offset-4 transition-colors hover:text-brand-strong"
    >
      {address}
    </a>
  );
}
