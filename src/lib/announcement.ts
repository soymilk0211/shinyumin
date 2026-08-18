import type { Locale } from "@/i18n/config";
import { getPublicClient } from "@/lib/supabase";

/**
 * 網站最上方的公告橫幅。
 *
 * 【只讀取，用公開金鑰。】要不要顯示、有沒有過期，都由資料庫的門禁
 * （RLS）決定 —— 沒有在顯示的公告，訪客連讀都讀不到。所以這裡讀得到
 * 東西，就代表它現在確實該出現在網站上，不需要在這一層再判斷一次。
 *
 * 為什麼不判斷第二次：日期這種事判斷兩遍，兩邊的時區只要有一邊寫錯，
 * 就會變成「有時候顯示、有時候不顯示」的鬼故事。判斷只留在資料庫那一處。
 */

/** 資料表還沒建立時的 Postgres 錯誤碼（undefined_table） */
const TABLE_MISSING = "42P01";

/**
 * 取得現在該顯示的公告。沒有公告、或資料庫連不上時回傳 null。
 *
 * 英文站若還沒填英文，會退回顯示中文 —— 對外國客人來說，
 * 看到一行看不懂的中文，還是比「完全不知道有這件事」好。
 */
export async function getAnnouncement(locale: Locale): Promise<string | null> {
  const db = getPublicClient();
  if (!db) return null;

  const { data, error } = await db
    .from("announcements")
    .select("message_zh, message_en")
    .maybeSingle();

  if (error) {
    // 【資料表還沒建立不算錯誤。】程式會比業主去 Supabase 貼那份 SQL
    // 先上線，這段期間網站要照常運作，只是沒有公告而已。
    // 這種情況安靜跳過，不然每開一頁就在記錄檔裡吼一次。
    if (error.code !== TABLE_MISSING) {
      console.error("讀取公告失敗：", error.message);
    }
    return null;
  }

  if (!data) return null;

  const message =
    locale === "en"
      ? String(data.message_en || "").trim() ||
        String(data.message_zh || "").trim()
      : String(data.message_zh || "").trim();

  return message || null;
}
