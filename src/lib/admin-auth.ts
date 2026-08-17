import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 後台的門鎖。【伺服器端專用。】
 *
 * 第一版只用【一組密碼】，存在環境變數裡，沒有帳號、沒有註冊。
 * 理由：會用後台的只有業主一家人，做完整的帳號系統是把簡單的事變複雜。
 * 日後真的需要多人各自登入時可以換成 Supabase Auth，換的時候
 * 只有這個檔案要改，其他頁面不用動。
 *
 * 【密碼不會寫進 Cookie。】登入成功後放進瀏覽器的是一張「通行證」：
 * 上面只有到期時間，加上一段用密碼算出來的簽章。
 * 別人拿到那張通行證也回推不出密碼；改上面的到期時間簽章就對不起來。
 *
 * 副作用（刻意的）：業主換密碼之後，所有已經登入的裝置會一起被登出。
 */

const COOKIE_NAME = "yumin_admin";

/** 通行證有效期。業主用手機，設太短會一直要重登。 */
const SESSION_DAYS = 14;

function secret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** 兩段字串比對，但花的時間跟內容無關 —— 避免用「錯在第幾個字」猜密碼 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** 後台有沒有設定密碼。沒設定的話後台一律拒絕進入，不是放行。 */
export function isAdminConfigured(): boolean {
  return Boolean(secret());
}

export function checkPassword(input: string): boolean {
  const key = secret();
  if (!key) return false;
  return safeEqual(input, key);
}

/** 登入成功，發一張通行證 */
export async function startSession(): Promise<void> {
  const key = secret();
  if (!key) return;

  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);

  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload, key)}`, {
    httpOnly: true, // 網頁上的程式讀不到，降低被偷走的機會
    sameSite: "lax", // 從別的網站送過來的請求不會帶上它
    secure: process.env.NODE_ENV === "production", // 本機開發是 http，不能強制
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** 目前這個瀏覽器有沒有有效的通行證 */
export async function isSignedIn(): Promise<boolean> {
  const key = secret();
  if (!key) return false;

  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const separator = raw.lastIndexOf(".");
  if (separator < 1) return false;

  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  if (!safeEqual(signature, sign(payload, key))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
