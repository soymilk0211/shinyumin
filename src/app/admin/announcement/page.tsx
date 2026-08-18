import Link from "next/link";
import { redirect } from "next/navigation";
import { saveAnnouncement, toggleAnnouncement } from "@/app/admin/actions";
import { AnnouncementBar } from "@/components/site-announcement";
import { isSignedIn } from "@/lib/admin-auth";
import {
  getAnnouncementForAdmin,
  MAX_MESSAGE_LENGTH,
  todayInTaipei,
} from "@/lib/admin-announcement";

/**
 * 公告橫幅。
 *
 * 老闆的政策是「調價要先公告一個月」。系統刻意不做排程改價，
 * 改價維持人工；這一頁負責的是「把話講出去」那一半。
 *
 * 【打字與公開是兩個按鈕。】業主很可能先把下個月的漲價公告打好放著，
 * 時間到再打開。存檔如果等於上線，手一滑就會把還沒定稿的價格公告出去。
 *
 * 【一定要有預覽。】業主看得懂實物、不看描述。預覽用的是前台
 * 一模一樣的那個元件，所以這裡看到的就是客人會看到的。
 */

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementPage() {
  if (!(await isSignedIn())) redirect("/admin/login");

  const announcement = await getAnnouncementForAdmin();

  return (
    <main>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">公告橫幅</h1>
        <Link
          href="/admin"
          className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
        >
          看訂單 →
        </Link>
      </div>

      {announcement === null ? (
        <SetupNeeded />
      ) : (
        <>
          <p className="mt-4 text-[13px] leading-[1.8] text-ink-faint">
            打開之後，網站每一頁的最上面都會出現這一行字。
            要調整價格前先公告一個月，就是用這個。
          </p>

          {/* ── 現在的狀態 ───────────────────────── */}
          <div className="mt-6 border-y border-line py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
              <span className="text-[15px]">
                目前狀態：{" "}
                {announcement.isActive && !announcement.isExpired ? (
                  <strong className="font-normal text-brand">
                    客人看得到
                  </strong>
                ) : (
                  <strong className="font-normal text-ink-faint">
                    沒有顯示
                  </strong>
                )}
              </span>

              <form action={toggleAnnouncement}>
                <input
                  type="hidden"
                  name="active"
                  value={announcement.isActive ? "false" : "true"}
                />
                <button
                  type="submit"
                  disabled={
                    !announcement.isActive && !announcement.messageZh.trim()
                  }
                  className={
                    announcement.isActive
                      ? "border border-line px-4 py-2.5 text-[14px] text-ink-soft transition-colors hover:border-brand hover:text-brand"
                      : "bg-brand px-4 py-2.5 text-[14px] text-brand-contrast transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
                  }
                >
                  {announcement.isActive ? "從網站上收起來" : "開始顯示"}
                </button>
              </form>
            </div>

            {/* 開著、但日期已經過了 —— 這是最容易誤會的一種狀態，
                所以講清楚它現在到底有沒有在顯示。 */}
            {announcement.isActive && announcement.isExpired && (
              <p className="mt-3 text-[13px] leading-[1.8] text-brand">
                這則公告的日期（{announcement.endsOn}）已經過了，
                所以客人現在看不到。要繼續公告的話，把下面的日期往後改再儲存。
              </p>
            )}

            {!announcement.isActive && !announcement.messageZh.trim() && (
              <p className="mt-3 text-[13px] text-ink-faint">
                還沒有內容。先在下面打字並儲存，才能開始顯示。
              </p>
            )}
          </div>

          {/* ── 預覽 ─────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-[13px] tracking-[0.2em] text-ink-faint">
              客人會看到的樣子
            </h2>
            <div className="mt-3 border border-line">
              {announcement.messageZh.trim() ? (
                <AnnouncementBar
                  label="公告"
                  message={announcement.messageZh}
                />
              ) : (
                <p className="px-6 py-5 text-[13px] text-ink-faint">
                  （還沒有內容）
                </p>
              )}
            </div>
          </section>

          {/* ── 編輯 ─────────────────────────────── */}
          <form action={saveAnnouncement} className="mt-8">
            <label
              htmlFor="messageZh"
              className="block text-[15px] text-ink"
            >
              公告內容（中文）
            </label>
            <p className="mt-1.5 text-[13px] leading-[1.8] text-ink-faint">
              一句話就好，橫幅只有一行的高度。最多 {MAX_MESSAGE_LENGTH} 個字。
            </p>
            <textarea
              id="messageZh"
              name="messageZh"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              defaultValue={announcement.messageZh}
              placeholder="例：因原料成本調整，紅茶類價格將於 9 月 20 日起調整，敬請見諒。"
              className="mt-3 w-full border border-line bg-page px-3 py-2.5 text-[16px] leading-[1.8] text-ink transition-colors focus:border-brand"
            />

            <label
              htmlFor="messageEn"
              className="mt-6 block text-[15px] text-ink"
            >
              英文版（選填）
            </label>
            <p className="mt-1.5 text-[13px] leading-[1.8] text-ink-faint">
              留空白也沒關係 —— 英文站會顯示上面那段中文。
            </p>
            <textarea
              id="messageEn"
              name="messageEn"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              defaultValue={announcement.messageEn}
              className="mt-3 w-full border border-line bg-page px-3 py-2.5 text-[16px] leading-[1.8] text-ink transition-colors focus:border-brand"
            />

            <label
              htmlFor="endsOn"
              className="mt-6 block text-[15px] text-ink"
            >
              公告到哪一天（選填）
            </label>
            <p className="mt-1.5 text-[13px] leading-[1.8] text-ink-faint">
              到了隔天就自動收起來，不用記得回來關。
              空白 = 一直顯示到你自己收掉。
            </p>
            <input
              id="endsOn"
              name="endsOn"
              type="date"
              min={todayInTaipei()}
              defaultValue={announcement.endsOn ?? ""}
              className="mt-3 w-full border border-line bg-page px-3 py-2.5 text-[16px] text-ink tabular-nums transition-colors focus:border-brand sm:w-52"
            />

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="bg-brand px-5 py-2.5 text-[14px] text-brand-contrast transition-colors hover:bg-brand-strong"
              >
                儲存
              </button>
              <span className="text-[13px] text-ink-faint">
                儲存不會自動公開，要按上面的「開始顯示」。
              </span>
            </div>
          </form>
        </>
      )}
    </main>
  );
}

/**
 * 資料表還沒建立時顯示這一段。
 *
 * 【不要丟一個看不懂的錯誤給業主。】程式會比「去 Supabase 貼 SQL」
 * 先上線，這段期間他打開這一頁，要看到的是「下一步做什麼」，
 * 不是一片空白或一串英文。
 */
function SetupNeeded() {
  return (
    <div className="mt-6 border border-brand px-5 py-5">
      <p className="text-[15px] leading-[1.9] text-ink">
        這個功能還差最後一步：要先在資料庫建一張放公告的表。
      </p>
      <p className="mt-3 text-[13px] leading-[1.9] text-ink-soft">
        跟之前一樣，把 <code>supabase/05-announcement.sql</code> 整份複製，
        貼到 Supabase 的 SQL Editor 按 Run，然後回到這一頁重新整理就好。
        大概一分鐘。
      </p>
      <a
        href="https://github.com/soymilk0211/shinyumin/raw/main/supabase/05-announcement.sql"
        className="mt-4 inline-block text-[14px] text-brand underline-offset-4 hover:underline"
      >
        開啟那份 SQL →
      </a>
    </div>
  );
}
