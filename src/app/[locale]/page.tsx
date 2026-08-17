import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/arrow-link";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 首頁。
 *
 * 排版走獨立雜誌與藝術展覽的路線，刻意避開置中對稱的網格：
 *
 *   一、開場   —— 巨大的明體標題與右側出血的圖刻意重疊，
 *                 左緣一行直式地名，右下角一個浮動的品種標記
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

  const categories = [
    { name: dict.categories.blackTea, latin: dict.categories.blackTeaLatin },
    { name: dict.categories.oolongTea, latin: dict.categories.oolongTeaLatin },
    { name: dict.categories.greenTea, latin: dict.categories.greenTeaLatin },
  ];

  return (
    <div className="overflow-x-clip">
      {/* ============ 一、開場 ============ */}
      <section className="relative px-6 pt-12 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
        <div className="relative flex gap-5 sm:gap-10">
          {/* 直式地名，貼著版面左緣 */}
          <span className="vertical label mt-1 shrink-0 text-ink-faint">
            {dict.site.place}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="display-xl max-w-[7ch] text-[clamp(3.25rem,13vw,10.5rem)] text-ink">
              {home.heroTitle}
            </h1>

            {/* 圖。手機上排在標題下方、向右出血；
                電腦上抽離文字流，浮到右側讓標題壓過去一角 */}
            <div className="relative mt-10 -mr-14 w-[calc(100%+3.5rem)] sm:absolute sm:top-24 sm:-right-14 sm:mt-0 sm:mr-0 sm:w-[46%] lg:w-[50%] lg:max-w-[680px]">
              <ImagePlaceholder
                ratio="aspect-[3/4]"
                label={dict.common.imagePending}
              />
            </div>

            <p className="mt-12 max-w-[34ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:mt-20 sm:ml-[12%]">
              {home.heroLead}
            </p>

            <div className="mt-10 sm:ml-[12%]">
              <ArrowLink href={`/${locale}/teas`}>{home.featureCta}</ArrowLink>
            </div>
          </div>
        </div>

        {/* 浮動的品種標記，壓在版面右下角 */}
        <div className="relative mt-24 ml-auto w-fit border-t border-line pt-3 text-right sm:mt-32">
          <div className="label text-brand">{home.heroMarkLatin}</div>
          <div className="mt-1.5 font-display text-lg text-ink-soft">
            {home.heroMark}
          </div>
        </div>
      </section>

      {/* ============ 二、五道工序 ============ */}
      <section className="border-t border-line px-6 py-24 sm:px-10 sm:py-36">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="label text-brand">{home.craftLabel}</span>
            <h2 className="mt-5 max-w-[12ch] text-[clamp(1.9rem,5.5vw,3.5rem)] leading-[1.15] text-ink">
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
              className="step-stagger border-t border-line py-7 sm:py-9"
              style={{ "--step": index } as CSSProperties}
            >
              {/* 手機上說明另起一行，才不會被擠成細長條；電腦上並排 */}
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 sm:flex-nowrap sm:gap-x-10">
                <span className="label w-6 shrink-0 text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="shrink-0 text-[clamp(1.35rem,3.4vw,2.4rem)] text-ink sm:w-[4.5em]">
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
      <section className="relative border-t border-line bg-surface px-6 py-24 sm:px-10 sm:py-36">
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

            <h2 className="mt-6 text-[clamp(2.2rem,6vw,4.25rem)] leading-[1.05] text-ink">
              {home.featureName}
            </h2>
            <p className="label mt-4 text-ink-faint">{home.featureSub}</p>

            <p className="mt-8 max-w-[34ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
              {home.featureNotes}
            </p>

            {/* 規格與價格：細線表格，不是卡片 */}
            <dl className="mt-10 text-[12px] tracking-[0.06em]">
              <div className="flex items-baseline justify-between border-t border-line py-3.5">
                <dt className="label text-ink-faint">
                  {home.featureOrigin}
                </dt>
              </div>
              <div className="flex items-baseline justify-between border-t border-line py-3.5">
                <dt className="text-ink-soft">{home.featureVariant}</dt>
                <dd className="font-display text-xl text-ink tabular-nums">
                  {home.featurePrice}
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
      <section className="border-t border-line px-6 py-24 sm:px-10 sm:py-36">
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
