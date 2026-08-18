import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicOrder } from "@/lib/order-lookup";
import { formatPrice } from "@/lib/products";

/**
 * 一張訂單給客人看的樣子。
 *
 * 兩個地方共用：訪客用編號查到的那一張，以及會員登入後的訂單清單。
 * 兩邊看到的內容【刻意完全一樣】—— 都沒有地址、email 與完整電話。
 * 客人自己知道那些，畫面上不需要再放一次；萬一被別人看到，也少洩漏一樣。
 *
 * 這個檔案沒有 "use client"，所以伺服器端與瀏覽器端都用得上。
 */

type Labels = Dictionary["orderLookup"];

function statusText(status: string, labels: Labels) {
  switch (status) {
    case "paid":
      return labels.statusPaid;
    case "shipped":
      return labels.statusShipped;
    case "completed":
      return labels.statusCompleted;
    case "cancelled":
      return labels.statusCancelled;
    default:
      return labels.statusPendingPayment;
  }
}

function paymentText(method: string, labels: Labels) {
  return method === "cod" ? labels.paymentCod : labels.paymentTransfer;
}

function shippingText(method: string, labels: Labels) {
  if (method === "tcat") return labels.shippingTcat;
  if (method === "post_outlying") return labels.shippingPostOutlying;
  return labels.shippingPost;
}

/** 台灣時間的「2026/8/18 08:18」 */
function orderedAt(iso: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function OrderCard({
  order,
  labels,
}: {
  order: PublicOrder;
  labels: Labels;
}) {
  return (
    <article className="border-t border-line pt-8">
      <p className="font-display text-[clamp(1.3rem,3.6vw,1.8rem)] tracking-[0.04em] text-ink tabular-nums">
        {order.orderNumber}
      </p>

      <p className="mt-3 text-[15px] tracking-[0.06em] text-brand">
        {statusText(order.status, labels)}
      </p>
      <p className="mt-2 text-[12px] tracking-[0.06em] text-ink-faint tabular-nums">
        {labels.orderedAt}　{orderedAt(order.createdAt)}
      </p>

      <ul className="mt-8">
        {order.items.map((item, index) => (
          <li key={index} className="border-t border-line py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-display text-base text-ink">
                {item.productName}
              </span>
              <span className="font-display text-base text-ink tabular-nums">
                {formatPrice(item.lineTotalTwd)}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] tracking-[0.06em] text-ink-soft">
              {item.label}
              <span className="ml-3 tabular-nums">× {item.quantity}</span>
            </p>
          </li>
        ))}
        <li className="border-t border-line" />
      </ul>

      <dl className="mt-5 space-y-2.5 text-[12px] tracking-[0.06em]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">{labels.subtotal}</dt>
          <dd className="text-ink tabular-nums">
            {formatPrice(order.subtotalTwd)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">
            {labels.shippingFee}
            <span className="ml-2 text-ink-faint">
              {shippingText(order.shippingMethod, labels)}
            </span>
          </dt>
          <dd className="text-ink tabular-nums">
            {order.shippingFeeTwd === 0
              ? labels.free
              : formatPrice(order.shippingFeeTwd)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">{labels.paymentLabel}</dt>
          <dd className="text-ink">
            {paymentText(order.paymentMethod, labels)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
        <span className="label text-ink-faint">{labels.total}</span>
        <span className="font-display text-2xl text-ink tabular-nums">
          {formatPrice(order.totalTwd)}
        </span>
      </div>
    </article>
  );
}
