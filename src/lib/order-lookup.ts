import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 讓客人自己查訂單。【伺服器端專用。】
 *
 * 【為什麼不是「輸入訂單編號就查得到」】
 *
 * 訂單編號是流水號（YM-20260818-0001、0002…），任何人都猜得出來。
 * 只靠編號就能查，等於把所有客人的訂單攤在網路上。
 *
 * 所以查詢要【兩樣東西同時對】：訂單編號 + 電話後四碼。
 * 四碼有一萬種組合，再加上外面那層「同一個人十五分鐘只能試五次」，
 * 想一個一個試出來並不划算。
 *
 * 另外，查不到與電話不符【回傳完全一樣的結果】——
 * 不然對方可以用「這個編號存在」這件事本身反推出有多少訂單。
 */

export type PublicOrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled";

/**
 * 給客人看的訂單。
 *
 * 【刻意不包含地址、email 與完整電話。】客人自己知道那些，
 * 而萬一真的有人猜中了四碼，這裡少放一樣就少洩漏一樣。
 * 要核對地址請客人來電。
 */
export type PublicOrder = {
  orderNumber: string;
  createdAt: string;
  status: PublicOrderStatus;
  paymentMethod: string;
  shippingMethod: string;
  subtotalTwd: number;
  shippingFeeTwd: number;
  totalTwd: number;
  items: {
    productName: string;
    label: string;
    quantity: number;
    lineTotalTwd: number;
  }[];
};

/** 訂單編號長這樣：YM-20260818-0001 */
const ORDER_NUMBER = /^YM-\d{8}-\d{4}$/;

export async function lookupOrder(
  orderNumberInput: string,
  phoneLast4Input: string,
): Promise<PublicOrder | null> {
  const orderNumber = orderNumberInput.trim().toUpperCase();
  const phoneLast4 = phoneLast4Input.replace(/\D/g, "");

  if (!ORDER_NUMBER.test(orderNumber)) return null;
  if (!/^\d{4}$/.test(phoneLast4)) return null;

  const db = getAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from("orders")
    .select(
      `order_number, customer_phone, created_at, order_status,
       payment_method, shipping_method,
       subtotal_twd, shipping_fee_twd, total_twd,
       order_items ( product_name_zh, variant_label_zh, quantity, line_total_twd )`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) return null;

  // 電話只比對後四碼，而且是抽掉所有非數字之後再比 ——
  // 客人當初可能填「0912-345-678」，也可能填「0912 345 678」。
  const stored = String(data.customer_phone).replace(/\D/g, "");
  if (stored.slice(-4) !== phoneLast4) return null;

  const items = (data.order_items ?? []) as Record<string, unknown>[];

  return {
    orderNumber: String(data.order_number),
    createdAt: String(data.created_at),
    status: String(data.order_status) as PublicOrderStatus,
    paymentMethod: String(data.payment_method),
    shippingMethod: String(data.shipping_method),
    subtotalTwd: Number(data.subtotal_twd),
    shippingFeeTwd: Number(data.shipping_fee_twd),
    totalTwd: Number(data.total_twd),
    items: items.map((item) => ({
      productName: String(item.product_name_zh),
      label: String(item.variant_label_zh),
      quantity: Number(item.quantity),
      lineTotalTwd: Number(item.line_total_twd),
    })),
  };
}
