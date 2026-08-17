import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 與資料庫的連線。
 *
 * 兩把鑰匙，用途完全不同：
 *
 *   anon（公開金鑰）
 *     用來讀商品。這把鑰匙會出現在訪客的瀏覽器裡，等同公開，
 *     它的安全性完全靠資料庫的門禁（RLS）撐著 ——
 *     商品類只讀得到已上架的，訂單類完全碰不到。
 *
 *   service_role（最高權限金鑰）
 *     繞過所有門禁。只在伺服器端用（第 4 步的結帳、第 6 步的後台），
 *     絕不可以進到瀏覽器。
 *
 * 鑰匙都放在 .env.local，那個檔案不會上傳到 GitHub。
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 讀商品用的連線。
 *
 * 如果 .env.local 還沒填，這裡回傳 null 而不是直接壞掉 ——
 * 網站會顯示「商品準備中」的佔位畫面，而不是一片白或錯誤頁。
 * 這樣在鑰匙到位之前，版面仍然看得到、改得動。
 */
export function getPublicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/** 資料庫連線是否已設定完成 */
export const isDatabaseConfigured = Boolean(url && anonKey);
