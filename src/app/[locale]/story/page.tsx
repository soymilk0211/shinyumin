import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "@/components/arrow-link";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 品牌故事。
 *
 * 寫的是實際的產區、品種與工序 —— 大雁村、台茶 18 號、五道手續，
 * 不寫空泛的形容詞。
 *
 * 排版是四個段落往右下走的階梯，每一段配一塊圖的位置，
 * 圖與文字左右交錯，維持全站的非對稱語彙。
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/story">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = getDictionary(locale);
  return { title: dict.story.title, description: dict.story.lead };
}

export default async function StoryPage({
  params,
}: PageProps<"/[locale]/story">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { story } = dict;

  const sections = [
    { title: story.placeTitle, body: story.placeBody },
    { title: story.cultivarTitle, body: story.cultivarBody },
    { title: story.craftTitle, body: story.craftBody },
    { title: story.todayTitle, body: story.todayBody },
  ];

  return (
    <div className="overflow-x-clip">
      {/* 開場 */}
      <section className="px-6 pt-14 pb-20 sm:px-10 sm:pt-20 sm:pb-28">
        <div className="flex gap-5 sm:gap-10">
          <span className="vertical label mt-1 shrink-0 text-ink-faint">
            {dict.site.place}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="display-xl text-[clamp(2.2rem,7vw,5rem)] text-ink">
              {story.title}
            </h1>
            <p className="mt-12 max-w-[36ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:ml-[12%]">
              {story.lead}
            </p>
          </div>
        </div>
      </section>

      {/* 四段，圖文左右交錯 */}
      {sections.map((section, index) => (
        <section
          key={section.title}
          className="border-t border-line px-6 py-20 sm:px-10 sm:py-28"
        >
          <div
            className={`sm:flex sm:items-start sm:gap-14 ${
              index % 2 === 1 ? "sm:flex-row-reverse" : ""
            }`}
          >
            <div className="sm:w-[40%]">
              <ImagePlaceholder
                ratio={index % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}
                label={dict.common.imagePending}
              />
            </div>

            <div className="mt-10 sm:mt-8 sm:flex-1">
              <span className="label text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-5 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.15] text-ink">
                {section.title}
              </h2>
              <p className="mt-8 max-w-[40ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft">
                {section.body}
              </p>
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-line px-6 py-16 sm:px-10 sm:py-20">
        <ArrowLink href={`/${locale}/teas`}>{dict.teas.title}</ArrowLink>
      </section>
    </div>
  );
}
