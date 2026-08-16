import { ObfuscatedEmail } from "@/components/obfuscated-email";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 頁尾。
 *
 * 這裡放公司的正式聯絡資訊。**只放公司對外公開的市話與信箱**，
 * 不放任何個人手機號碼（見 HANDOVER 的隱私規則）。
 * 信箱經過防爬蟲處理，見 obfuscated-email.tsx。
 *
 * 批發第一版不上線，所以這裡只寫「大量訂購請電洽」。
 */
export function SiteFooter({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* 聯絡資訊 */}
          <section>
            <h2 className="font-display text-lg text-ink">
              {dict.footer.contactTitle}
            </h2>
            <dl className="mt-5 space-y-2.5 text-sm text-ink-soft">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-faint">
                  {dict.footer.address}
                </dt>
                <dd>南投縣魚池鄉大雁村山楂腳巷 10-20 號</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-faint">
                  {dict.footer.phone}
                </dt>
                <dd>
                  <a
                    href="tel:+886492896602"
                    className="text-brand underline underline-offset-4 transition-colors hover:text-brand-strong"
                  >
                    049-2896602
                  </a>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-faint">
                  {dict.footer.email}
                </dt>
                <dd>
                  <ObfuscatedEmail revealLabel={dict.footer.emailHint} />
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink-faint">
                  {dict.footer.taxId}
                </dt>
                <dd>27464360</dd>
              </div>
            </dl>
          </section>

          {/* 大量訂購 */}
          <section>
            <h2 className="font-display text-lg text-ink">
              {dict.footer.wholesaleTitle}
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
              {dict.footer.wholesaleBody}
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-ink-faint">
          © {year} {dict.site.nameFull}．{dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
