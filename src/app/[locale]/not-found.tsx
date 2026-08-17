import { ArrowLink } from "@/components/arrow-link";

/**
 * 找不到頁面時顯示的畫面（404）。
 *
 * 這一頁刻意中英並陳、不讀翻譯檔 —— 訪客會走到這裡，
 * 常常就是因為網址本身有問題（例如語言的部分打錯），
 * 這種時候不該再去猜他想看哪一種語言。
 */
export default function NotFound() {
  return (
    <section className="px-6 pt-16 pb-32 sm:px-10 sm:pt-28 sm:pb-48">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-brand">404</span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl max-w-[8ch] text-[clamp(2rem,6.5vw,4.5rem)] text-ink">
            找不到這個頁面
          </h1>
          <p className="mt-10 max-w-[32ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:ml-[14%]">
            這個網址可能已經變更，或是輸入時少了幾個字。
          </p>

          <h2 className="mt-20 max-w-[10ch] text-[clamp(1.4rem,4.5vw,2.75rem)] leading-[1.1] font-light text-ink-soft">
            Page not found
          </h2>
          <p className="mt-8 max-w-[36ch] text-[13px] leading-[2.1] tracking-[0.06em] text-ink-soft sm:ml-[14%]">
            This address may have changed, or a few characters may be missing.
          </p>

          <div className="mt-20 flex flex-col gap-6 sm:ml-[14%] sm:flex-row sm:gap-14">
            <ArrowLink href="/zh">回首頁</ArrowLink>
            <ArrowLink href="/en" tone="ink">
              Back to home
            </ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}
