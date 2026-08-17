"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 購物車。
 *
 * 【購物車只記「規格 ID + 數量」，絕不記價格。】
 *
 * 原因：購物車存在客人自己的瀏覽器裡（LocalStorage），
 * 稍微懂技術的人可以任意修改裡面的內容。如果價格存在這裡，
 * 等於把訂價權交給客人 —— 有人把 650 改成 1 就麻煩了。
 *
 * 所以價格永遠是「即時從資料庫查出來顯示」，
 * 結帳時再由伺服器重新查一次資料庫計算總額（第 4 步）。
 * 這同時也解決了另一個問題：客人把東西放在購物車裡好幾天，
 * 期間業主調過價，結帳時算的會是最新的價格。
 */

export type CartLine = {
  /** 規格 ID。這是唯一能被加入購物車的單位，不是商品 ID。 */
  variantId: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];

  /**
   * LocalStorage 讀完了沒。
   *
   * 網頁是先在伺服器上做好再送到瀏覽器的，而購物車內容只有瀏覽器知道。
   * 讀完之前先不顯示數量，畫面才不會先出現 0 再跳成 3。
   */
  hydrated: boolean;

  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  markHydrated: () => void;
};

/** 單一品項的數量上限。手滑輸入 9999 罐不合理，也擋掉惡意灌數量。 */
const MAX_PER_LINE = 99;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,

      add: (variantId, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === variantId
                  ? {
                      ...l,
                      quantity: Math.min(l.quantity + quantity, MAX_PER_LINE),
                    }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              { variantId, quantity: Math.min(quantity, MAX_PER_LINE) },
            ],
          };
        }),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) =>
                  l.variantId === variantId
                    ? { ...l, quantity: Math.min(quantity, MAX_PER_LINE) }
                    : l,
                ),
        })),

      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.variantId !== variantId),
        })),

      clear: () => set({ lines: [] }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "yumin-cart",
      version: 1,
      // 只保存品項；hydrated 是當下的暫時狀態，不需要存進 LocalStorage
      partialize: (state) => ({ lines: state.lines }),
      // 這個 callback 在讀完 LocalStorage 之後才跑，不是在畫面繪製當下，
      // 所以不會造成伺服器與瀏覽器的內容對不起來
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

/** 購物車裡總共幾件 */
export function countItems(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
