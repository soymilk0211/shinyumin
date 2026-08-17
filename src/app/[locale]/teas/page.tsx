import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLink } from "@/components/arrow-link";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice, getProducts, lowestPrice } from "@/lib/products";

/**
 * 茶品列表。
 *
 * 這一頁的內容【全部來自資料庫】，不是寫死的。
 * 業主日後在後台改價格、切售罄、上下架，這裡就會跟著變。
 *
 * 排版沿用全站的編輯式語彙：每一款茶佔一整段，圖與文字左右交錯，
 * 規格與價格用細線表格列出，不做成商品卡片格。
 */

// 每 60 秒重新向資料庫確認一次。
// 業主在後台改了價格，最慢一分鐘後網站就會顯示新價格；
// 平常則直接送出已經做好的頁面，開得快也不會一直打擾資料庫。
export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/teas">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).teas.title };
}

export default async function TeasPage({ params }: PageProps<"/[locale]/teas">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const products = await getProducts(locale);

  return (
    <div className="overflow-x-clip">
      {/* 標題 */}
      <section className="px-6 pt-14 pb-16 sm:px-10 sm:pt-20 sm:pb-24">
        <div className="flex gap-5 sm:gap-10">
          <span className="vertical label mt-1 shrink-0 text-ink-faint">
            {dict.site.place}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="display-xl text-[clamp(2.2rem,7vw,5rem)] text-ink">
              {dict.teas.title}
            </h1>
            <p className="mt-10 max-w-[34ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:ml-[12%]">
              {dict.teas.intro}
            </p>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <section className="border-t border-line px-6 py-24 sm:px-10 sm:py-32">
          <p className="label text-ink-faint">{dict.teas.empty}</p>
        </section>
      ) : (
        <ul>
          {products.map((product, index) => {
            const from = lowestPrice(product);
            const flip = index % 2 === 1; // 一左一右交錯

            return (
              <li
                key={product.id}
                className="border-t border-line px-6 py-20 sm:px-10 sm:py-28"
              >
                <div
                  className={`sm:flex sm:items-start sm:gap-12 ${
                    flip ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  <Link
                    href={`/${locale}/teas/${product.slug}`}
                    className="block sm:w-[42%]"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ImagePlaceholder
                      ratio="aspect-[4/5]"
                      label={dict.common.imagePending}
                    />
                  </Link>

                  <div className="mt-10 sm:mt-6 sm:flex-1">
                    {product.categoryName && (
                      <span className="label text-brand">
                        {product.categoryName}
                      </span>
                    )}

                    <h2 className="mt-5 text-[clamp(1.6rem,4vw,2.75rem)] leading-[1.1]">
                      <Link
                        href={`/${locale}/teas/${product.slug}`}
                        className="text-ink transition-colors hover:text-brand"
                      >
                        {product.name}
                      </Link>
                    </h2>

                    {from !== null && (
                      <p className="mt-4 font-display text-xl text-ink tabular-nums">
                        {formatPrice(from)}
                        <span className="label ml-2 text-ink-faint">
                          {dict.teas.fromPrice}
                        </span>
                      </p>
                    )}

                    {product.tastingNotes && (
                      <p className="mt-8 max-w-[38ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                        {product.tastingNotes}
                      </p>
                    )}

                    {/* 規格與價格：細線表格 */}
                    <div className="mt-10 max-w-md">
                      <span className="label text-ink-faint">
                        {dict.teas.specs}
                      </span>
                      <dl className="mt-4 text-[12px] tracking-[0.06em]">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="flex items-baseline justify-between gap-6 border-t border-line py-3.5"
                          >
                            <dt className="text-ink-soft">
                              {variant.label}
                              {variant.status === "sold_out" && (
                                <span className="label ml-3 text-ink-faint">
                                  {dict.teas.soldOut}
                                </span>
                              )}
                            </dt>
                            <dd
                              className={`font-display text-lg tabular-nums ${
                                variant.status === "sold_out"
                                  ? "text-ink-faint line-through"
                                  : "text-ink"
                              }`}
                            >
                              {formatPrice(variant.priceTwd)}
                            </dd>
                          </div>
                        ))}
                        <div className="border-t border-line" />
                      </dl>

                      <div className="mt-8">
                        <ArrowLink href={`/${locale}/teas/${product.slug}`}>
                          {dict.product.aboutTea}
                        </ArrowLink>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
