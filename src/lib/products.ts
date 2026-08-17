import type { Locale } from "@/i18n/config";
import { getPublicClient } from "@/lib/supabase";

/**
 * 從資料庫讀商品。
 *
 * 這一層負責兩件事：
 *   1. 把資料庫的雙語欄位（name_zh／name_en）依照目前語言挑一個出來，
 *      頁面拿到的就是已經選好語言的資料，不需要每個地方都寫一次判斷。
 *   2. 資料庫連不上時回傳空陣列，讓頁面顯示「準備中」而不是壞掉。
 *
 * 【只讀取，不寫入。】用的是公開金鑰，受資料庫門禁（RLS）保護：
 * 只讀得到已上架的商品與未下架的規格，訂單完全碰不到。
 */

/** 規格：一款茶的一種包裝。這是唯一能被加入購物車的單位。 */
export type Variant = {
  id: string;
  sku: string;
  label: string;
  weightGrams: number | null;
  priceTwd: number;
  /** on_sale = 販售中／sold_out = 售罄（看得到但不能買） */
  status: "on_sale" | "sold_out";
};

/** 商品：一款茶。本身不能被購買，要買的是它底下的規格。 */
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tastingNotes: string | null;
  imageFilename: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  variants: Variant[];
};

export type Category = {
  id: string;
  slug: string;
  name: string;
};

/** 資料庫裡的雙語欄位，依語言挑一個 */
function pick(row: Record<string, unknown>, field: string, locale: Locale) {
  const value = row[`${field}_${locale}`];
  const fallback = row[`${field}_zh`];
  return (value as string) || (fallback as string) || null;
}

export async function getCategories(locale: Locale): Promise<Category[]> {
  const db = getPublicClient();
  if (!db) return [];

  const { data, error } = await db
    .from("categories")
    .select("id, slug, name_zh, name_en, sort_order")
    .order("sort_order");

  if (error) {
    console.error("讀取分類失敗：", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: pick(row, "name", locale) ?? row.slug,
  }));
}

/** 商品連同它的規格。已下架的規格由資料庫的門禁擋掉，這裡看不到。 */
export async function getProducts(locale: Locale): Promise<Product[]> {
  const db = getPublicClient();
  if (!db) return [];

  const { data, error } = await db
    .from("products")
    .select(
      `id, slug, name_zh, name_en, description_zh, description_en,
       tasting_notes_zh, tasting_notes_en, image_filename, sort_order,
       categories ( slug, name_zh, name_en ),
       variants ( id, sku, label_zh, label_en, weight_grams, price_twd, status, sort_order )`,
    )
    .order("sort_order");

  if (error) {
    console.error("讀取商品失敗：", error.message);
    return [];
  }

  return (data ?? []).map((row) => toProduct(row, locale));
}

export async function getProductBySlug(
  slug: string,
  locale: Locale,
): Promise<Product | null> {
  const products = await getProducts(locale);
  return products.find((product) => product.slug === slug) ?? null;
}

type Row = Record<string, unknown>;

type ProductRow = Row & {
  id: string;
  slug: string;
  // 分類其實只會有一筆，但 Supabase 的型別把關聯一律當成陣列，
  // 所以兩種形狀都要接得住。
  categories: Row | Row[] | null;
  variants: Row[] | null;
};

function toProduct(row: ProductRow, locale: Locale): Product {
  const category = Array.isArray(row.categories)
    ? (row.categories[0] ?? null)
    : row.categories;

  const variants = (row.variants ?? [])
    // 已下架的不顯示。資料庫的門禁已經擋過一次，這裡是第二道保險。
    .filter((v) => v.status !== "archived")
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map(
      (v): Variant => ({
        id: String(v.id),
        sku: String(v.sku),
        label: pick(v, "label", locale) ?? String(v.sku),
        weightGrams: (v.weight_grams as number | null) ?? null,
        priceTwd: Number(v.price_twd),
        status: v.status === "sold_out" ? "sold_out" : "on_sale",
      }),
    );

  return {
    id: row.id,
    slug: row.slug,
    name: pick(row, "name", locale) ?? row.slug,
    description: pick(row, "description", locale),
    tastingNotes: pick(row, "tasting_notes", locale),
    imageFilename: (row.image_filename as string | null) ?? null,
    categorySlug: category ? String(category.slug) : null,
    categoryName: category ? pick(category, "name", locale) : null,
    variants,
  };
}

/** 一款茶的「最低價」，用在列表上顯示「NT$ 380 起」 */
export function lowestPrice(product: Product): number | null {
  const prices = product.variants
    .filter((v) => v.status === "on_sale")
    .map((v) => v.priceTwd);
  return prices.length ? Math.min(...prices) : null;
}

/** 價格一律台幣整數，不顯示小數 */
export function formatPrice(twd: number): string {
  return `NT$ ${twd.toLocaleString("zh-TW")}`;
}
