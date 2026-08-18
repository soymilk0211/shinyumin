"use client";

import { useState } from "react";
import { ObfuscatedContact } from "@/components/obfuscated-contact";
import { OrderCard } from "@/components/order-card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicOrder } from "@/lib/order-lookup";

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

export function OrderLookup({ labels }: { labels: Labels }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);





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
        setOrder(result.order as PublicOrder);
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

          <div className="mt-6">
            <OrderCard order={order} labels={labels} />
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
