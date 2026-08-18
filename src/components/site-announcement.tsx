/**
 * 網站最上方的公告橫幅。
 *
 * 用途是老闆的調價政策：價格要調整前先公告一個月。
 * 系統刻意【不做排程改價】—— 時間到了自動變價格，萬一寫錯了，
 * 錯誤會發生在沒有人在看的半夜。改價維持人工，公告則自動收。
 *
 * 【放在選單列的上面，而且不黏在畫面上。】捲下去它就走了，
 * 留下選單列繼續黏著 —— 公告只需要被看到一次，不需要一路跟著客人。
 * 這也是整個網站唯一一塊「會主動說話」的地方，不能再多。
 *
 * 【刻意不做「關閉」按鈕。】關掉要記在瀏覽器裡，就多一份儲存、
 * 多一個伺服器與瀏覽器對不起來的閃爍。公告本來就有結束日期會自己收，
 * 業主也隨時關得掉，不需要再給客人一個開關。
 *
 * 這個元件只負責【長什麼樣子】，不碰資料庫 ——
 * 所以後台的預覽可以直接用它，看到的跟客人看到的一定一模一樣。
 */
export function AnnouncementBar({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  if (!message.trim()) return null;

  return (
    <aside
      aria-label={label}
      className="border-b border-line bg-surface"
    >
      {/* 【不換行。】允許換行的話，手機上「公告」兩個字會被擠到自己一行，
          橫幅從 47px 長到 91px —— 一則公告吃掉手機畫面的九分之一，
          商標與選單全被往下推。標籤留在左邊、文字在右邊自己折行，
          就是報紙上那種嵌在段首的小標。 */}
      <div className="flex items-baseline gap-x-4 px-6 py-3 sm:gap-x-5 sm:px-10">
        {/* 品牌色的小標籤。整條橫幅只有這兩個字是有顏色的 ——
            要的是「一眼看出這裡有事」，不是一整條跳出來的色塊。 */}
        <span className="label shrink-0 text-brand">{label}</span>
        <p className="text-[13px] leading-[1.75] text-ink-soft">{message}</p>
      </div>
    </aside>
  );
}
