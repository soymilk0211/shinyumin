import { after } from "next/server";
import { notifyNewOrder } from "@/lib/line";
import { createOrder, type OrderDraftLine } from "@/lib/orders";
import { isPaymentMethod, isShippingMethod } from "@/lib/order-rules";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * 結帳。顧客按下「送出訂單」之後，資料就是送到這裡。
 *
 * 【為什麼要有這一支程式，而不是讓瀏覽器直接寫資料庫】
 *
 * 訂單裡有顧客的姓名、電話、地址，而且牽涉金額。
 * 瀏覽器裡的任何東西客人都改得動，所以：
 *   一、瀏覽器只能送「規格 ID + 數量」，價格一律由伺服器重查（見 orders.ts）
 *   二、訂單資料表對訪客【完全上鎖】，只有這支伺服器端程式碰得到
 *
 * 這支程式做三件事：擋濫用 → 檢查資料格式 → 交給 createOrder 建單。
 */

/** 同一個 IP 十分鐘內最多送幾張訂單 */
const ORDER_LIMIT = 5;
const ORDER_WINDOW_MS = 10 * 60 * 1000;

const MAX_LINES = 30;

export async function POST(request: Request) {
  // ── 擋濫用 ───────────────────────────────────────────
  const gate = rateLimit(
    `checkout:${clientIp(request)}`,
    ORDER_LIMIT,
    ORDER_WINDOW_MS,
  );
  if (!gate.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSeconds) },
      },
    );
  }

  // ── 檢查資料 ─────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const draft = parseDraft(body);
  if (!draft) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // ── 建單 ─────────────────────────────────────────────
  const result = await createOrder(draft);

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.reason },
      { status: result.reason === "unavailable" ? 409 : 500 },
    );
  }

  // ── 通知業主 ─────────────────────────────────────────
  // 【放在回應之後才跑。】訂單已經寫進資料庫了，客人不需要等 LINE。
  // 推播失敗也不會影響這張訂單 —— notifyNewOrder 自己吞掉所有錯誤。
  after(() =>
    notifyNewOrder({
      orderNumber: result.orderNumber,
      items: result.items,
      subtotalTwd: result.subtotalTwd,
      shippingFeeTwd: result.shippingFeeTwd,
      totalTwd: result.totalTwd,
      shippingMethod: draft.shippingMethod,
      paymentMethod: draft.paymentMethod,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      customerEmail: draft.customerEmail,
      shippingAddress: draft.shippingAddress,
      taxId: draft.taxId,
      invoiceTitle: draft.invoiceTitle,
      note: draft.note,
    }),
  );

  return Response.json({
    ok: true,
    orderNumber: result.orderNumber,
    subtotalTwd: result.subtotalTwd,
    shippingFeeTwd: result.shippingFeeTwd,
    totalTwd: result.totalTwd,
  });
}

/**
 * 把送進來的資料檢查一遍，順便修剪空白。
 * 有任何一項不合格就整包退回 —— 這裡不猜客人的意思。
 *
 * 注意這裡【只檢查格式】。金額完全不看，就算對方硬塞一個 price 欄位進來，
 * 這支程式也不會讀它。
 */
function parseDraft(body: unknown) {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;

  // 品項
  if (!Array.isArray(raw.lines)) return null;
  if (raw.lines.length === 0 || raw.lines.length > MAX_LINES) return null;

  const lines: OrderDraftLine[] = [];
  for (const entry of raw.lines) {
    if (typeof entry !== "object" || entry === null) return null;
    const line = entry as Record<string, unknown>;
    const variantId = typeof line.variantId === "string" ? line.variantId : "";
    const quantity = Number(line.quantity);

    // 規格 ID 是資料庫產生的 UUID，長度固定。順手擋掉亂塞的字串。
    if (!/^[0-9a-fA-F-]{36}$/.test(variantId)) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;

    lines.push({ variantId, quantity });
  }

  // 同一個規格重複出現就合併，避免同一罐茶在訂單上列兩行
  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.quantity);
  }

  // 聯絡資料
  const customerName = text(raw.customerName, 1, 60);
  const customerPhone = text(raw.customerPhone, 8, 30);
  const customerEmail = text(raw.customerEmail, 5, 120);
  const shippingAddress = text(raw.shippingAddress, 6, 200);

  if (!customerName || !customerPhone || !customerEmail || !shippingAddress) {
    return null;
  }

  // 電話只看「數字夠不夠」。台灣有手機、市話、分機，格式管太嚴會擋到真客人。
  if ((customerPhone.match(/\d/g) ?? []).length < 8) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return null;

  if (!isShippingMethod(raw.shippingMethod)) return null;
  if (!isPaymentMethod(raw.paymentMethod)) return null;

  // 選填欄位。留空是允許的，但【填了就得填對】——
  // 超長或格式不符一律退回，不要自作主張把客人打的字丟掉。
  const taxId = optional(raw.taxId, 8);
  const invoiceTitle = optional(raw.invoiceTitle, 60);
  const note = optional(raw.note, 500);
  if (taxId === null || invoiceTitle === null || note === null) return null;
  if (taxId && !/^\d{8}$/.test(taxId)) return null;

  return {
    lines: [...merged].map(([variantId, quantity]) => ({ variantId, quantity })),
    customerName,
    customerPhone,
    customerEmail,
    shippingMethod: raw.shippingMethod,
    shippingAddress,
    paymentMethod: raw.paymentMethod,
    taxId: taxId || null,
    invoiceTitle: invoiceTitle || null,
    note: note || null,
  };
}

/** 必填欄位：修剪前後空白並檢查長度。不合格回傳空字串。 */
function text(value: unknown, min: number, max: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return "";
  return trimmed;
}

/** 選填欄位：沒填回傳空字串，填了但不合格回傳 null（代表整包退回）。 */
function optional(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return trimmed.length > max ? null : trimmed;
}
