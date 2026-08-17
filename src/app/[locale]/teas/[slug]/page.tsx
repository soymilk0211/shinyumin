import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ArrowLink } from "@/components/arrow-link";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { ProductName } from "@/components/product-name";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProductBySlug } from "@/lib/products";

/**
 * 商品詳情。
 *
 * 一款茶的完整介紹，加上規格選擇器。
 * 內容全部來自資料庫；業主在後台改價或切售罄，這一頁會跟著變。
 */

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/teas/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const product = await getProductBySlug(slug, locale);
  if (!product) return {};

  return {
    title: product.name,
    description: product.tastingNotes ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/teas/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const product = await getProductBySlug(slug, locale);
  if (!product) notFound();

  return (
    <div className="overflow-x-clip px-6 pt-12 pb-28 sm:px-10 sm:pt-16 sm:pb-40">
      <ArrowLink href={`/${locale}/teas`} tone="ink">
        {dict.product.back}
      </ArrowLink>

      <div className="mt-12 sm:mt-16 sm:flex sm:items-start sm:gap-14">
        {/* 圖。上面是商品（罐裝），下面是茶乾特寫 ——
            買茶的人真正想看的是葉子長什麼樣子 */}
        <div className="sm:sticky sm:top-28 sm:w-[44%]">
          <ImagePlaceholder
            ratio="aspect-[4/5]"
            label={dict.common.imagePending}
          />

          <div className="mt-4 flex items-start gap-4">
            <span className="vertical label mt-1 shrink-0 text-ink-faint">
              {dict.product.dryLeaf}
            </span>
            <ImagePlaceholder
              ratio="aspect-[4/3]"
              className="flex-1"
              label={dict.common.imagePending}
            />
          </div>
        </div>

        {/* 內容 */}
        <div className="mt-12 sm:mt-0 sm:flex-1">
          {product.categoryName && (
            <span className="label text-brand">{product.categoryName}</span>
          )}

          <h1 className="display-xl mt-5 text-[clamp(1.9rem,4.6vw,3.25rem)] leading-[1.05] text-ink">
            <ProductName name={product.name} />
          </h1>

          {product.tastingNotes && (
            <>
              <p className="label mt-12 text-ink-faint">
                {dict.product.tastingNotes}
              </p>
              <p className="mt-4 max-w-[40ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                {product.tastingNotes}
              </p>
            </>
          )}

          <AddToCart
            variants={product.variants}
            cartHref={`/${locale}/cart`}
            labels={{
              chooseSpec: dict.product.chooseSpec,
              quantity: dict.product.quantity,
              addToCart: dict.product.addToCart,
              added: dict.product.added,
              viewCart: dict.product.viewCart,
              soldOut: dict.product.soldOut,
              allSoldOut: dict.product.allSoldOut,
              decrease: dict.product.decrease,
              increase: dict.product.increase,
            }}
          />

          {product.description && (
            <section className="mt-20 border-t border-line pt-10">
              <h2 className="text-[clamp(1.35rem,3vw,2rem)] text-ink">
                {dict.product.aboutTea}
              </h2>
              {/* 資料庫裡的介紹文用空行分段，這裡照著拆成段落 */}
              <div className="mt-8 max-w-[42ch] space-y-6">
                {product.description
                  .split(/\n{2,}/)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft"
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
