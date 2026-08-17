"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/products";

/**
 * 購物車內容。
 *
 * 購物車本身只記「規格 ID + 數量」，所以名稱與價格是這一頁
 * 從資料庫查來的資料（catalogue）對照出來的 —— **不是存在購物車裡的**。
 *
 * 因此客人把東西放著好幾天、期間業主調過價，回來看到的會是最新價格。
 * 這裡算的小計只是「給客人看的預估」，真正的金額在結帳時由伺服器
 * 重新查資料庫計算（第 4 步）。
 */

export type CatalogueEntry = {
  productName: string;
  productSlug: string;
  label: string;
  priceTwd: number;
  available: boolean;
};

export function CartView({
  catalogue,
  locale,
  labels,
}: {
  catalogue: Record<string, CatalogueEntry>;
  locale: string;
  labels: {
    empty: string;
    browse: string;
    remove: string;
    subtotalLabel: string;
    shippingNote: string;
    priceNote: string;
    checkout: string;
    checkoutSoon: string;
    unavailable: string;
    quantity: string;
    decrease: string;
    increase: string;
  };
}) {
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  // 讀完 LocalStorage 之前先留白，避免先閃出「購物車是空的」
  if (!hydrated) return <div className="min-h-[40vh]" />;

  if (lines.length === 0) {
    return (
      <div className="min-h-[40vh]">
        <p className="text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
          {labels.empty}
        </p>
        <div className="mt-10">
          <Link
            href={`/${locale}/teas`}
            className="link-rule label text-brand transition-colors hover:text-brand-strong"
          >
            {labels.browse}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => {
    const entry = catalogue[line.variantId];
    return entry?.available ? sum + entry.priceTwd * line.quantity : sum;
  }, 0);

  return (
    <div>
      <ul>
        {lines.map((line) => {
          const entry = catalogue[line.variantId];

          return (
            <li
              key={line.variantId}
              className="border-t border-line py-7 sm:py-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
                <div className="min-w-0">
                  {entry ? (
                    <>
                      <Link
                        href={`/${locale}/teas/${entry.productSlug}`}
                        className="font-display text-xl text-ink transition-colors hover:text-brand"
                      >
                        {entry.productName}
                      </Link>
                      <p className="mt-2 text-[12px] tracking-[0.06em] text-ink-soft">
                        {entry.label}
                        {!entry.available && (
                          <span className="label ml-3 text-brand">
                            {labels.unavailable}
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="label text-brand">{labels.unavailable}</p>
                  )}
                </div>

                <div className="flex items-center gap-8">
                  {/* 數量 */}
                  <div className="flex items-center gap-4 border-b border-line pb-1.5">
                    <button
                      type="button"
                      aria-label={labels.decrease}
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity - 1)
                      }
                      className="text-ink-soft transition-colors hover:text-brand"
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-display text-base text-ink tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={labels.increase}
                      onClick={() =>
                        setQuantity(line.variantId, line.quantity + 1)
                      }
                      className="text-ink-soft transition-colors hover:text-brand"
                    >
                      ＋
                    </button>
                  </div>

                  {/* 小計 */}
                  <span className="w-24 text-right font-display text-lg text-ink tabular-nums">
                    {entry?.available
                      ? formatPrice(entry.priceTwd * line.quantity)
                      : "—"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(line.variantId)}
                className="label mt-4 text-ink-faint transition-colors hover:text-brand"
              >
                {labels.remove}
              </button>
            </li>
          );
        })}
        <li className="border-t border-line" />
      </ul>

      {/* 合計 */}
      <div className="mt-10 flex items-baseline justify-between gap-8">
        <span className="label text-ink-faint">{labels.subtotalLabel}</span>
        <span className="font-display text-2xl text-ink tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>

      <p className="mt-6 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-soft">
        {labels.shippingNote}
      </p>
      <p className="mt-3 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
        {labels.priceNote}
      </p>

      {/* 結帳在第 4 步才會開放 */}
      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-8">
        <span className="label text-ink-faint">{labels.checkout}</span>
        <span className="label text-brand">{labels.checkoutSoon}</span>
      </div>
    </div>
  );
}
