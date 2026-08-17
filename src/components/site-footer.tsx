import { ObfuscatedEmail } from "@/components/obfuscated-email";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 頁尾。
 *
 * 排成書末版權頁（colophon）的樣子：巨大的品牌名壓在左下角當底，
 * 聯絡資訊用細線分隔、小字排在右側，不做成三等分的欄位。
 *
 * 這裡**只放公司對外公開的市話與信箱**，不放任何個人手機號碼
 * （見 HANDOVER 的隱私規則）。信箱經過防爬蟲處理。
 * 批發第一版不上線，所以只寫「大量訂購請電洽」。
 */
export function SiteFooter({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-line px-6 pt-16 pb-10 sm:px-10 sm:pt-24">
      <div className="flex flex-col gap-16 sm:flex-row sm:justify-between sm:gap-20">
        {/* 左：品牌名當作版面的重量 */}
        <div className="shrink-0">
          <div className="font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-none font-light text-ink">
            {dict.site.name}
          </div>
          <div className="label mt-5 text-ink-faint">{dict.site.nameLatin}</div>
          <div className="label mt-2 text-ink-faint">{dict.site.place}</div>
        </div>

        {/* 右：聯絡資訊，細線分欄 */}
        <div className="w-full max-w-md">
          <span className="label text-brand">{dict.footer.contactTitle}</span>

          <dl className="mt-6 text-[12px] tracking-[0.06em]">
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.address}
              </dt>
              <dd className="text-ink">
                南投縣魚池鄉大雁村山楂腳巷 10-20 號
              </dd>
            </div>
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.phone}
              </dt>
              <dd>
                <a
                  href="tel:+886492896602"
                  className="link-rule text-brand transition-colors hover:text-brand-strong"
                >
                  049-2896602
                </a>
              </dd>
            </div>
            <div className="flex gap-6 border-t border-line py-3.5">
              <dt className="w-16 shrink-0 text-ink-faint">
                {dict.footer.email}
              </dt>
              <dd>
                <ObfuscatedEmail revealLabel={dict.footer.emailHint} />
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
        </div>
      </div>

      <div className="label mt-20 text-ink-faint">
        © {year} {dict.site.nameFull}．{dict.footer.rights}
      </div>
    </footer>
  );
}
