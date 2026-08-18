import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 會員登入。【伺服器端專用。】
 *
 * 【沒有密碼。】客人輸入 email，收到一組六位數字，填進去就登入。
 *
 * 為什麼不用密碼：密碼一定會有人忘記，忘記就要能重設，重設要寄信、
 * 要處理「重設連結被別人撿到」的問題 —— 一整串維護成本，
 * 換來的只是「少收一封信」。驗證碼把這些全部省掉了。
 *
 * 【會員是選配。】不登入一樣買得到東西，結帳流程完全不變。
 * 登入只是多兩件事：一次看完所有訂單、以及可以自己刪帳號。
 *
 * 【驗證碼由 Supabase 寄，session 由我們自己管。】
 * 我們只跟 Supabase 借「寄驗證碼、驗證驗證碼」這兩個動作，
 * 拿到使用者身分之後就發自己的通行證 —— 跟後台用的是同一套作法
 * （見 lib/admin-auth.ts），整個網站只有一種 session 機制，不會兩套打架。
 */

const COOKIE_NAME = "yumin_member";

/** 通行證有效期。客人不是每天來，設太短會一直要重登。 */
const SESSION_DAYS = 30;

/**
 * 簽章用的鑰匙。
 *
 * 【從 service_role 金鑰推導出來，不直接使用它。】
 * 這樣就不用再叫業主多設一個環境變數 —— 他每多設一個就多一次踩坑的機會。
 * 副作用是換掉資料庫金鑰時所有人會被登出，那是可以接受的。
 */
function sessionKey(): string | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update("member-session").digest("hex");
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** 給前台用的連線（寄驗證碼、驗證驗證碼都用這一把，不需要萬能鑰匙） */
function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export type Member = { userId: string; email: string };

/**
 * 寄一組驗證碼給這個信箱。
 *
 * 【信箱不存在也一樣「成功」。】不論這個信箱有沒有註冊過，回應都相同 ——
 * 不然任何人都可以用這個表單一個一個試，問出「誰是你們的客人」。
 */
export async function sendLoginCode(email: string): Promise<boolean> {
  const db = getAuthClient();
  if (!db) return false;

  const { error } = await db.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error("寄送登入驗證碼失敗：", error.message);
    return false;
  }
  return true;
}

/** 驗證碼對了就發通行證，回傳這個人是誰 */
export async function verifyLoginCode(
  email: string,
  token: string,
): Promise<Member | null> {
  const db = getAuthClient();
  if (!db) return null;

  const { data, error } = await db.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.user) return null;

  await startSession(data.user.id, data.user.email ?? email);
  return { userId: data.user.id, email: data.user.email ?? email };
}

async function startSession(userId: string, email: string): Promise<void> {
  const key = sessionKey();
  if (!key) return;

  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  // email 一起放進通行證，才不用為了顯示信箱多查一次資料庫
  const payload = `${userId}|${email}|${expiresAt}`;

  const store = await cookies();
  store.set(COOKIE_NAME, `${btoa(payload)}.${sign(payload, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** 目前這個瀏覽器是誰。沒登入回 null。 */
export async function getMember(): Promise<Member | null> {
  const key = sessionKey();
  if (!key) return null;

  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator < 1) return null;

  const encoded = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  let payload: string;
  try {
    payload = atob(encoded);
  } catch {
    return null;
  }

  if (!safeEqual(signature, sign(payload, key))) return null;

  const [userId, email, expiresAtText] = payload.split("|");
  const expiresAt = Number(expiresAtText);
  if (!userId || !email || !Number.isFinite(expiresAt)) return null;
  if (expiresAt <= Date.now()) return null;

  return { userId, email };
}

/**
 * 刪除帳號。
 *
 * 【刪帳號不等於刪訂單。】訂單的金額與品項是帳務憑證，依法要留一段時間，
 * 所以這裡只做兩件事：把訂單上的 user_id 清掉（訂單變回「訪客下的單」），
 * 然後刪掉登入用的帳號。
 *
 * 資料庫那一邊其實也設了 on delete set null，這裡先清一次是為了
 * 【不依賴另一端的設定】—— 兩道都做，哪一道失效都還有另一道。
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const { error: unlinkError } = await db
    .from("orders")
    .update({ user_id: null })
    .eq("user_id", userId);

  if (unlinkError) {
    console.error("解除訂單與帳號的連結失敗：", unlinkError.message);
    return false;
  }

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) {
    console.error("刪除帳號失敗：", error.message);
    return false;
  }

  await endSession();
  return true;
}
