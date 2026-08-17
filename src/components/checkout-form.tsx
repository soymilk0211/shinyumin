"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CatalogueEntry } from "@/lib/catalogue";
import { useCart } from "@/lib/cart-store";
import {
  isFreeShippingEligible,
  SHIPPING_FEE_TWD,
  shippingFeeTwd,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/order-rules";
import { formatPrice } from "@/lib/products";

/**
 * 結帳表單。
 *
 * 【這一頁上的金額都只是「給客人看的預估」。】
 * 真正的金額是伺服器收到訂單之後，重新查一次資料庫算出來的（見 lib/orders.ts）。
 * 這裡送出去的資料裡沒有價格，只有「規格 ID + 數量」加上聯絡資料。
 *
 * 兩邊用的是同一支運費函式（lib/order-rules.ts），
 * 所以畫面上的預估與帳單不會對不起來。
 */

type Labels = Dictionary["checkout"];

const SHIPPING_ORDER: ShippingMethod[] = ["tcat", "post", "post_outlying"];
const PAYMENT_ORDER: PaymentMethod[] = ["transfer", "cod"];

export function CheckoutForm({
  catalogue,
  locale,
  labels,
}: {
  catalogue: Record<string, CatalogueEntry>;
  locale: string;
  labels: Labels;
}) {
  const router = useRouter();

  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [shipping, setShipping] = useState<ShippingMethod>("tcat");
  const [payment, setPayment] = useState<PaymentMethod>("transfer");
  const [taxId, setTaxId] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [note, setNote] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  /** idle = 還沒送出／sending = 送出中／done = 已成立，正在換頁 */
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  // 訂單送出後畫面會換到完成頁。這中間先留白，
  // 才不會因為購物車被清空而閃一下「購物車是空的」。
  if (status === "done") return <div className="min-h-[50vh]" />;

  // 讀完 LocalStorage 之前先留白
  if (!hydrated) return <div className="min-h-[50vh]" />;

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

  const entries = lines.map((line) => ({
    line,
    entry: catalogue[line.variantId] as CatalogueEntry | undefined,
  }));

  // 有品項在客人結帳的途中售罄或下架 —— 送不出去，請他回購物車處理。
  const hasUnavailable = entries.some(({ entry }) => !entry?.available);

  const subtotal = entries.reduce(
    (sum, { line, entry }) =>
      entry?.available ? sum + entry.priceTwd * line.quantity : sum,
    0,
  );
  const fee = shippingFeeTwd(shipping, subtotal);
  const total = subtotal + fee;

  function validate() {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = labels.fieldRequired;
    if (!phone.trim()) errors.phone = labels.fieldRequired;
    else if ((phone.match(/\d/g) ?? []).length < 8)
      errors.phone = labels.fieldPhone;

    if (!email.trim()) errors.email = labels.fieldRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = labels.fieldEmail;

    if (!address.trim()) errors.address = labels.fieldRequired;
    else if (address.trim().length < 6) errors.address = labels.fieldAddress;

    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim()))
      errors.taxId = labels.fieldTaxId;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    if (hasUnavailable) {
      setFormError(labels.errorUnavailable);
      return;
    }

    if (!validate()) {
      setFormError(labels.errorInvalid);
      return;
    }

    setFormError("");
    setStatus("sending");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 【只送規格 ID 與數量。】價格不在這裡面，伺服器會自己查。
          lines: lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim(),
          shippingMethod: shipping,
          shippingAddress: address.trim(),
          paymentMethod: payment,
          taxId: taxId.trim(),
          invoiceTitle: invoiceTitle.trim(),
          note: note.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        setStatus("idle");
        setFormError(
          result?.error === "unavailable"
            ? labels.errorUnavailable
            : result?.error === "rate_limited"
              ? labels.errorRateLimited
              : result?.error === "invalid"
                ? labels.errorInvalid
                : labels.errorServer,
        );
        return;
      }

      // 訂單成立才清空購物車。順序不能顛倒 ——
      // 萬一伺服器出問題，客人的購物車還要留著讓他重送。
      setStatus("done");
      clear();
      router.push(
        `/${locale}/checkout/done?no=${encodeURIComponent(result.orderNumber)}`,
      );
    } catch {
      setStatus("idle");
      setFormError(labels.errorNetwork);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="sm:flex sm:gap-14">
      {/* ── 訂單內容。手機上排在最前面，電腦上移到右邊並跟著捲動 ── */}
      <aside className="sm:order-last sm:w-[34%] sm:shrink-0">
        <div className="sm:sticky sm:top-28">
          <h2 className="label text-ink-faint">{labels.summaryTitle}</h2>

          <ul className="mt-6">
            {entries.map(({ line, entry }) => (
              <li key={line.variantId} className="border-t border-line py-4">
                {entry ? (
                  <>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-display text-base text-ink">
                        {entry.productName}
                      </span>
                      <span className="font-display text-base text-ink tabular-nums">
                        {entry.available
                          ? formatPrice(entry.priceTwd * line.quantity)
                          : "—"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] tracking-[0.06em] text-ink-soft">
                      {entry.label}
                      <span className="ml-3 tabular-nums">
                        {labels.quantityUnit === "×"
                          ? `× ${line.quantity}`
                          : `${line.quantity} ${labels.quantityUnit}`}
                      </span>
                    </p>
                    {!entry.available && (
                      <p className="label mt-2 text-brand">
                        {labels.lineUnavailable}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="label text-brand">{labels.lineUnavailable}</p>
                )}
              </li>
            ))}
            <li className="border-t border-line" />
          </ul>

          <dl className="mt-6 space-y-3 text-[12px] tracking-[0.06em]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">{labels.subtotal}</dt>
              <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">{labels.shippingFee}</dt>
              <dd className="tabular-nums text-ink">
                {fee === 0 ? labels.free : formatPrice(fee)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-6">
            <span className="label text-ink-faint">{labels.total}</span>
            <span className="font-display text-2xl text-ink tabular-nums">
              {formatPrice(total)}
            </span>
          </div>

          <p className="mt-5 text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
            {labels.freeShippingNote}
          </p>

          <div className="mt-6">
            <Link
              href={`/${locale}/cart`}
              className="link-rule label text-ink-faint transition-colors hover:text-brand"
            >
              {labels.backToCart}
            </Link>
          </div>
        </div>
      </aside>

      {/* ── 填寫欄位 ── */}
      <div className="mt-16 min-w-0 flex-1 sm:mt-0">
        {/* 收件資料 */}
        <section>
          <h2 className="label text-ink-faint">{labels.contactTitle}</h2>

          <div className="mt-8 space-y-8">
            <Field
              id="name"
              label={labels.name}
              value={name}
              onChange={setName}
              error={fieldErrors.name}
              autoComplete="name"
            />
            <Field
              id="phone"
              label={labels.phone}
              value={phone}
              onChange={setPhone}
              error={fieldErrors.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            <Field
              id="email"
              label={labels.email}
              value={email}
              onChange={setEmail}
              error={fieldErrors.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              hint={labels.emailHint}
            />
            <Field
              id="address"
              label={labels.address}
              value={address}
              onChange={setAddress}
              error={fieldErrors.address}
              autoComplete="street-address"
              hint={labels.addressHint}
            />
          </div>
        </section>

        {/* 出貨方式 */}
        <section className="mt-20">
          <h2 className="label text-ink-faint">{labels.shippingTitle}</h2>

          <div className="mt-6 flex flex-wrap gap-3">
            {SHIPPING_ORDER.map((method) => {
              const selected = shipping === method;
              const methodFee = shippingFeeTwd(method, subtotal);
              const isFree = methodFee === 0;

              return (
                <label
                  key={method}
                  className={`min-w-[9rem] flex-1 cursor-pointer border px-5 py-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-4 ${
                    selected
                      ? "border-brand text-brand"
                      : "border-line text-ink-soft hover:border-brand hover:text-brand"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={method}
                    checked={selected}
                    onChange={() => setShipping(method)}
                    className="sr-only"
                  />
                  <span className="block text-[13px] tracking-[0.06em]">
                    {method === "tcat"
                      ? labels.shippingTcat
                      : method === "post"
                        ? labels.shippingPost
                        : labels.shippingPostOutlying}
                  </span>
                  <span className="mt-1.5 block font-display text-base tabular-nums">
                    {isFree ? labels.free : formatPrice(SHIPPING_FEE_TWD[method])}
                  </span>
                  {!isFreeShippingEligible(method) && (
                    <span className="mt-1 block text-[11px] tracking-[0.1em] text-ink-faint">
                      {labels.shippingOutlyingHint}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {/* 付款方式 */}
        <section className="mt-20">
          <h2 className="label text-ink-faint">{labels.paymentTitle}</h2>

          <div className="mt-6 flex flex-wrap gap-3">
            {PAYMENT_ORDER.map((method) => {
              const selected = payment === method;
              return (
                <label
                  key={method}
                  className={`min-w-[9rem] flex-1 cursor-pointer border px-5 py-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-4 ${
                    selected
                      ? "border-brand text-brand"
                      : "border-line text-ink-soft hover:border-brand hover:text-brand"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={selected}
                    onChange={() => setPayment(method)}
                    className="sr-only"
                  />
                  <span className="block text-[13px] tracking-[0.06em]">
                    {method === "transfer"
                      ? labels.paymentTransfer
                      : labels.paymentCod}
                  </span>
                </label>
              );
            })}
          </div>

          {/* 【匯款帳號不出現在網站上】—— 訂單成立後由店家電話告知 */}
          <p className="mt-6 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-soft">
            {labels.paymentNote}
          </p>

          {/* 貨到付款的代收手續費由老闆另計，不寫進訂單金額。
              只有選了貨到付款才顯示 —— 選匯款的人不需要看到這件事。
              但【選了就一定要看到】：畫面上的總額不含這筆錢，
              不先講清楚，客人在門口收到帳單會覺得被多收。 */}
          {payment === "cod" && (
            <p className="mt-4 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-brand">
              {labels.paymentCodFee}
            </p>
          )}
        </section>

        {/* 發票（選填） */}
        <section className="mt-20">
          <h2 className="label text-ink-faint">
            {labels.invoiceTitle}
            <span className="ml-4 text-ink-faint">{labels.optional}</span>
          </h2>

          <div className="mt-8 space-y-8">
            <Field
              id="taxId"
              label={labels.taxId}
              value={taxId}
              onChange={setTaxId}
              error={fieldErrors.taxId}
              inputMode="numeric"
            />
            <Field
              id="invoiceTitle"
              label={labels.invoiceTitleField}
              value={invoiceTitle}
              onChange={setInvoiceTitle}
            />
          </div>

          <p className="mt-6 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
            {labels.invoiceNote}
          </p>
        </section>

        {/* 備註（選填） */}
        <section className="mt-20">
          <h2 className="label text-ink-faint">
            {labels.noteTitle}
            <span className="ml-4 text-ink-faint">{labels.optional}</span>
          </h2>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={labels.notePlaceholder}
            className="mt-6 w-full resize-none border-b border-line bg-transparent py-2.5 text-[14px] leading-[1.9] tracking-[0.04em] text-ink transition-colors placeholder:text-ink-faint focus:border-brand"
          />
        </section>

        {/* 出貨與退換貨 */}
        <section className="mt-20 border-t border-line pt-10">
          <h2 className="label text-ink-faint">{labels.policyTitle}</h2>
          <ul className="mt-6 max-w-[52ch] space-y-3">
            {labels.policy.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-[12px] leading-[2] tracking-[0.06em] text-ink-soft"
              >
                <span aria-hidden="true" className="text-ink-faint">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 送出 */}
        <div className="mt-16 border-t border-line pt-10">
          {/* 有品項買不到時，送出鈕會是停用的 ——
              一定要同時說明原因，否則客人只會看到一顆按不下去的按鈕 */}
          {(formError || hasUnavailable) && (
            <p className="mb-8 max-w-[46ch] text-[13px] leading-[2] tracking-[0.06em] text-brand">
              {formError || labels.errorUnavailable}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending" || hasUnavailable}
            className="link-rule label group text-brand transition-colors hover:text-brand-strong disabled:cursor-not-allowed disabled:text-ink-faint"
          >
            <span>
              {status === "sending" ? labels.submitting : labels.submit}
            </span>
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

          <p className="mt-8 text-[12px] tracking-[0.08em] text-ink-faint">
            {labels.serviceHours}
          </p>
        </div>
      </div>
    </form>
  );
}

/**
 * 一個輸入欄位。
 *
 * 刻意不用有外框的輸入盒 —— 這個網站的語彙是細線，
 * 所以欄位只有一條底線，聚焦時線變成品牌色。
 */
function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label block text-ink-faint">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`mt-3 w-full border-b bg-transparent py-2.5 text-[15px] tracking-[0.04em] text-ink transition-colors focus:border-brand ${
          error ? "border-brand" : "border-line"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[12px] tracking-[0.06em] text-brand">
          {error}
        </p>
      ) : (
        hint && (
          <p
            id={`${id}-hint`}
            className="mt-2 max-w-[46ch] text-[12px] leading-[1.9] tracking-[0.06em] text-ink-faint"
          >
            {hint}
          </p>
        )
      )}
    </div>
  );
}
