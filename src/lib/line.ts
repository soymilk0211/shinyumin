import { createHmac, timingSafeEqual } from "node:crypto";
import type { OrderItem } from "@/lib/orders";
import type { PaymentMethod, ShippingMethod } from "@/lib/order-rules";

/**
 * LINE 訂單通知。【伺服器端專用。】
 *
 * 訂單一成立就推一則訊息到「御茗內部通知」的 LINE 群組。
 *
 * 【純模板，不經過 AI。】這是刻意的決定：這則訊息要的是
 * 快、數字正確、必定送達。AI 會帶來延遲、把數字寫錯的風險，
 * 以及多一個會壞掉的環節 —— 而這裡沒有任何需要「動腦」的事。
 *
 * 【推播失敗不會影響訂單。】訂單早就寫進資料庫了，
 * LINE 只是提醒。網路不順、Token 過期都不該讓客人的訂單消失。
 */

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

/** LINE 一則文字訊息的上限是 5000 字，留一點餘裕 */
const MAX_TEXT_LENGTH = 4800;

const SHIPPING_LABEL: Record<ShippingMethod, string> = {
  tcat: "黑貓宅急便",
  post: "郵局",
  post_outlying: "離島郵局",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transfer: "匯款",
  cod: "貨到付款",
};

function money(twd: number) {
  return `NT$ ${twd.toLocaleString("zh-TW")}`;
}

export type OrderNotification = {
  orderNumber: string;
  items: OrderItem[];
  subtotalTwd: number;
  shippingFeeTwd: number;
  totalTwd: number;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  taxId: string | null;
  invoiceTitle: string | null;
  note: string | null;
};

/**
 * 組出要推到群組的那則訊息。
 *
 * 排版是為了【在手機上一眼看完】設計的：訂單編號放最上面（要報號），
 * 金額集中在中間一區，要打電話的資訊放下面。
 */
export function buildOrderMessage(order: OrderNotification): string {
  const lines: string[] = [];

  lines.push("🍵 新訂單");
  lines.push(order.orderNumber);
  lines.push("");

  for (const item of order.items) {
    lines.push(`${item.productName}`);
    lines.push(
      `　${item.label} × ${item.quantity}　${money(item.lineTotalTwd)}`,
    );
  }

  lines.push("");
  lines.push("──────────");
  lines.push(`商品　${money(order.subtotalTwd)}`);
  lines.push(
    `運費　${order.shippingFeeTwd === 0 ? "免運" : money(order.shippingFeeTwd)}（${SHIPPING_LABEL[order.shippingMethod]}）`,
  );
  lines.push(`合計　${money(order.totalTwd)}`);
  lines.push("──────────");
  lines.push("");

  lines.push(`付款　${PAYMENT_LABEL[order.paymentMethod]}`);
  if (order.paymentMethod === "cod") {
    lines.push("　　　代收手續費另計，出貨前記得算進去");
  } else {
    // 帳號不放在網站上，靠電話告知 —— 而且【是客人打來，不是我們打過去】
    // （業主 2026-08-18 的要求）。所以這一行不是叫老闆去打電話，
    // 是提醒他「這通電話會進來」。
    lines.push("　　　客人會來電問匯款帳號");
  }

  lines.push("");
  lines.push(`收件　${order.customerName}`);
  lines.push(`電話　${order.customerPhone}`);
  lines.push(`地址　${order.shippingAddress}`);
  lines.push(`信箱　${order.customerEmail}`);

  if (order.note) {
    lines.push("");
    lines.push(`備註　${order.note}`);
  }

  if (order.taxId || order.invoiceTitle) {
    lines.push("");
    lines.push(
      `發票　統編 ${order.taxId ?? "—"}／抬頭 ${order.invoiceTitle ?? "—"}`,
    );
  }

  const text = lines.join("\n");
  return text.length > MAX_TEXT_LENGTH
    ? `${text.slice(0, MAX_TEXT_LENGTH)}\n…（訊息過長已截斷，完整內容請看後台）`
    : text;
}

/** LINE 的設定齊了沒。缺任何一項就整個功能靜靜關掉，不影響結帳。 */
export function isLineConfigured(): boolean {
  return Boolean(
    process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_GROUP_ID,
  );
}

/**
 * 推播訂單通知。
 *
 * 【永遠不會丟出例外。】呼叫端不需要 try/catch ——
 * 通知失敗就是失敗，訂單不受影響，錯誤留在伺服器記錄裡。
 */
export async function notifyNewOrder(order: OrderNotification): Promise<void> {
  await pushText(buildOrderMessage(order), `訂單 ${order.orderNumber}`);
}

/**
 * 推一則純文字到群組。
 *
 * 【永遠不會丟出例外。】呼叫端不需要 try/catch ——
 * 推播失敗就是失敗，訂單與報表都不受影響，錯誤留在伺服器記錄裡。
 *
 * `what` 只是出錯時記錄用的說明，不會出現在訊息裡。
 */
export async function pushText(text: string, what: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    console.warn(
      `LINE 推播略過（尚未設定 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_GROUP_ID）：${what}`,
    );
    return;
  }

  try {
    const response = await fetch(PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: "text", text }],
      }),
      // LINE 掛掉時不要無限等待
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(
        `LINE 推播失敗（${what}）：HTTP ${response.status} ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error(`LINE 推播失敗（${what}）：`, error);
  }
}

/**
 * 驗證 LINE 送來的請求是不是真的來自 LINE。
 *
 * Webhook 的網址是公開的，任何人都打得到。LINE 會用頻道密鑰
 * 對整包內容算一組簽章放在標頭裡；我們用同一把密鑰重算一次，
 * 對得起來才處理。這是唯一能分辨「LINE 本人」與「路人」的方法。
 */
export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // 長度不同時 timingSafeEqual 會直接丟例外，所以先擋掉
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/** 用 replyToken 回一則訊息。用在 groupId 的擷取引導上。 */
export async function replyText(
  replyToken: string,
  text: string,
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  try {
    await fetch(REPLY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("LINE 回覆失敗：", error);
  }
}
