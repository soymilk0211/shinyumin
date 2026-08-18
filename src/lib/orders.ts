import {
  shippingFeeTwd,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/order-rules";
import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 建立訂單。【這整個檔案只在伺服器上執行。】
 *
 * 這裡是整個網站最需要小心的地方，因為它牽涉到錢。一句話講完設計原則：
 *
 *   【瀏覽器只能告訴我們「要買哪個規格、幾件」，其餘一律由伺服器自己查、自己算。】
 *
 * 購物車存在客人的瀏覽器裡，稍微懂技術的人可以把 650 改成 1。
 * 所以送進來的資料裡【沒有價格這個欄位】—— 就算有，我們也不看。
 * 價格、小計、運費、總額全部重新查資料庫算一次。
 *
 * 這同時也解決了另一個現實問題：客人把東西放在購物車裡好幾天，
 * 期間業主調過價，結帳時算的會是最新的價格。
 */

/** 瀏覽器送過來的一個品項：只有規格 ID 與數量，沒有價格。 */
export type OrderDraftLine = {
  variantId: string;
  quantity: number;
};

export type OrderDraft = {
  lines: OrderDraftLine[];

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  shippingMethod: ShippingMethod;
  shippingAddress: string;

  paymentMethod: PaymentMethod;

  /**
   * 下單的會員帳號。【沒登入就是 null，那完全正常】——
   * 會員是選配的，訪客一樣買得到東西。
   */
  userId: string | null;

  /** 統一編號與發票抬頭都是選填。發票在外部系統人工開立，這裡只收集。 */
  taxId: string | null;
  invoiceTitle: string | null;
  note: string | null;
};

/** 訂單上的一個品項，金額都是伺服器算出來的 */
export type OrderItem = {
  productName: string;
  label: string;
  unitPriceTwd: number;
  quantity: number;
  lineTotalTwd: number;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderNumber: string;
      subtotalTwd: number;
      shippingFeeTwd: number;
      totalTwd: number;
      /** 給 LINE 通知與日後的確認信用。回給瀏覽器的內容不包含這一段。 */
      items: OrderItem[];
    }
  | {
      ok: false;
      /**
       * unavailable = 有品項已售罄或下架（客人放很久才回來結帳）
       * db          = 資料庫出問題，請客人稍後再試或直接來電
       */
      reason: "unavailable" | "db";
    };

/** 一張訂單最多幾種品項。正常人不會買 30 種以上，超過就是有人在灌資料。 */
const MAX_LINES = 30;
/** 單一品項的數量上限，與購物車的上限一致 */
const MAX_QUANTITY = 99;

type VariantRow = {
  id: string;
  label_zh: string;
  price_twd: number;
  status: string;
  products: { name_zh: string; is_published: boolean } | null;
};

export async function createOrder(
  draft: OrderDraft,
): Promise<CreateOrderResult> {
  const db = getAdminClient();
  if (!db) return { ok: false, reason: "db" };

  if (draft.lines.length === 0 || draft.lines.length > MAX_LINES) {
    return { ok: false, reason: "unavailable" };
  }

  // ── 一、重新查價 ───────────────────────────────────────
  // 這裡用的是萬能鑰匙，會繞過門禁，所以【已下架與未上架的要自己擋掉】——
  // 不能因為鑰匙比較大就少檢查。
  const { data, error } = await db
    .from("variants")
    .select("id, label_zh, price_twd, status, products ( name_zh, is_published )")
    .in(
      "id",
      draft.lines.map((line) => line.variantId),
    );

  if (error) {
    console.error("結帳查價失敗：", error.message);
    return { ok: false, reason: "db" };
  }

  const sellable = new Map<string, { name: string; label: string; price: number }>();
  for (const row of (data ?? []) as unknown as VariantRow[]) {
    // Supabase 的型別把關聯一律當成陣列，兩種形狀都要接得住
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product?.is_published) continue;
    if (row.status !== "on_sale") continue;

    sellable.set(String(row.id), {
      name: product.name_zh,
      label: row.label_zh,
      price: Number(row.price_twd),
    });
  }

  // 只要有一個品項買不到就整張退回，不自動幫客人刪。
  // 少寄一罐茶卻照收錢，比請客人回去改購物車嚴重得多。
  const items = [];
  for (const line of draft.lines) {
    const variant = sellable.get(line.variantId);
    if (!variant) return { ok: false, reason: "unavailable" };

    const quantity = Math.min(Math.max(1, Math.floor(line.quantity)), MAX_QUANTITY);
    items.push({
      variantId: line.variantId,
      productName: variant.name,
      label: variant.label,
      unitPrice: variant.price,
      quantity,
      lineTotal: variant.price * quantity,
    });
  }

  // ── 二、算錢 ───────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = shippingFeeTwd(draft.shippingMethod, subtotal);
  const total = subtotal + shippingFee;

  // ── 三、寫進資料庫 ─────────────────────────────────────
  // 訂單編號是「當天第幾張」，兩個人同時按送出有可能撞號。
  // 撞號時資料庫會擋下來（order_number 是唯一值），這裡就重取一次號碼再試。
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = await nextOrderNumber(db);

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: draft.customerName,
        customer_phone: draft.customerPhone,
        customer_email: draft.customerEmail,
        shipping_method: draft.shippingMethod,
        shipping_address: draft.shippingAddress,
        subtotal_twd: subtotal,
        shipping_fee_twd: shippingFee,
        total_twd: total,
        payment_method: draft.paymentMethod,
        payment_status: "unpaid",
        order_status: "pending_payment",
        user_id: draft.userId,
        tax_id: draft.taxId,
        invoice_title: draft.invoiceTitle,
        note: draft.note,
      })
      .select("id")
      .single();

    if (orderError) {
      // 23505 = 唯一值重複，也就是撞號。其餘錯誤沒有重試的意義。
      if (orderError.code === "23505") continue;
      console.error("寫入訂單失敗：", orderError.message);
      return { ok: false, reason: "db" };
    }

    const { error: itemsError } = await db.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        variant_id: item.variantId,
        // 【價格與名稱都存快照】——業主日後改價或改商品名稱，
        // 歷史訂單上的金額與品名不能跟著變。
        product_name_zh: item.productName,
        variant_label_zh: item.label,
        unit_price_twd: item.unitPrice,
        quantity: item.quantity,
        line_total_twd: item.lineTotal,
      })),
    );

    if (itemsError) {
      // 明細寫不進去，那張訂單就是壞的（有金額卻沒有品項）。
      // 把它刪掉，讓客人重送一次，不要留一張半殘的訂單給業主對帳。
      console.error("寫入訂單明細失敗：", itemsError.message);
      await db.from("orders").delete().eq("id", order.id);
      return { ok: false, reason: "db" };
    }

    return {
      ok: true,
      orderNumber,
      subtotalTwd: subtotal,
      shippingFeeTwd: shippingFee,
      totalTwd: total,
      items: items.map((item) => ({
        productName: item.productName,
        label: item.label,
        unitPriceTwd: item.unitPrice,
        quantity: item.quantity,
        lineTotalTwd: item.lineTotal,
      })),
    };
  }

  console.error("訂單編號連續撞號五次，放棄");
  return { ok: false, reason: "db" };
}

/**
 * 下一個訂單編號：`YM-YYYYMMDD-NNNN`，例 `YM-20260817-0001`。
 *
 * 日期一律用【台灣時間】算 —— 網站跑在國外的機房上，
 * 若用機器的時間，台灣半夜下的單會被算成前一天。
 */
async function nextOrderNumber(
  db: NonNullable<ReturnType<typeof getAdminClient>>,
): Promise<string> {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");

  const prefix = `YM-${today}-`;

  const { data } = await db
    .from("orders")
    .select("order_number")
    .like("order_number", `${prefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.order_number as string | undefined;
  const sequence = last ? Number(last.slice(prefix.length)) + 1 : 1;

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}
