import { notFound } from "next/navigation";

/**
 * 接住所有打錯的網址。
 *
 * 沒有這一頁的話，`/zh/隨便打的字` 會掉到 Next.js 內建的黑白 404 畫面 ——
 * 沒有選單、沒有頁尾，看起來像是網站壞掉。
 *
 * 這一頁本身不顯示任何東西，只是立刻交給同資料夾的 not-found.tsx，
 * 讓 404 畫面一樣包在網站的外框裡，訪客可以直接從選單走回去。
 */
export default function CatchAllPage(): never {
  notFound();
}
