import type { Product } from "@/lib/products";

/**
 * 對照表：規格 ID → 商品名稱、包裝、價格。
 *
 * 為什麼需要這個東西：購物車只記「規格 ID + 數量」，
 * 名稱與價格都不在裡面。所以每一個要顯示購物車內容的頁面
 * （購物車頁、結帳頁）都得先跟資料庫拿一份對照表，送到瀏覽器去對。
 *
 * 好處是客人把東西放了好幾天、期間業主調過價，回來看到的都是最新價格。
 *
 * 【這裡的價格只是拿來顯示的。】結帳時伺服器會重新查一次資料庫算金額，
 * 不會採用瀏覽器送上來的任何數字。
 */

export type CatalogueEntry = {
  productName: string;
  productSlug: string;
  label: string;
  priceTwd: number;
  /** 現在買得到嗎。售罄的規格看得到、但不能結帳 */
  available: boolean;
};

export function buildCatalogue(
  products: Product[],
): Record<string, CatalogueEntry> {
  const catalogue: Record<string, CatalogueEntry> = {};

  for (const product of products) {
    for (const variant of product.variants) {
      catalogue[variant.id] = {
        productName: product.name,
        productSlug: product.slug,
        label: variant.label,
        priceTwd: variant.priceTwd,
        available: variant.status === "on_sale",
      };
    }
  }

  return catalogue;
}
