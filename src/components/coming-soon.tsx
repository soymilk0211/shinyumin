import { ImagePlaceholder } from "@/components/image-placeholder";

/**
 * 「這一頁還沒做」的暫時版面。
 *
 * 用在茶品、品牌故事、購物車這三頁。有這個的理由是：
 * 選單上的連結如果點下去是空白或錯誤頁，看起來就像網站壞了。
 *
 * 排版沿用首頁的語彙：左緣一行直式標籤、標題不置中而是靠左推、
 * 說明文字往右錯開，右下角留一塊圖的位置。
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
    <section className="px-6 pt-16 pb-28 sm:px-10 sm:pt-24 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {badge}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl max-w-[8ch] text-[clamp(2.75rem,10vw,7.5rem)] text-ink">
            {title}
          </h1>

          <p className="mt-12 max-w-[32ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:mt-16 sm:ml-[14%]">
            {note}
          </p>

          <div className="mt-16 ml-auto w-full max-w-md sm:mt-24">
            <ImagePlaceholder ratio="aspect-[16/10]" />
          </div>
        </div>
      </div>
    </section>
  );
}
