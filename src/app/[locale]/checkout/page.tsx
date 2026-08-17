import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildCatalogue } from "@/lib/catalogue";
import { getProducts } from "@/lib/products";

/**
 * 結帳頁。
 *
 * 這一頁只負責兩件事：從資料庫拿一份「規格 ID → 名稱與價格」的對照表，
 * 以及把介面文字交給表單。真正的下單動作在 `/api/checkout`（伺服器端）。
 *
 * 【結帳頁不進搜尋引擎。】訂單流程的中間頁被搜尋到沒有意義，
 * 而且客人從搜尋結果直接跳進來只會看到一個空購物車。
 */

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: getDictionary(locale).checkout.title,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
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
            {dict.checkout.title}
          </h1>

          <div className="mt-14">
            <CheckoutForm
              catalogue={catalogue}
              locale={locale}
              labels={dict.checkout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
