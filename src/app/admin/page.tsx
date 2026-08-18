import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { isSignedIn } from "@/lib/admin-auth";
import {
  formatTime,
  listOrders,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type OrderStatus,
} from "@/lib/admin-orders";

/**
 * 訂單列表。後台的首頁。
 *
 * 【新的排在最上面】，而且待付款與已付款（＝還沒出貨的）用品牌色標出來，
 * 因為那些是「還要做事」的訂單。已完成的訂單只是紀錄，不需要跳出來。
 */

export const dynamic = "force-dynamic";

/** 還需要處理的狀態，會被標成品牌色 */
const NEEDS_ACTION: OrderStatus[] = ["pending_payment", "paid"];

export default async function AdminOrdersPage() {
  if (!(await isSignedIn())) redirect("/admin/login");

  const orders = await listOrders();

  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">訂單</h1>
        <div className="flex items-baseline gap-5">
          <Link
            href="/admin/products"
            className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
          >
            商品與價格
          </Link>
          <Link
            href="/admin/check"
            className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
          >
            系統檢查
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
            >
              登出
            </button>
          </form>
        </div>
      </div>

      {/* 一眼看完「還有幾張要處理」 */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-4 text-[14px]">
        <span className="text-ink-soft">
          待付款{" "}
          <strong className="font-normal text-ink tabular-nums">
            {counts.pending_payment ?? 0}
          </strong>
        </span>
        <span className="text-ink-soft">
          已付款{" "}
          <strong className="font-normal text-ink tabular-nums">
            {counts.paid ?? 0}
          </strong>
        </span>
        <span className="text-ink-soft">
          已出貨{" "}
          <strong className="font-normal text-ink tabular-nums">
            {counts.shipped ?? 0}
          </strong>
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-[15px] leading-[1.9] text-ink-soft">
          目前還沒有任何訂單。
        </p>
      ) : (
        <ul className="mt-2">
          {orders.map((order) => (
            <li key={order.id} className="border-b border-line">
              {/* 整列都可以點，手機上不用瞄準 */}
              <Link
                href={`/admin/orders/${order.id}`}
                className="block py-4 transition-colors hover:bg-surface"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[16px] text-ink">
                    {order.customerName}
                  </span>
                  <span className="text-[16px] text-ink tabular-nums">
                    NT$ {order.totalTwd.toLocaleString("zh-TW")}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
                  <span
                    className={
                      NEEDS_ACTION.includes(order.orderStatus)
                        ? "text-brand"
                        : "text-ink-faint"
                    }
                  >
                    {ORDER_STATUS_LABEL[order.orderStatus]}
                  </span>
                  <span className="text-ink-faint">
                    {PAYMENT_METHOD_LABEL[order.paymentMethod] ??
                      order.paymentMethod}
                  </span>
                  <span className="text-ink-faint tabular-nums">
                    {formatTime(order.createdAt)}
                  </span>
                  <span className="text-ink-faint tabular-nums">
                    {order.orderNumber}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
