import { createHmac, timingSafeEqual } from "node:crypto";
import { buildDailyReport } from "@/lib/daily-report";
import { pushText } from "@/lib/line";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * 每天早上的日報。
 *
 * 這支程式不是給人打開的，是 Vercel 的排程每天固定叫一次
 * （設定在專案根目錄的 `vercel.json`，台灣時間早上八點）。
 *
 * 【一定要上鎖。】這個網址是公開的，任何人都打得到。
 * 不擋的話，有人對它連按一百次，LINE 的免費額度（每月 200 則）
 * 一個上午就沒了 —— 那才是真的會讓通知「塞爆」的原因。
 *
 * 兩道鎖：
 *   一、要帶對的通行碼（`CRON_SECRET`）。Vercel 的排程會自動帶上。
 *   二、就算通行碼外流，同一個來源一小時也只推得了一次。
 */

/** 一小時最多跑一次。日報一天只需要一則。 */
const LIMIT = 1;
const WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // 沒設定通行碼時【拒絕執行】，不是放行。
  // 放行的話等於把「幫我燒 LINE 額度」的按鈕公開在網路上。
  if (!secret) {
    console.error("日報未執行：尚未設定 CRON_SECRET");
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const provided = request.headers.get("authorization") ?? "";
  if (!safeEqual(provided, `Bearer ${secret}`)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const gate = rateLimit(`daily-report:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } },
    );
  }

  const report = await buildDailyReport();

  // 昨天沒訂單、也沒有待處理的事就不推 ——
  // 每月只有 200 則，一則「今天沒事」不值得花掉一則。
  if (!report.worthSending) {
    return Response.json({ ok: true, sent: false, reason: "沒有值得報告的事" });
  }

  await pushText(report.text, "每日報表");

  // 把內容一起回傳，方便日後查「那天到底報了什麼」。
  // 這個網址有通行碼保護，而且報表裡【沒有任何顧客資料】——
  // 只有張數、金額與品項統計。
  return Response.json({ ok: true, sent: true, text: report.text });
}

/** 比對通行碼，但花的時間跟內容無關 —— 避免用「錯在第幾個字」猜出來 */
function safeEqual(a: string, b: string): boolean {
  // 先各自雜湊成固定長度，長度不同也能安全比較
  const digest = (value: string) =>
    createHmac("sha256", "cron").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}
