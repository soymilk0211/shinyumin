import Link from "next/link";

/**
 * 找不到頁面時顯示的畫面（404）。
 *
 * 這一頁刻意寫成中英並陳、不讀翻譯檔 —— 因為訪客會走到這裡，
 * 常常就是因為網址本身有問題（例如語言的部分打錯），
 * 這種時候不應該再去猜他想看哪一種語言。
 */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-28 text-center sm:px-8 sm:py-36">
      <p className="text-xs tracking-[0.35em] text-brand">404</p>

      <h1 className="mt-6 text-3xl text-ink sm:text-4xl">找不到這個頁面</h1>
      <p className="mt-4 text-sm leading-loose text-ink-soft">
        這個網址可能已經變更，或是輸入時少了幾個字。
      </p>

      <h2 className="mt-10 text-2xl text-ink">Page not found</h2>
      <p className="mt-4 text-sm leading-loose text-ink-soft">
        This address may have changed, or a few characters may be missing.
      </p>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/zh"
          className="rounded-sm bg-brand px-7 py-3 text-sm text-brand-contrast transition-colors hover:bg-brand-strong"
        >
          回首頁
        </Link>
        <Link
          href="/en"
          className="rounded-sm border border-line px-7 py-3 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
