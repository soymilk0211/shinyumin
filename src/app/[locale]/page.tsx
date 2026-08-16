import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 首頁（版型草稿）。
 *
 * 這一版的目的是讓業主看見「網站長什麼樣子」：留白、字級、配色、按鈕。
 * 內容都還是寫死的文字與佔位符，第 3 步才會接上資料庫裡真正的商品。
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  const categories = [
    dict.categories.blackTea,
    dict.categories.oolongTea,
    dict.categories.greenTea,
  ];

  return (
    <>
      {/* ---------- 開場 ---------- */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-xs tracking-[0.35em] text-brand uppercase">
              {dict.site.tagline}
            </p>
            <h1 className="mt-6 text-4xl leading-tight text-ink sm:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-base leading-loose text-ink-soft">
              {dict.home.heroBody}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/teas`}
                className="rounded-sm bg-brand px-7 py-3 text-sm text-brand-contrast transition-colors hover:bg-brand-strong"
              >
                {dict.home.heroPrimary}
              </Link>
              <Link
                href={`/${locale}/story`}
                className="rounded-sm border border-line px-7 py-3 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {dict.home.heroSecondary}
              </Link>
            </div>
          </div>

          <ImagePlaceholder
            label={dict.common.imagePending}
            ratio="aspect-[4/5]"
          />
        </div>
      </section>

      {/* ---------- 產區與工藝 ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 md:grid-cols-2 md:gap-16">
          <ImagePlaceholder
            label={dict.common.imagePending}
            ratio="aspect-[3/2]"
            className="md:order-last"
          />
          <div>
            <h2 className="text-2xl leading-snug text-ink sm:text-3xl">
              {dict.home.originTitle}
            </h2>
            <p className="mt-6 max-w-md text-base leading-loose text-ink-soft">
              {dict.home.originBody}
            </p>
          </div>
        </div>
      </section>

      {/* ---------- 分類 ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl text-ink sm:text-3xl">
            {dict.home.categoriesTitle}
          </h2>
          <p className="text-xs text-ink-faint">{dict.home.categoriesNote}</p>
        </div>

        <ul className="mt-10 grid gap-8 sm:grid-cols-3">
          {categories.map((name) => (
            <li key={name}>
              <ImagePlaceholder
                label={dict.common.imagePending}
                ratio="aspect-square"
              />
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-lg text-ink">{name}</h3>
                <span className="text-xs tracking-widest text-ink-faint">
                  {dict.common.comingSoon}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
