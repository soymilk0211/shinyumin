import { ImagePlaceholder } from "@/components/image-placeholder";

/**
 * 「這一頁還沒做」的暫時版面。
 *
 * 用在茶品、品牌故事、購物車這三頁上。
 * 有這個的理由是：選單上的連結如果點下去是空白或錯誤頁，
 * 看起來就像網站壞了。先放一個好看的暫時版面，之後逐頁換成真的內容。
 */
export function ComingSoon({
  title,
  badge,
  note,
}: {
  title: string;
  badge: string;
  note: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
      <p className="text-xs tracking-[0.35em] text-brand uppercase">{badge}</p>
      <h1 className="mt-6 text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-loose text-ink-soft">
        {note}
      </p>
      <ImagePlaceholder ratio="aspect-[3/1]" className="mt-12" />
    </section>
  );
}
