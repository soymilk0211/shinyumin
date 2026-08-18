import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderLookup } from "@/components/order-lookup";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 查訂單。
 *
 * 【這一頁不查資料庫，也不接受網址參數。】所有查詢都是客人自己
 * 在表單上填、送到 `/api/order-lookup` 的。這樣就不會出現
 * 「把網址複製給別人，別人也看得到我的訂單」這種事。
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/orders">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: getDictionary(locale).orderLookup.title,
    robots: { index: false, follow: false },
  };
}

export default async function OrdersPage({
  params,
}: PageProps<"/[locale]/orders">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {dict.site.place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] text-ink">
            {dict.orderLookup.title}
          </h1>

          <div className="mt-14">
            <OrderLookup labels={dict.orderLookup} />
          </div>
        </div>
      </div>
    </div>
  );
}
