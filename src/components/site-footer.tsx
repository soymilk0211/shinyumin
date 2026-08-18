import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ObfuscatedContact } from "@/components/obfuscated-contact";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 頁尾。
 *
 * 排成書末版權頁（colophon）的樣子：巨大的品牌名壓在左下角當底，
 * 聯絡資訊用細線分隔、小字排在右側，不做成三等分的欄位。
 *
 * 電話與信箱都經過防爬蟲處理，原始碼裡不會出現完整號碼。
 *
 * 電話是老闆本人的手機，【經本人同意】公開 —— 這推翻了 HANDOVER 第 1 節
 * 原本「個人手機不上網站」的規則，見 CONTEXT.md 的隱私規則。
 * 批發第一版不上線，所以只寫「大量訂購請電洽」。
 */
export function SiteFooter({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-line px-6 pt-16 pb-10 sm:px-10 sm:pt-24">
      <div className="flex flex-col gap-16 sm:flex-row sm:justify-between sm:gap-20">
        {/* 左：商標當作版面的重量 */}
        <div className="shrink-0">
          <BrandLogo alt={dict.site.nameFull} className="h-16 w-auto sm:h-20" />
          {/* 頁尾用公司全名，不是簡稱 —— 這裡是網站上最正式的一塊 */}
          <div className="mt-7 font-display text-2xl tracking-[0.12em] text-ink sm:text-3xl">
            {dict.site.nameFull}
          </div>
          <div className="label mt-4 text-ink-faint">{dict.site.place}</div>
        </div>

        {/* 右：聯絡資訊，細線分欄 */}
        <div className="w-full max-w-md">
          <span className="label text-brand">{dict.footer.contactTitle}</span>

          <dl className="mt-6 text-[12px] tracking-[0.06em]">
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.address}
              </dt>
              <dd className="text-ink">南投縣魚池鄉大雁村山楂腳巷 10-20 號</dd>
            </div>
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.phone}
              </dt>
              <dd>
                <ObfuscatedContact
                  kind="phone"
                  revealLabel={dict.footer.phoneHint}
                />
              </dd>
            </div>
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.email}
              </dt>
              <dd>
                <ObfuscatedContact
                  kind="email"
                  revealLabel={dict.footer.emailHint}
                />
              </dd>
            </div>
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.taxId}
              </dt>
              <dd className="text-ink tabular-nums">27464360</dd>
            </div>
            <div className="border-t border-line" />
          </dl>

          <div className="mt-10">
            <span className="label text-ink-faint">
              {dict.footer.wholesaleTitle}
            </span>
            <p className="mt-3 text-[12px] leading-[2] tracking-[0.06em] text-ink-soft">
              {dict.footer.wholesaleBody}
            </p>
          </div>

          {/* 【禮盒是訂製的，網站上不賣。】但一定要寫出來 ——
              不寫的話，想買禮盒的客人根本不知道我們有這個東西。 */}
          <div className="mt-10">
            <span className="label text-ink-faint">
              {dict.footer.giftTitle}
            </span>
            <p className="mt-3 text-[12px] leading-[2] tracking-[0.06em] text-ink-soft">
              {dict.footer.giftBody}
            </p>
          </div>

          {/* 【查訂單要放在頁尾。】客人隔幾天回來想看進度，
              是從首頁進來的，不會留著當初那張完成頁的網址。

              退換貨與隱私權也放這裡 —— 這是大家習慣去找它們的地方，
              而且金流業者審核網站時也會看有沒有這兩頁。 */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            <Link
              href={`/${locale}/orders`}
              className="link-rule label text-brand transition-colors hover:text-brand-strong"
            >
              {dict.footer.trackOrder}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="link-rule label text-ink-faint transition-colors hover:text-brand"
            >
              {dict.account.title}
            </Link>
            <Link
              href={`/${locale}/returns`}
              className="link-rule label text-ink-faint transition-colors hover:text-brand"
            >
              {dict.returns.title}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="link-rule label text-ink-faint transition-colors hover:text-brand"
            >
              {dict.privacy.title}
            </Link>
          </div>
        </div>
      </div>

      <div className="label mt-20 text-ink-faint">
        © {year} {dict.site.nameFull}．{dict.footer.rights}
      </div>
    </footer>
  );
}
