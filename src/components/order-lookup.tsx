"use client";

import { useState } from "react";
import { ObfuscatedContact } from "@/components/obfuscated-contact";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/products";

/**
 * 客人查自己的訂單。
 *
 * 【這一頁不是會員系統。】沒有帳號、沒有密碼、不用註冊 ——
 * 只要「訂單編號 + 電話後四碼」兩樣同時對，就看得到那張訂單。
 *
 * 為什麼這樣就夠：客人真正想知道的是「我的茶寄了沒」，
 * 不是想要一個帳號。做成帳號反而要他記密碼、忘記了還要能重設，
 * 而重設密碼要寄信 —— 那正是目前卡住的東西。
 *
 * 【看得到的東西刻意比後台少】—— 沒有地址、沒有 email、沒有完整電話。
 * 客人自己知道那些；萬一真的有人猜中四碼，這裡少放一樣就少洩漏一樣。
 */

type Labels = Dictionary["orderLookup"];

type FoundOrder = {
  orderNumber: string;
  createdAt: string;
  status: string;
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

export function OrderLookup({ labels }: { labels: Labels }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [order, setOrder] = useState<FoundOrder | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function statusText(status: string) {
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

  function paymentText(method: string) {
    return method === "cod" ? labels.paymentCod : labels.paymentTransfer;
  }

  function shippingText(method: string) {
    if (method === "tcat") return labels.shippingTcat;
    if (method === "post_outlying") return labels.shippingPostOutlying;
    return labels.shippingPost;
  }

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phoneLast4: phoneLast4.trim(),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        setError(
          result?.error === "rate_limited"
            ? labels.rateLimited
            : labels.notFound,
        );
      } else {
        setOrder(result.order as FoundOrder);
      }
    } catch {
      setError(labels.networkError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="max-w-[42ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
        {labels.lead}
      </p>

      <form onSubmit={handleSubmit} className="mt-12 max-w-md space-y-8">
        <div>
          <label htmlFor="orderNumber" className="label block text-ink-faint">
            {labels.orderNumber}
          </label>
          <input
            id="orderNumber"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="YM-20260818-0001"
            autoComplete="off"
            className="mt-3 w-full border-b border-line bg-transparent py-2.5 text-[15px] tracking-[0.04em] text-ink transition-colors placeholder:text-ink-faint focus:border-brand"
          />
          <p className="mt-2 text-[12px] leading-[1.9] tracking-[0.06em] text-ink-faint">
            {labels.orderNumberHint}
          </p>
        </div>

        <div>
          <label htmlFor="phoneLast4" className="label block text-ink-faint">
            {labels.phoneLast4}
          </label>
          <input
            id="phoneLast4"
            value={phoneLast4}
            onChange={(event) => setPhoneLast4(event.target.value)}
            inputMode="numeric"
            maxLength={4}
            placeholder="5678"
            autoComplete="off"
            className="mt-3 w-full border-b border-line bg-transparent py-2.5 text-[15px] tracking-[0.2em] text-ink tabular-nums transition-colors placeholder:text-ink-faint focus:border-brand"
          />
          <p className="mt-2 text-[12px] leading-[1.9] tracking-[0.06em] text-ink-faint">
            {labels.phoneLast4Hint}
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="link-rule label group text-brand transition-colors hover:text-brand-strong disabled:cursor-not-allowed disabled:text-ink-faint"
        >
          <span>{sending ? labels.submitting : labels.submit}</span>
          <svg
            viewBox="0 0 32 8"
            className="h-2 w-8 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            aria-hidden="true"
          >
            <path d="M0 4h30M26 1l4 3-4 3" />
          </svg>
        </button>
      </form>

      {error && (
        <p className="mt-10 max-w-[42ch] text-[13px] leading-[2] tracking-[0.06em] text-brand">
          {error}
        </p>
      )}

      {order && (
        <section className="mt-16 max-w-xl border-t border-line pt-10">
          <span className="label text-ink-faint">{labels.resultTitle}</span>

          <p className="mt-5 font-display text-[clamp(1.4rem,4vw,2rem)] tracking-[0.04em] text-ink tabular-nums">
            {order.orderNumber}
          </p>

          <p className="mt-4 text-[15px] tracking-[0.06em] text-brand">
            {statusText(order.status)}
          </p>
          <p className="mt-2 text-[12px] tracking-[0.06em] text-ink-faint tabular-nums">
            {labels.orderedAt}　{orderedAt(order.createdAt)}
          </p>

          <ul className="mt-10">
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

          <dl className="mt-6 space-y-3 text-[12px] tracking-[0.06em]">
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
                  {shippingText(order.shippingMethod)}
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
              <dd className="text-ink">{paymentText(order.paymentMethod)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-6">
            <span className="label text-ink-faint">{labels.total}</span>
            <span className="font-display text-2xl text-ink tabular-nums">
              {formatPrice(order.totalTwd)}
            </span>
          </div>

          {/* 客人查完訂單，下一個念頭常常是「我要改地址」。
              直接把該打的電話放在這裡，不要讓他再去找。 */}
          <div className="mt-12 border-t border-line pt-10">
            <p className="max-w-[42ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
              {labels.changeNote}
            </p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] tracking-[0.06em]">
              <ObfuscatedContact kind="phone" revealLabel={labels.phoneHint} />
              <span className="text-ink-faint">{labels.serviceHours}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
