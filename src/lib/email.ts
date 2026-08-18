import type { OrderNotification } from "@/lib/line";

/**
 * 訂單存檔信。【伺服器端專用。】
 *
 * 訂單一成立就寄一封完整的紀錄到業主的信箱。
 *
 * 【這封信不是通知，是備份。】即時通知是 LINE 的工作。
 * 這封信要解決的是另一件事：**萬一 LINE 出問題怎麼辦** ——
 * 群組被誤刪、當月推播額度用完、手機換了沒登入回去。
 * 信箱是這些狀況下都還在的那一份紀錄，而且可以搜尋、可以翻很久以前的。
 *
 * 【所以它刻意寫得比 LINE 詳細】：LINE 是站在店裡看一眼就要懂，
 * 這封信是日後回頭查帳用的。
 *
 * ## 為什麼還不寄給顧客
 *
 * Resend 在網域驗證完成之前，**只准寄給帳號本人的信箱**。
 * 所以現在只有這封存檔信會通，寄給顧客的確認信要等 `yumintea.com.tw`
 * 付款啟用、在 Resend 驗證網域之後才能開。
 * 屆時只要多一次 sendMail 呼叫，這個檔案的結構不用改。
 */

const ENDPOINT = "https://api.resend.com/emails";

/**
 * 寄件人。
 *
 * 網域驗證完成之前只能用 Resend 提供的這個位址。
 * 驗證之後改成 `訂單通知 <orders@yumintea.com.tw>` 之類的即可。
 */
const FROM = "御茗訂單 <onboarding@resend.dev>";

/**
 * 收件人：業主的信箱。
 *
 * 【刻意留一個環境變數可以覆蓋。】日後想改寄到別的信箱（例如換成
 * 網域自己的 orders@），在 Vercel 加 ORDER_ARCHIVE_EMAIL 就好，不用改程式。
 */
function archiveAddress(): string {
  return process.env.ORDER_ARCHIVE_EMAIL || "tim78937@gmail.com";
}

const SHIPPING_LABEL: Record<string, string> = {
  tcat: "黑貓宅急便",
  post: "郵局",
  post_outlying: "離島郵局",
};

const PAYMENT_LABEL: Record<string, string> = {
  transfer: "匯款",
  cod: "貨到付款",
};

function money(twd: number) {
  return `NT$ ${twd.toLocaleString("zh-TW")}`;
}

/** 把可能含有 < > & 的顧客輸入變成安全的 HTML */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSubject(order: OrderNotification): string {
  return `【御茗】新訂單 ${order.orderNumber}　${money(order.totalTwd)}　${
    PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod
  }`;
}

/**
 * 信的內容。
 *
 * 【刻意用最樸素的 HTML。】沒有圖、沒有外部樣式、沒有排版框架 ——
 * 信箱軟體對 CSS 的支援亂七八糟，寫得越花越容易在某個信箱裡爛掉。
 * 這封信要的是十年後打開還讀得懂。
 */
function buildHtml(order: OrderNotification): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 12px 6px 0">${escapeHtml(item.productName)}</td>
          <td style="padding:6px 12px 6px 0">${escapeHtml(item.label)}</td>
          <td style="padding:6px 12px 6px 0;text-align:right">${item.quantity}</td>
          <td style="padding:6px 0;text-align:right">${money(item.lineTotalTwd)}</td>
        </tr>`,
    )
    .join("");

  const optional = (label: string, value: string | null) =>
    value ? `<p><strong>${label}</strong>：${escapeHtml(value)}</p>` : "";

  return `<div style="font-family:system-ui,'Noto Sans TC',sans-serif;font-size:15px;line-height:1.9;color:#201b14">
  <h2 style="font-size:19px;margin:0 0 4px">新訂單 ${order.orderNumber}</h2>
  <p style="margin:0 0 20px;color:#6b6253">這是自動寄出的存檔信，不需要回覆。</p>

  <table style="border-collapse:collapse;width:100%;max-width:520px">
    ${rows}
  </table>

  <hr style="border:none;border-top:1px solid #cbc2ac;margin:16px 0;max-width:520px">

  <p style="margin:0">商品　${money(order.subtotalTwd)}</p>
  <p style="margin:0">運費　${
    order.shippingFeeTwd === 0 ? "免運" : money(order.shippingFeeTwd)
  }（${SHIPPING_LABEL[order.shippingMethod] ?? order.shippingMethod}）</p>
  <p style="margin:4px 0 0;font-size:17px"><strong>合計　${money(order.totalTwd)}</strong></p>

  <p style="margin:16px 0 0"><strong>付款方式</strong>：${
    PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod
  }${
    order.paymentMethod === "transfer"
      ? "（客人會來電問匯款帳號）"
      : "（代收手續費另計）"
  }</p>

  <hr style="border:none;border-top:1px solid #cbc2ac;margin:16px 0;max-width:520px">

  <p style="margin:0"><strong>收件人</strong>：${escapeHtml(order.customerName)}</p>
  <p style="margin:0"><strong>電話</strong>：${escapeHtml(order.customerPhone)}</p>
  <p style="margin:0"><strong>地址</strong>：${escapeHtml(order.shippingAddress)}</p>
  <p style="margin:0"><strong>信箱</strong>：${escapeHtml(order.customerEmail)}</p>

  ${optional("備註", order.note)}
  ${optional("統一編號", order.taxId)}
  ${optional("發票抬頭", order.invoiceTitle)}

  <p style="margin:24px 0 0;color:#857b6a;font-size:13px">
    完整的訂單管理請到後台：https://shinyumin.vercel.app/admin
  </p>
</div>`;
}

/**
 * 寄出存檔信。
 *
 * 【永遠不會丟出例外。】跟 LINE 推播一樣 —— 訂單早就寫進資料庫了，
 * 寄不出去就是寄不出去，不該讓客人的訂單受影響。
 */
export async function sendOrderArchiveEmail(
  order: OrderNotification,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`存檔信略過（尚未設定 RESEND_API_KEY）：${order.orderNumber}`);
    return;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [archiveAddress()],
        subject: buildSubject(order),
        html: buildHtml(order),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(
        `存檔信寄送失敗（訂單 ${order.orderNumber}）：HTTP ${response.status} ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error(`存檔信寄送失敗（訂單 ${order.orderNumber}）：`, error);
  }
}
