"use client";

import { countItems, useCart } from "@/lib/cart-store";

/**
 * 選單列上「購物車」旁邊的件數。
 *
 * 購物車的內容只有瀏覽器知道（存在 LocalStorage），
 * 所以要等讀完之後才顯示數字 —— 否則畫面會先出現 0 再跳成 3，
 * 而且伺服器與瀏覽器產生的內容會對不起來、跳出錯誤。
 */
export function CartBadge() {
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);

  if (!hydrated) return null;

  const count = countItems(lines);
  if (count === 0) return null;

  return (
    <span className="ml-1.5 tabular-nums text-brand" aria-hidden="true">
      {count}
    </span>
  );
}
