"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatPrice, type Variant } from "@/lib/products";

/**
 * 規格選擇器 + 加入購物車。
 *
 * 【只有規格能被加入購物車】——「我要買紅玉」這句話還沒講完，
 * 沒說是 150g 還是 75g。所以這裡一定要先選一個包裝。
 *
 * 售罄的包裝【看得到但選不了】：客人知道有這個品項、只是暫時沒貨，
 * 比直接讓它消失更清楚。
 */
export function AddToCart({
  variants,
  cartHref,
  labels,
}: {
  variants: Variant[];
  cartHref: string;
  labels: {
    chooseSpec: string;
    quantity: string;
    addToCart: string;
    added: string;
    viewCart: string;
    soldOut: string;
    allSoldOut: string;
    decrease: string;
    increase: string;
  };
}) {
  const add = useCart((s) => s.add);

  const sellable = variants.filter((v) => v.status === "on_sale");
  const [selectedId, setSelectedId] = useState(sellable[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (sellable.length === 0) {
    return (
      <p className="mt-10 border-t border-line pt-6 text-[13px] leading-[2] tracking-[0.06em] text-ink-soft">
        {labels.allSoldOut}
      </p>
    );
  }

  function handleAdd() {
    if (!selectedId) return;
    add(selectedId, quantity);
    setJustAdded(true);
  }

  return (
    <div className="mt-12">
      {/* 包裝選擇。用細線方框，不用圓角按鈕 */}
      <span className="label text-ink-faint">{labels.chooseSpec}</span>
      <div className="mt-4 flex flex-wrap gap-3">
        {variants.map((variant) => {
          const soldOut = variant.status === "sold_out";
          const selected = variant.id === selectedId;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={soldOut}
              onClick={() => {
                setSelectedId(variant.id);
                setJustAdded(false);
              }}
              aria-pressed={selected}
              className={`border px-5 py-3 text-left text-[12px] tracking-[0.06em] transition-colors ${
                soldOut
                  ? "cursor-not-allowed border-line text-ink-faint"
                  : selected
                    ? "border-brand text-brand"
                    : "border-line text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              <span className="block">{variant.label}</span>
              <span
                className={`mt-1.5 block font-display text-base tabular-nums ${
                  soldOut ? "line-through" : ""
                }`}
              >
                {formatPrice(variant.priceTwd)}
              </span>
              {soldOut && (
                <span className="label mt-1 block">{labels.soldOut}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 數量 */}
      <div className="mt-10 flex items-center gap-6">
        <span className="label text-ink-faint">{labels.quantity}</span>
        <div className="flex items-center gap-5 border-b border-line pb-2">
          <button
            type="button"
            aria-label={labels.decrease}
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            className="text-lg text-ink-soft transition-colors hover:text-brand"
          >
            −
          </button>
          <span className="w-8 text-center font-display text-lg text-ink tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={labels.increase}
            onClick={() => setQuantity((n) => Math.min(99, n + 1))}
            className="text-lg text-ink-soft transition-colors hover:text-brand"
          >
            ＋
          </button>
        </div>
      </div>

      {/* 加入購物車 */}
      <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
        <button
          type="button"
          onClick={handleAdd}
          className="link-rule label group text-brand transition-colors hover:text-brand-strong"
        >
          <span>{labels.addToCart}</span>
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

        {justAdded && (
          <span className="label flex items-center gap-4 text-ink-soft">
            {labels.added}
            <Link
              href={cartHref}
              className="link-rule text-brand transition-colors hover:text-brand-strong"
            >
              {labels.viewCart}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
