import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteMemberAccount,
  requestCode,
  signOutMember,
  submitCode,
} from "@/app/[locale]/account/actions";
import { OrderCard } from "@/components/order-card";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getMember } from "@/lib/member-auth";
import { listMemberOrders } from "@/lib/member-orders";

/**
 * 會員頁。
 *
 * 【一頁做完三件事】：沒登入時是登入表單，登入後是訂單清單加刪除帳號。
 * 分成三頁只會讓客人在手機上找不到東西。
 *
 * 表單全部是最原始的那一種（送出後整頁換掉），沒有用到瀏覽器端的程式 ——
 * 訊號不好的地方也一定按得動。
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: getDictionary(locale).account.title,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.account;

  const query = await searchParams;
  const one = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const error = one(query.error);
  const sent = one(query.sent) === "1";
  const deleted = one(query.deleted) === "1";
  const sentEmail = one(query.email) ?? "";

  const member = await getMember();
  const orders = member ? await listMemberOrders(member.userId) : [];

  const errorText =
    error === "email"
      ? t.errorEmail
      : error === "code"
        ? t.errorCode
        : error === "slow"
          ? t.errorSlow
          : error === "confirm"
            ? t.errorConfirm
            : "";

  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {dict.site.place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] text-ink">
            {t.title}
          </h1>

          <p className="mt-12 max-w-[44ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
            {t.lead}
          </p>

          {deleted && (
            <p className="mt-10 max-w-[44ch] border-t border-line pt-8 text-[13px] leading-[2.1] tracking-[0.06em] text-brand">
              {t.deletedNote}
            </p>
          )}

          {errorText && (
            <p className="mt-10 max-w-[44ch] text-[13px] leading-[2] tracking-[0.06em] text-brand">
              {errorText}
            </p>
          )}

          {member ? (
            <>
              {/* ── 已登入 ── */}
              <div className="mt-14 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-line pt-8">
                <div>
                  <span className="label text-ink-faint">{t.signedInAs}</span>
                  <p className="mt-2 text-[14px] break-all text-ink">
                    {member.email}
                  </p>
                </div>
                <form action={signOutMember}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="label text-ink-faint underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    {t.signOut}
                  </button>
                </form>
              </div>

              <section className="mt-16">
                <h2 className="label text-ink-faint">{t.ordersTitle}</h2>

                {orders.length === 0 ? (
                  <p className="mt-6 max-w-[44ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                    {t.noOrders}
                  </p>
                ) : (
                  <div className="mt-6 space-y-10">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.orderNumber}
                        order={order}
                        labels={dict.orderLookup}
                      />
                    ))}
                  </div>
                )}

                <p className="mt-10 max-w-[44ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
                  {t.guestNote}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/${locale}/orders`}
                    className="link-rule label text-brand transition-colors hover:text-brand-strong"
                  >
                    {t.lookupLink}
                  </Link>
                </div>
              </section>

              {/* ── 刪除帳號 ──
                  做在最下面、而且要打字確認。這是不可逆的動作，
                  在手機上一個按鈕就能按掉太危險。 */}
              <section className="mt-20 border-t border-line pt-10">
                <h2 className="label text-brand">{t.deleteTitle}</h2>
                <p className="mt-5 max-w-[46ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                  {t.deleteNote}
                </p>
                <p className="mt-4 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
                  {t.deleteKeepNote}
                </p>

                <form action={deleteMemberAccount} className="mt-8 max-w-sm">
                  <input type="hidden" name="locale" value={locale} />
                  <label
                    htmlFor="confirm"
                    className="label block text-ink-faint"
                  >
                    {t.deleteConfirmLabel}
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    autoComplete="off"
                    className="mt-3 w-full border-b border-line bg-transparent py-2.5 text-[15px] tracking-[0.1em] text-ink transition-colors focus:border-brand"
                  />
                  <button
                    type="submit"
                    className="label mt-8 border border-brand px-5 py-3 text-brand transition-colors hover:bg-brand hover:text-brand-contrast"
                  >
                    {t.deleteButton}
                  </button>
                </form>
              </section>
            </>
          ) : sent ? (
            <>
              {/* ── 驗證碼寄出，等填碼 ── */}
              <section className="mt-14 max-w-md border-t border-line pt-10">
                <span className="label text-brand">{t.codeSentTitle}</span>
                <p className="mt-5 text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                  {t.codeSentNote}
                </p>
                <p className="mt-3 text-[13px] break-all text-ink">
                  {sentEmail}
                </p>

                <form action={submitCode} className="mt-10">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="email" value={sentEmail} />
                  <label htmlFor="code" className="label block text-ink-faint">
                    {t.codeLabel}
                  </label>
                  <input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    maxLength={12}
                    autoComplete="one-time-code"
                    autoFocus
                    className="mt-3 w-full border-b border-line bg-transparent py-2.5 text-[20px] tracking-[0.4em] text-ink tabular-nums transition-colors focus:border-brand"
                  />
                  <button
                    type="submit"
                    className="link-rule label mt-8 text-brand transition-colors hover:text-brand-strong"
                  >
                    {t.submitCode}
                  </button>
                </form>

                <div className="mt-10">
                  <Link
                    href={`/${locale}/account`}
                    className="label text-ink-faint underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    {t.useAnotherEmail}
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* ── 還沒登入 ── */}
              <section className="mt-14 max-w-md border-t border-line pt-10">
                <form action={requestCode}>
                  <input type="hidden" name="locale" value={locale} />
                  <label htmlFor="email" className="label block text-ink-faint">
                    {t.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="mt-3 w-full border-b border-line bg-transparent py-2.5 text-[15px] tracking-[0.04em] text-ink transition-colors focus:border-brand"
                  />
                  <p className="mt-3 text-[12px] leading-[1.9] tracking-[0.06em] text-ink-faint">
                    {t.emailHint}
                  </p>
                  <button
                    type="submit"
                    className="link-rule label mt-8 text-brand transition-colors hover:text-brand-strong"
                  >
                    {t.requestCode}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
