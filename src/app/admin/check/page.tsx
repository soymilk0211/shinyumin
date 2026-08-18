import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCheck } from "@/components/admin-check";
import { isSignedIn } from "@/lib/admin-auth";

/**
 * 系統檢查。
 *
 * 【這一頁是給出事的時候用的。】平常不會進來。
 *
 * 寄信與 LINE 推播都是在背景跑的，失敗只會寫進伺服器記錄 ——
 * 那個要進 Vercel 後台翻好幾層才看得到，業主用手機查不了。
 * 所以做成按鈕：按一下當場試一次，把服務商回的原文原封不動顯示出來。
 */

export const dynamic = "force-dynamic";

export default async function AdminCheckPage() {
  if (!(await isSignedIn())) redirect("/admin/login");

  // 只回報「有沒有填」，【絕不顯示內容】——
  // 這一頁雖然要登入才進得來，鑰匙也不該被印在畫面上。
  const configured = {
    resend: Boolean(process.env.RESEND_API_KEY),
    lineToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    lineGroup: Boolean(process.env.LINE_GROUP_ID),
    cron: Boolean(process.env.CRON_SECRET),
  };

  const rows: [string, boolean][] = [
    ["寄信金鑰 RESEND_API_KEY", configured.resend],
    ["LINE 金鑰 LINE_CHANNEL_ACCESS_TOKEN", configured.lineToken],
    ["LINE 群組 LINE_GROUP_ID", configured.lineGroup],
    ["日報通行碼 CRON_SECRET", configured.cron],
  ];

  return (
    <main>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">系統檢查</h1>
        <Link
          href="/admin"
          className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
        >
          回訂單
        </Link>
      </div>

      <p className="mt-4 text-[13px] leading-[1.8] text-ink-faint">
        通知沒收到的時候用這一頁。按下去會當場試一次，並把對方回的訊息原封不動顯示出來。
      </p>

      <section className="mt-8">
        <h2 className="text-[13px] text-ink-faint">設定有沒有填</h2>
        <dl className="mt-3">
          {rows.map(([label, ok]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-t border-line py-3"
            >
              <dt className="text-[14px] break-all text-ink-soft">{label}</dt>
              <dd
                className={`shrink-0 text-[14px] ${ok ? "text-ink" : "text-brand"}`}
              >
                {ok ? "已填" : "沒有填"}
              </dd>
            </div>
          ))}
          <div className="border-t border-line" />
        </dl>
        <p className="mt-3 text-[12px] leading-[1.8] text-ink-faint">
          顯示「沒有填」但您記得填過，通常是【存了之後還沒重新部署】——
          環境變數要重新部署才會生效。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[13px] text-ink-faint">實際測一次</h2>
        <div className="mt-3">
          <AdminCheck
            kind="email"
            label="寄一封測試信"
            hint="寄到訂單存檔用的那個信箱"
          />
          <AdminCheck
            kind="line"
            label="推一則測試訊息"
            hint="推到訂單通知的 LINE 群組"
          />
        </div>
      </section>
    </main>
  );
}
