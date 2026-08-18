import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/policy-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 退換貨與出貨政策。
 *
 * 內容全部來自老闆訪談確認過的規則（見 docs/HANDOVER.md 第 4 節），
 * 沒有一條是我自己補的。要改請先跟老闆確認 —— 這一頁是對客人的承諾。
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/returns">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).returns.title };
}

export default async function ReturnsPage({
  params,
}: PageProps<"/[locale]/returns">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <PolicyPage
      title={dict.returns.title}
      updated={dict.returns.updated}
      sections={dict.returns.sections}
      contactTitle={dict.returns.contactTitle}
      phoneHint={dict.returns.phoneHint}
      serviceHours={dict.returns.serviceHours}
      place={dict.site.place}
    />
  );
}
