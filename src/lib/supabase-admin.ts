import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 伺服器端的資料庫連線（萬能鑰匙）。
 *
 * 【這個檔案永遠不能被瀏覽器端的程式引用。】
 *
 * `service_role` 是資料庫的萬能鑰匙，繞過所有門禁（RLS）——
 * 拿到它的人可以讀走全部顧客的姓名、電話、地址，也可以改價格。
 * 所以它只存在伺服器上的環境變數裡，絕不進到瀏覽器。
 *
 * 為什麼要跟 `supabase.ts` 分成兩個檔案：
 * `supabase.ts` 會被購物車那類「瀏覽器也會跑」的程式間接引用，
 * 兩把鑰匙寫在一起，日後很容易不小心把萬能鑰匙帶進瀏覽器。
 * 分開放，界線就是檔案本身，看一眼就知道踩沒踩線。
 */

/**
 * 取得伺服器端連線。鑰匙沒設定時回傳 null，由呼叫端決定怎麼處理
 * （結帳會回覆「系統忙碌中」，而不是讓整個網站壞掉）。
 */
export function getAdminClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    // 這行永遠不該執行到。萬一有人不小心從瀏覽器端引用了這個檔案，
    // 讓它當場壞掉，比默默地把鑰匙帶進瀏覽器好得多。
    throw new Error("getAdminClient() 只能在伺服器端呼叫");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
