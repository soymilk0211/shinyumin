import type { PublicOrder } from "@/lib/order-lookup";
import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 登入之後的「我的訂單」。【伺服器端專用。】
 *
 * 【這裡不需要訂單編號，也不需要電話後四碼。】
 * 那兩樣是給沒有登入的人證明「這張單是我的」用的；
 * 已經登入的人，身分早就確認過了 —— 直接用 user_id 撈就好。
 *
 * 【仍然走伺服器端，用萬能鑰匙查。】訂單表對瀏覽器端的公開金鑰
 * 永遠是關著的，沒有為了會員而開一條 RLS 政策。
 * 少一條政策，就少一個寫錯會外洩個資的地方。
 *
 * 回傳的形狀跟訪客查訂單完全一樣（`PublicOrder`）——
 * 一樣沒有地址、email 與完整電話。客人自己知道那些，畫面上不需要再放一次。
 */
export async function listMemberOrders(userId: string): Promise<PublicOrder[]> {
  const db = getAdminClient();
  if (!db) return [];

  const { data, error } = await db
    .from("orders")
    .select(
      `order_number, created_at, order_status, payment_method, shipping_method,
       subtotal_twd, shipping_fee_twd, total_twd,
       order_items ( product_name_zh, variant_label_zh, quantity, line_total_twd )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("讀取會員訂單失敗：", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const items = (row.order_items ?? []) as Record<string, unknown>[];
    return {
      orderNumber: String(row.order_number),
      createdAt: String(row.created_at),
      status: String(row.order_status) as PublicOrder["status"],
      paymentMethod: String(row.payment_method),
      shippingMethod: String(row.shipping_method),
      subtotalTwd: Number(row.subtotal_twd),
      shippingFeeTwd: Number(row.shipping_fee_twd),
      totalTwd: Number(row.total_twd),
      items: items.map((item) => ({
        productName: String(item.product_name_zh),
        label: String(item.variant_label_zh),
        quantity: Number(item.quantity),
        lineTotalTwd: Number(item.line_total_twd),
      })),
    };
  });
}
