import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/cart-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildCatalogue } from "@/lib/catalogue";
import { getProducts } from "@/lib/products";

/**
 * 購物車頁。
 *
 * 這一頁做的事有點特別：**購物車的內容在客人的瀏覽器裡，
 * 但名稱與價格必須從資料庫來。**
 *
 * 作法是伺服器先把目前所有在架的規格（名稱、包裝、價格）整理成一份對照表，
 * 送到瀏覽器；瀏覽器再拿購物車裡的規格 ID 去對照。
 *
 * 這樣即使客人把東西放了好幾天、期間業主調過價，回來看到的也是最新價格。
 */

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).cart.title };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const catalogue = buildCatalogue(await getProducts(locale));

  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {dict.site.place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] text-ink">
            {dict.cart.title}
          </h1>

          <div className="mt-14 max-w-2xl">
            <CartView
              catalogue={catalogue}
              locale={locale}
              labels={{
                empty: dict.cart.empty,
                browse: dict.cart.browse,
                remove: dict.cart.remove,
                subtotalLabel: dict.cart.subtotalLabel,
                shippingNote: dict.cart.shippingNote,
                priceNote: dict.cart.priceNote,
                checkout: dict.cart.checkout,
                unavailable: dict.cart.unavailable,
                quantity: dict.product.quantity,
                decrease: dict.product.decrease,
                increase: dict.product.increase,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
