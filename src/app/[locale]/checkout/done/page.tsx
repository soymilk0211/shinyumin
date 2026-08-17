import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "@/components/arrow-link";
import { ObfuscatedContact } from "@/components/obfuscated-contact";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 訂單完成頁。
 *
 * 這一頁【不查資料庫】，只把網址上的訂單編號顯示出來。
 *
 * 為什麼不查：要查就得讓這一頁讀得到訂單，而訂單裡有顧客的姓名、電話、地址。
 * 只要有一個「用訂單編號就能查到訂單」的入口，別人把編號一個一個試過去
 * 就能撈走所有人的個資。編號只是給客人抄下來報號用的，
 * 不必、也不應該成為查詢的鑰匙。
 *
 * 所以這一頁上只有一組數字與一段說明，沒有任何顧客資料。
 */

export const dynamic = "force-dynamic";

/** 訂單編號長這樣：YM-20260817-0001 */
const ORDER_NUMBER = /^YM-\d{8}-\d{4}$/;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/done">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: getDictionary(locale).orderDone.title,
    robots: { index: false, follow: false },
  };
}

export default async function OrderDonePage({
  params,
  searchParams,
}: PageProps<"/[locale]/checkout/done">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  const { no } = await searchParams;
  const raw = Array.isArray(no) ? no[0] : no;
  // 只顯示形狀正確的編號。網址是客人改得動的，
  // 不能把上面的任何字原封不動印到畫面上。
  const orderNumber = raw && ORDER_NUMBER.test(raw) ? raw : null;

  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {dict.site.place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] text-ink">
            {dict.orderDone.title}
          </h1>

          <p className="mt-12 max-w-[40ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
            {dict.orderDone.lead}
          </p>

          {orderNumber ? (
            <>
              {/* 訂單編號。這是這一頁上唯一要客人記住的東西，
                  所以刻意做大、單獨占一塊，手機上一眼就看得到 */}
              <div className="mt-14 border-t border-line pt-10 sm:mt-20">
                <span className="label text-ink-faint">
                  {dict.orderDone.orderNumberLabel}
                </span>
                <p className="mt-5 font-display text-[clamp(1.7rem,5vw,3rem)] tracking-[0.04em] text-brand tabular-nums">
                  {orderNumber}
                </p>
                <p className="mt-6 max-w-[40ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
                  {dict.orderDone.keepNote}
                </p>
              </div>

              {/* 接下來會發生什麼事。
                  【匯款是客人打來，不是我們打過去】—— 業主 2026-08-18 的要求。
                  所以這一頁一定要把電話擺出來：客人剛下完單，
                  這是他唯一會看到「該打去哪」的地方。
                  這一頁不知道客人選了哪一種付款方式（網址上只有訂單編號），
                  所以兩種都寫，讓客人自己對號入座。 */}
              <div className="mt-16 max-w-[46ch] border-t border-line pt-10">
                <span className="label text-brand">
                  {dict.orderDone.transferTitle}
                </span>
                <p className="mt-4 text-[13px] leading-[2.1] tracking-[0.06em] text-ink">
                  {dict.orderDone.transferNote}
                </p>
              </div>

              <div className="mt-12 max-w-[46ch] border-t border-line pt-10">
                <span className="label text-ink-faint">
                  {dict.orderDone.codTitle}
                </span>
                <p className="mt-4 text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                  {dict.orderDone.codNote}
                </p>
              </div>

              {/* 【網站上不能自己改單，所以一定要講清楚要找誰。】
                  客人下完單才想到要改地址、要加一罐，這是最常見的事。
                  沒有寫的話他只會在網站上到處找一個不存在的按鈕。 */}
              <div className="mt-12 max-w-[46ch] border-t border-line pt-10">
                <span className="label text-ink-faint">
                  {dict.orderDone.changeTitle}
                </span>
                <p className="mt-4 text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                  {dict.orderDone.changeNote}
                </p>
              </div>

              {/* 電話只出現這一次。上面「匯款要來電」與「改單要來電」
                  都是指這一支 —— 放三個一模一樣的按鈕只會讓人以為是不同的號碼。 */}
              <div className="mt-12 max-w-[46ch] border-t border-line pt-10">
                <span className="label text-brand">
                  {dict.orderDone.contactTitle}
                </span>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] tracking-[0.06em]">
                  <ObfuscatedContact
                    kind="phone"
                    revealLabel={dict.orderDone.phoneHint}
                  />
                  <span className="text-ink-faint">
                    {dict.orderDone.serviceHours}
                  </span>
                </div>
              </div>

              <p className="mt-12 max-w-[46ch] text-[12px] leading-[2] tracking-[0.06em] text-ink-faint">
                {dict.orderDone.shipNote}
              </p>
            </>
          ) : (
            <p className="mt-14 max-w-[46ch] border-t border-line pt-10 text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
              {dict.orderDone.missing}
            </p>
          )}

          <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4">
            <ArrowLink href={`/${locale}/teas`}>
              {dict.orderDone.browse}
            </ArrowLink>
            <ArrowLink href={`/${locale}`} tone="ink">
              {dict.orderDone.backHome}
            </ArrowLink>
          </div>
        </div>
      </div>
    </div>
  );
}
