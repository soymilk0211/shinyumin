import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import { isSignedIn } from "@/lib/admin-auth";
import {
  formatTime,
  getOrder,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  SHIPPING_METHOD_LABEL,
  type OrderStatus,
} from "@/lib/admin-orders";

/**
 * 一張訂單的完整內容，以及可以對它做的事。
 *
 * 【下一步只給一個按鈕。】待付款的訂單就只出現「標記已付款」，
 * 出貨過的就只出現「標記已完成」。全部狀態都列出來看起來很自由，
 * 但站在店裡單手操作時，選項越少越不會按錯。
 */

export const dynamic = "force-dynamic";

/** 每個狀態的下一步 */
const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> =
  {
    pending_payment: { status: "paid", label: "標記已付款" },
    paid: { status: "shipped", label: "標記已出貨" },
    shipped: { status: "completed", label: "標記已完成" },
  };

function money(twd: number) {
  return `NT$ ${twd.toLocaleString("zh-TW")}`;
}

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  if (!(await isSignedIn())) redirect("/admin/login");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const next = NEXT_STEP[order.orderStatus];

  return (
    <main>
      <Link
        href="/admin"
        className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
      >
        ← 回訂單列表
      </Link>

      <h1 className="mt-6 text-2xl tabular-nums">{order.orderNumber}</h1>
      <p className="mt-2 text-[14px] text-ink-faint tabular-nums">
        {formatTime(order.createdAt)}　{ORDER_STATUS_LABEL[order.orderStatus]}
      </p>

      {/* ── 買了什麼 ── */}
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[13px] text-ink-faint">品項</h2>
        <ul className="mt-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2">
              <span className="text-[15px] text-ink">
                {item.productName}
                <span className="ml-2 text-[13px] text-ink-soft">
                  {item.label}
                </span>
                <span className="ml-2 text-[13px] text-ink-faint tabular-nums">
                  × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-[15px] text-ink tabular-nums">
                {money(item.lineTotalTwd)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[14px]">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">商品</dt>
            <dd className="text-ink tabular-nums">{money(order.subtotalTwd)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">
              運費
              <span className="ml-2 text-ink-faint">
                {SHIPPING_METHOD_LABEL[order.shippingMethod] ??
                  order.shippingMethod}
              </span>
            </dt>
            <dd className="text-ink tabular-nums">
              {order.shippingFeeTwd === 0 ? "免運" : money(order.shippingFeeTwd)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 pt-2 text-[17px]">
            <dt className="text-ink">
              合計
              <span className="ml-2 text-[13px] text-ink-faint">
                {PAYMENT_METHOD_LABEL[order.paymentMethod] ??
                  order.paymentMethod}
              </span>
            </dt>
            <dd className="text-ink tabular-nums">{money(order.totalTwd)}</dd>
          </div>
        </dl>
      </section>

      {/* ── 寄給誰 ── */}
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[13px] text-ink-faint">收件</h2>
        <p className="mt-3 text-[16px] text-ink">{order.customerName}</p>

        {/* 手機上點一下就撥出去 —— 匯款的訂單一定要打這通電話 */}
        <p className="mt-2">
          <a
            href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}
            className="text-[16px] text-brand tabular-nums underline underline-offset-4"
          >
            {order.customerPhone}
          </a>
        </p>

        <p className="mt-3 text-[15px] leading-[1.8] text-ink">
          {order.shippingAddress}
        </p>
        <p className="mt-2 text-[14px] break-all text-ink-soft">
          {order.customerEmail}
        </p>

        {order.note && (
          <div className="mt-5 border-l-2 border-brand pl-4">
            <p className="text-[13px] text-ink-faint">備註</p>
            <p className="mt-1 text-[15px] leading-[1.8] text-ink">
              {order.note}
            </p>
          </div>
        )}

        {(order.taxId || order.invoiceTitle) && (
          <p className="mt-5 text-[14px] text-ink-soft">
            發票　統編 {order.taxId ?? "—"}／抬頭 {order.invoiceTitle ?? "—"}
          </p>
        )}
      </section>

      {/* ── 下一步 ── */}
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[13px] text-ink-faint">處理</h2>

        {next ? (
          <form action={updateOrderStatus} className="mt-4">
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value={next.status} />
            <button
              type="submit"
              className="w-full bg-brand px-4 py-4 text-[16px] text-brand-contrast transition-colors hover:bg-brand-strong"
            >
              {next.label}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-[15px] text-ink-soft">
            這張訂單已經
            {ORDER_STATUS_LABEL[order.orderStatus]}，沒有待辦的事。
          </p>
        )}

        {/* 取消與回上一步刻意做得不顯眼，避免手滑按到 */}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[13px]">
          {order.orderStatus !== "pending_payment" &&
            order.orderStatus !== "cancelled" && (
              <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value="pending_payment" />
                <button
                  type="submit"
                  className="text-ink-faint underline-offset-4 hover:text-brand hover:underline"
                >
                  改回待付款
                </button>
              </form>
            )}

          {order.orderStatus !== "cancelled" && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button
                type="submit"
                className="text-ink-faint underline-offset-4 hover:text-brand hover:underline"
              >
                取消這張訂單
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
