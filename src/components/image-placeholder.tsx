/**
 * 圖片佔位符。
 *
 * 商品照片還沒有。這個元件的責任是：**照片沒有的時候，畫面依然好看。**
 *
 * 不是灰色破圖，而是一塊有紙質感的留白，內縮一圈細線框（像裱框的內襯），
 * 左上角一行直式小字，右下角一片淡淡的茶葉 —— 刻意不對稱，
 * 兩個元素分踞對角，讓空白本身變成構圖的一部分。
 *
 * 第 3 步接上真實照片後這個元件會留下來當**後備方案**：
 * 萬一某款茶忘了放照片、或檔名打錯，顯示的還是這塊佔位符，畫面不會崩掉。
 */
export function ImagePlaceholder({
  label,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  /** 佔位符上的說明文字，例如「照片準備中」 */
  label?: string;
  className?: string;
  /** 圖片的長寬比，用 Tailwind 的 aspect 類別 */
  ratio?: string;
}) {
  return (
    <div
      className={`${ratio} ${className} relative overflow-hidden bg-surface-sunken`}
      role="img"
      aria-label={label ?? ""}
    >
      {/* 內縮的細線框，像裱框的內襯 */}
      <div
        className="absolute inset-3 border border-line sm:inset-5"
        aria-hidden="true"
      />

      {label && (
        <span className="vertical label absolute top-7 left-7 text-ink-faint sm:top-9 sm:left-9">
          {label}
        </span>
      )}

      <TeaLeaf />
    </div>
  );
}

function TeaLeaf() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="absolute right-7 bottom-7 h-9 w-9 text-ink-faint opacity-45 sm:right-9 sm:bottom-9 sm:h-12 sm:w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
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
