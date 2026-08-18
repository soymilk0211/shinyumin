import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/policy-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 隱私權政策。
 *
 * 【這一頁上的每一句都必須是真的。】它描述的是這個網站實際的行為 ——
 * 收哪些欄位、存在哪個機房、誰讀得到、有沒有追蹤碼。
 *
 * 所以【改程式的時候要回頭看這一頁】：
 * 日後如果加了 Google Analytics、廣告像素、或任何會把資料送出去的東西，
 * 這一頁就變成假的了。寫錯的隱私權政策比沒有還糟。
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).privacy.title };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <PolicyPage
      title={dict.privacy.title}
      updated={dict.privacy.updated}
      sections={dict.privacy.sections}
      contactTitle={dict.privacy.contactTitle}
      contactNote={dict.privacy.contactNote}
      contactKind="techPhone"
      phoneHint={dict.privacy.phoneHint}
      serviceHours={dict.privacy.serviceHours}
      place={dict.site.place}
    />
  );
}
