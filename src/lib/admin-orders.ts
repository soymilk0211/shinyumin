import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 後台讀寫訂單。【伺服器端專用，用的是萬能鑰匙。】
 *
 * 訂單資料表對訪客是完全鎖住的（RLS），所以這些查詢一定要走伺服器。
 * 這個檔案裡的任何東西都不可以被瀏覽器端的程式引用。
 */

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** 資料庫存英文代號，畫面上顯示中文 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  transfer: "匯款",
  cod: "貨到付款",
};

export const SHIPPING_METHOD_LABEL: Record<string, string> = {
  tcat: "黑貓宅急便",
  post: "郵局",
  post_outlying: "離島郵局",
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalTwd: number;
  orderStatus: OrderStatus;
  paymentMethod: string;
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  customerPhone: string;
  customerEmail: string;
  shippingMethod: string;
  shippingAddress: string;
  subtotalTwd: number;
  shippingFeeTwd: number;
  paymentStatus: string;
  taxId: string | null;
  invoiceTitle: string | null;
  note: string | null;
  items: {
    id: string;
    productName: string;
    label: string;
    unitPriceTwd: number;
    quantity: number;
    lineTotalTwd: number;
  }[];
};

function toStatus(value: unknown): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(String(value))
    ? (value as OrderStatus)
    : "pending_payment";
}

/**
 * 訂單列表，新的排在前面。
 *
 * 【一次只讀 100 筆。】業主用手機看，再多也捲不完，
 * 而且無上限的查詢遲早會在生意變好之後變慢。
 */
export async function listOrders(): Promise<OrderSummary[]> {
  const db = getAdminClient();
  if (!db) return [];

  const { data, error } = await db
    .from("orders")
    .select("id, order_number, customer_name, total_twd, order_status, payment_method, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("後台讀取訂單失敗：", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    totalTwd: Number(row.total_twd),
    orderStatus: toStatus(row.order_status),
    paymentMethod: String(row.payment_method),
    createdAt: String(row.created_at),
  }));
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const db = getAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from("orders")
    .select(
      `id, order_number, customer_name, customer_phone, customer_email,
       shipping_method, shipping_address, subtotal_twd, shipping_fee_twd, total_twd,
       payment_method, payment_status, order_status, tax_id, invoice_title, note, created_at,
       order_items ( id, product_name_zh, variant_label_zh, unit_price_twd, quantity, line_total_twd )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("後台讀取訂單失敗：", error.message);
    return null;
  }

  const items = (data.order_items ?? []) as Record<string, unknown>[];

  return {
    id: String(data.id),
    orderNumber: String(data.order_number),
    customerName: String(data.customer_name),
    customerPhone: String(data.customer_phone),
    customerEmail: String(data.customer_email),
    shippingMethod: String(data.shipping_method),
    shippingAddress: String(data.shipping_address),
    subtotalTwd: Number(data.subtotal_twd),
    shippingFeeTwd: Number(data.shipping_fee_twd),
    totalTwd: Number(data.total_twd),
    paymentMethod: String(data.payment_method),
    paymentStatus: String(data.payment_status),
    orderStatus: toStatus(data.order_status),
    taxId: (data.tax_id as string | null) ?? null,
    invoiceTitle: (data.invoice_title as string | null) ?? null,
    note: (data.note as string | null) ?? null,
    createdAt: String(data.created_at),
    items: items.map((item) => ({
      id: String(item.id),
      productName: String(item.product_name_zh),
      label: String(item.variant_label_zh),
      unitPriceTwd: Number(item.unit_price_twd),
      quantity: Number(item.quantity),
      lineTotalTwd: Number(item.line_total_twd),
    })),
  };
}

/**
 * 改訂單狀態。
 *
 * 「已付款」與「訂單狀態」是兩件事，但實務上一起動比較不會出錯：
 * 標成已付款以上的狀態時，付款狀態就跟著變成已付款。
 * 業主不需要記得按兩次。
 */
export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const paymentStatus =
    status === "paid" || status === "shipped" || status === "completed"
      ? "paid"
      : "unpaid";

  const { error } = await db
    .from("orders")
    .update({ order_status: status, payment_status: paymentStatus })
    .eq("id", id);

  if (error) {
    console.error("後台更新訂單狀態失敗：", error.message);
    return false;
  }
  return true;
}

/** 台灣時間的「8/17 14:30」 */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
