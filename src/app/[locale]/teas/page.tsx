import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/teas">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).nav.products };
}

export default async function TeasPage({ params }: PageProps<"/[locale]/teas">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  return (
    <ComingSoon
      badge={dict.common.comingSoon}
      title={dict.nav.products}
      note={dict.pages.teasNote}
    />
  );
}
