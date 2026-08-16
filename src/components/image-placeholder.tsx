/**
 * 圖片佔位符。
 *
 * 商品照片與商標都還沒有。這個元件的責任是：**照片沒有的時候，畫面依然好看。**
 * 它不是灰色的破圖，而是一塊安靜的淺色區塊，中間有一片線條茶葉。
 *
 * 第 3 步接上真實照片之後，這個元件會留下來當「後備方案」——
 * 萬一某款茶忘了放照片、或檔名打錯，網站顯示的還是這塊優雅的佔位符，
 * 而不是崩掉的版面。
 */
export function ImagePlaceholder({
  label,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  /** 佔位符中央的說明文字，例如「照片準備中」 */
  label?: string;
  className?: string;
  /** 圖片的長寬比，用 Tailwind 的 aspect 類別 */
  ratio?: string;
}) {
  return (
    <div
      className={`${ratio} ${className} flex flex-col items-center justify-center gap-3 overflow-hidden rounded-sm bg-surface-sunken text-ink-faint`}
      role="img"
      aria-label={label ?? ""}
    >
      <TeaLeaf />
      {label && (
        <span className="px-4 text-center text-xs tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
}

function TeaLeaf() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-10 w-10 opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 一片茶葉的輪廓 */}
      <path d="M38 10c2 12-4 22-14 26-4 1.6-8 1.8-12 .6 0-11 5-20 14-24 4-1.8 8-2.6 12-2.6Z" />
      {/* 主葉脈 */}
      <path d="M12 38C18 30 27 21 37 11" />
      {/* 側脈 */}
      <path d="M20 30h7M25 24h7M30 18h5" />
    </svg>
  );
}
