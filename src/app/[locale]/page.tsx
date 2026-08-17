import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/arrow-link";
import { TeaDial } from "@/components/tea-dial";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { ProductName } from "@/components/product-name";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice, getCategories, getProducts } from "@/lib/products";

// 每 60 秒重新向資料庫確認一次，業主在後台改價後最慢一分鐘會反映到網站上
export const revalidate = 60;

/**
 * 首頁。
 *
 * 排版走獨立雜誌與藝術展覽的路線，刻意避開置中對稱的網格：
 *
 *   一、開場   —— 楷書標題與右側出血的圖刻意重疊，左緣一行直式地名
 *   二、工序   —— 五道手續排成往右下走的階梯，不是整齊的五等分
 *   三、紅玉   —— 圖與文字錯開重疊，價格與規格用細線表格呈現
 *   四、分類   —— 三格高低錯落，不對齊
 *
 * 內容目前是寫死的，第 3 步會換成資料庫裡真正的商品。
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { home } = dict;

  // 分類與主力茶款都從資料庫讀。
  // 資料庫還沒接上（.env.local 的鑰匙還沒填）時，退回用寫在翻譯檔裡的內容，
  // 這樣版面不會開天窗，仍然看得出網站長什麼樣子。
  const [dbCategories, dbProducts] = await Promise.all([
    getCategories(locale),
    getProducts(locale),
  ]);

  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, latin: c.slug }))
      : [
          {
            name: dict.categories.blackTea,
            latin: dict.categories.blackTeaLatin,
          },
          {
            name: dict.categories.oolongTea,
            latin: dict.categories.oolongTeaLatin,
          },
          {
            name: dict.categories.greenTea,
            latin: dict.categories.greenTeaLatin,
          },
        ];

  const featured = dbProducts[0] ?? null;
  const featuredVariant =
    featured?.variants.find((v) => v.status === "on_sale") ?? null;

  const feature = {
    name: featured?.name ?? home.featureName,
    notes: featured?.tastingNotes ?? home.featureNotes,
    variantLabel: featuredVariant?.label ?? home.featureVariant,
    price: featuredVariant
      ? formatPrice(featuredVariant.priceTwd)
      : home.featurePrice,
  };

  return (
    <div className="overflow-x-clip">
      {/* 一進頁面時顯示綠茶，與下面第一個段落的 data-tea-tone 一致 */}
      <TeaDial initialTone="green" />

      {/* ============ 一、開場 ============ */}
      {/* data-tea-tone 決定右下角茶湯轉盤在這一段要顯示哪一種茶湯。
          目前首頁沒有「綠茶區／烏龍區／紅茶區」這種分區，所以先照製茶的順序
          分配：新葉（綠）→ 發酵中（烏龍）→ 成茶（紅）。
          日後若首頁改成一個分類一個區塊，把這個屬性搬過去就會自動跟著換色。 */}
      <section
        data-tea-tone="green"
        className="relative px-6 pt-12 pb-28 sm:px-10 sm:pt-20 sm:pb-40"
      >
        <div className="relative flex gap-5 sm:gap-10">
          {/* 直式地名。刻意放大、拉長，讓它像展場牆上的側標 */}
          <span
            className="rise vertical mt-1 shrink-0 text-[13px] tracking-[0.7em] text-ink-faint sm:text-[15px]"
            style={{ "--delay": "150ms" } as CSSProperties}
          >
            {dict.site.place}
          </span>

          <div className="min-w-0 flex-1">
            {/* 標題的斷行是寫死的，不交給瀏覽器決定 ——
                「日月潭」三個字必須在同一行，不能讓「潭」掉到下一行去。
                第二行往右錯開並且可以衝出版面右緣 —— 這是整頁最大的手勢。 */}
            {/* relative z-10：讓標題壓在右側那張圖【上面】。
                不加的話，絕對定位的圖會蓋住標題，字就被切掉了。 */}
            <h1 className="display-xl relative z-10 text-[clamp(3.75rem,14vw,12rem)] text-ink">
              {home.heroTitleLines.map((line, index) => (
                <span
                  key={line}
                  className={`rise block whitespace-nowrap ${
                    index === 1 ? "pl-[12%] sm:pl-[34%]" : ""
                  }`}
                  style={{ "--delay": `${index * 140}ms` } as CSSProperties}
                >
                  {line}
                </span>
              ))}
            </h1>

            {/* 圖。手機上排在標題下方、向右出血；
                電腦上抽離文字流，浮到右側讓標題壓過去一角 */}
            <div className="relative mt-10 -mr-14 w-[calc(100%+3.5rem)] sm:absolute sm:top-24 sm:-right-14 sm:mt-0 sm:mr-0 sm:w-[46%] lg:w-[50%] lg:max-w-[680px]">
              <ImagePlaceholder
                ratio="aspect-[3/4]"
                label={dict.common.imagePending}
              />
            </div>

            <p
              className="rise mt-12 max-w-[34ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:mt-20 sm:ml-[12%]"
              style={{ "--delay": "420ms" } as CSSProperties}
            >
              {home.heroLead}
            </p>

            <div
              className="rise mt-10 sm:ml-[12%]"
              style={{ "--delay": "540ms" } as CSSProperties}
            >
              <ArrowLink href={`/${locale}/teas`}>{home.featureCta}</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 二、五道工序 ============ */}
      <section
        data-tea-tone="oolong"
        className="border-t border-line px-6 py-24 sm:px-10 sm:py-36"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="label text-brand">{home.craftLabel}</span>
            <h2 className="reveal mt-5 max-w-[12ch] text-[clamp(1.9rem,5vw,3.75rem)] leading-[1.05] text-ink">
              {home.craftTitle}
            </h2>
          </div>
          <p className="max-w-[30ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
            {home.craftLead}
          </p>
        </div>

        {/* 往右下走的階梯。每一階比上一階再往右推一點 */}
        <ol className="mt-20 sm:mt-28">
          {home.craftSteps.map((step, index) => (
            <li
              key={step.name}
              className="step-stagger reveal border-t border-line py-7 sm:py-9"
              style={{ "--step": index } as CSSProperties}
            >
              {/* 手機上說明另起一行，才不會被擠成細長條；電腦上並排 */}
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 sm:flex-nowrap sm:gap-x-10">
                <span className="w-10 shrink-0 font-display text-[clamp(1.5rem,3.5vw,2.5rem)] leading-none text-brand tabular-nums opacity-70 sm:w-16">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="shrink-0 text-[clamp(1.35rem,3.2vw,2.25rem)] text-ink sm:w-[4.5em]">
                  {step.name}
                </h3>
                <p className="w-full pl-11 text-[12px] leading-[2] tracking-[0.06em] text-ink-soft sm:w-auto sm:max-w-[36ch] sm:pl-0">
                  {step.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ 三、紅玉 ============ */}
      <section
        data-tea-tone="black"
        className="relative border-t border-line bg-surface px-6 py-24 sm:px-10 sm:py-36"
      >
        <div className="relative sm:flex sm:items-start sm:gap-0">
          {/* 圖 */}
          <div className="sm:w-[46%]">
            <ImagePlaceholder
              ratio="aspect-[4/5]"
              label={dict.common.imagePending}
            />
          </div>

          {/* 文字塊往左壓進圖裡，並且刻意往下錯開 */}
          <div className="relative -mt-12 ml-6 bg-page px-6 py-10 sm:mt-28 sm:-ml-[10%] sm:w-[56%] sm:px-12 sm:py-14">
            <span className="label text-brand">{home.featureLabel}</span>

            <h2 className="reveal mt-6 text-[clamp(1.9rem,4.6vw,3.25rem)] leading-[1.05] text-ink">
              <ProductName name={feature.name} />
            </h2>
            <p className="label mt-4 text-ink-faint">{home.featureSub}</p>

            <p className="mt-8 max-w-[34ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
              {feature.notes}
            </p>

            {/* 規格與價格：細線表格，不是卡片 */}
            <dl className="mt-10 text-[12px] tracking-[0.06em]">
              <div className="flex items-baseline justify-between border-t border-line py-3.5">
                <dt className="label text-ink-faint">{home.featureOrigin}</dt>
              </div>
              <div className="flex items-baseline justify-between border-t border-line py-3.5">
                <dt className="text-ink-soft">{feature.variantLabel}</dt>
                <dd className="font-display text-xl text-ink tabular-nums">
                  {feature.price}
                </dd>
              </div>
              <div className="border-t border-line" />
            </dl>

            <div className="mt-10">
              <ArrowLink href={`/${locale}/teas`}>{home.featureCta}</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 四、分類 ============ */}
      <section
        data-tea-tone="black"
        className="border-t border-line px-6 py-24 sm:px-10 sm:py-36"
      >
        <div className="flex items-baseline justify-between gap-6">
          <span className="label text-brand">{home.categoriesLabel}</span>
          <span className="label text-ink-faint">{home.categoriesNote}</span>
        </div>

        {/* 三格高低錯落，不對齊 */}
        <ul className="mt-16 grid gap-14 sm:mt-24 sm:grid-cols-3 sm:gap-8">
          {categories.map((category, index) => (
            <li
              key={category.name}
              className={
                index === 1 ? "sm:mt-24" : index === 2 ? "sm:mt-10" : undefined
              }
            >
              <Link href={`/${locale}/teas`} className="group block">
                <ImagePlaceholder
                  ratio={index === 0 ? "aspect-[4/5]" : "aspect-square"}
                  label={dict.common.imagePending}
                />
                <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                  <h3 className="text-xl text-ink transition-colors group-hover:text-brand">
                    {category.name}
                  </h3>
                  <span className="label text-ink-faint">{category.latin}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
