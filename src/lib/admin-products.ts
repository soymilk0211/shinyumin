import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 後台的商品與價格。【伺服器端專用，用的是萬能鑰匙。】
 *
 * 後台看得到的東西比前台多：**未上架的商品、已下架的規格都要看得到**，
 * 否則業主想把「焙火烏龍」重新開賣時會找不到它。
 * 前台那支 `lib/products.ts` 用的是公開金鑰，看不到這些。
 */

export type AdminVariant = {
  id: string;
  sku: string;
  label: string;
  priceTwd: number;
  status: "on_sale" | "sold_out" | "archived";
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  isPublished: boolean;
  variants: AdminVariant[];
};

/** 價格的合理範圍。手滑多打一個 0 會很痛，所以擋一下。 */
export const MIN_PRICE_TWD = 0;
export const MAX_PRICE_TWD = 100000;

export const VARIANT_STATUS_LABEL: Record<AdminVariant["status"], string> = {
  on_sale: "販售中",
  sold_out: "售罄",
  archived: "已下架",
};

export async function listProductsForAdmin(): Promise<AdminProduct[]> {
  const db = getAdminClient();
  if (!db) return [];

  const { data, error } = await db
    .from("products")
    .select(
      `id, slug, name_zh, is_published, sort_order,
       categories ( name_zh ),
       variants ( id, sku, label_zh, price_twd, status, sort_order )`,
    )
    .order("sort_order");

  if (error) {
    console.error("後台讀取商品失敗：", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;

    const variants = ((row.variants ?? []) as Record<string, unknown>[])
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map(
        (variant): AdminVariant => ({
          id: String(variant.id),
          sku: String(variant.sku),
          label: String(variant.label_zh),
          priceTwd: Number(variant.price_twd),
          status:
            variant.status === "sold_out"
              ? "sold_out"
              : variant.status === "archived"
                ? "archived"
                : "on_sale",
        }),
      );

    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name_zh),
      categoryName: category ? String(category.name_zh) : null,
      isPublished: Boolean(row.is_published),
      variants,
    };
  });
}

/**
 * 改價。
 *
 * 【已經成立的訂單不會受影響。】訂單明細存的是下單當下的價格快照，
 * 不是每次回頭查商品表 —— 所以改價只影響之後的新訂單。
 */
export async function setVariantPrice(
  variantId: string,
  priceTwd: number,
): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  if (
    !Number.isInteger(priceTwd) ||
    priceTwd < MIN_PRICE_TWD ||
    priceTwd > MAX_PRICE_TWD
  ) {
    return false;
  }

  const { error } = await db
    .from("variants")
    .update({ price_twd: priceTwd })
    .eq("id", variantId);

  if (error) {
    console.error("後台改價失敗：", error.message);
    return false;
  }
  return true;
}

export async function setVariantStatus(
  variantId: string,
  status: AdminVariant["status"],
): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const { error } = await db
    .from("variants")
    .update({ status })
    .eq("id", variantId);

  if (error) {
    console.error("後台切換規格狀態失敗：", error.message);
    return false;
  }
  return true;
}

/** 整款茶要不要出現在網站上。焙火／碳焙烏龍就是靠這個開關留在資料庫裡。 */
export async function setProductPublished(
  productId: string,
  isPublished: boolean,
): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const { error } = await db
    .from("products")
    .update({ is_published: isPublished })
    .eq("id", productId);

  if (error) {
    console.error("後台切換商品上架失敗：", error.message);
    return false;
  }
  return true;
}
