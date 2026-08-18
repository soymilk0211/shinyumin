import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 後台的公告維護。【伺服器端專用，用的是萬能鑰匙。】
 *
 * 後台跟前台看到的不一樣：**還沒打開的、已經過期的公告，後台都要看得到**，
 * 否則業主先把下個月的漲價公告打好存起來之後，就再也找不到它了。
 * 前台那支 `lib/announcement.ts` 用的是公開金鑰，只看得到正在顯示的那一條。
 */

export type AdminAnnouncement = {
  isActive: boolean;
  messageZh: string;
  messageEn: string;
  /** YYYY-MM-DD，或 null 表示一直顯示 */
  endsOn: string | null;
  updatedAt: string | null;
  /** 依結束日期判斷，這條公告是不是已經過期（過期就等於沒在顯示） */
  isExpired: boolean;
};

/**
 * 公告的長度上限。
 *
 * 【橫幅只有一行的高度。】寫成一整段的公告，在手機上會把整個畫面吃掉，
 * 客人第一眼看到的不是茶而是一面文字牆。要講長篇的事情應該開一頁，
 * 橫幅負責的是「一句話讓人知道有這件事」。
 */
export const MAX_MESSAGE_LENGTH = 200;

/** 資料表還沒建立時的 Postgres 錯誤碼 */
const TABLE_MISSING = "42P01";

/** 今天（台灣時間）的 YYYY-MM-DD */
export function todayInTaipei(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

/**
 * 讀出公告。
 *
 * 回傳 null 有一個特定的意思：**資料表還沒建立**（業主還沒去貼那份 SQL）。
 * 後台頁面靠這個分辨「還沒設定好」與「設定好了但公告是空的」，
 * 才能顯示對的指示，而不是丟一個看不懂的錯誤給業主。
 */
export async function getAnnouncementForAdmin(): Promise<AdminAnnouncement | null> {
  const db = getAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from("announcements")
    .select("is_active, message_zh, message_en, ends_on, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code !== TABLE_MISSING) {
      console.error("後台讀取公告失敗：", error.message);
    }
    return null;
  }
  if (!data) return null;

  const endsOn = data.ends_on ? String(data.ends_on) : null;

  return {
    isActive: Boolean(data.is_active),
    messageZh: String(data.message_zh ?? ""),
    messageEn: String(data.message_en ?? ""),
    endsOn,
    updatedAt: data.updated_at ? String(data.updated_at) : null,
    isExpired: endsOn !== null && endsOn < todayInTaipei(),
  };
}

/** 存公告的內容。【不動開關】—— 打字跟「要不要公開」是兩件事。 */
export async function saveAnnouncementContent(input: {
  messageZh: string;
  messageEn: string;
  endsOn: string | null;
}): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const messageZh = input.messageZh.trim().slice(0, MAX_MESSAGE_LENGTH);
  const messageEn = input.messageEn.trim().slice(0, MAX_MESSAGE_LENGTH);

  const { error } = await db
    .from("announcements")
    .update({
      message_zh: messageZh,
      message_en: messageEn,
      ends_on: input.endsOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("後台儲存公告失敗：", error.message);
    return false;
  }
  return true;
}

/** 開關公告。 */
export async function setAnnouncementActive(isActive: boolean): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const { error } = await db
    .from("announcements")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    console.error("後台開關公告失敗：", error.message);
    return false;
  }
  return true;
}
