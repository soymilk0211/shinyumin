"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteAccount,
  endSession,
  getMember,
  sendLoginCode,
  verifyLoginCode,
} from "@/lib/member-auth";
import { rateLimit } from "@/lib/rate-limit";

/**
 * 會員的動作：要驗證碼、送出驗證碼、登出、刪除帳號。
 *
 * 【每一個動作都自己檢查身分。】這些函式雖然是從頁面上按出來的，
 * 但它們本身也是一個網址，沒登入的人可以直接對它送請求。
 * 「頁面有擋」不等於「動作有擋」。
 */

/** 同一個 IP 一小時最多要五組驗證碼 —— 每一組都是一封信，別讓人把額度燒光 */
const CODE_LIMIT = 5;
const CODE_WINDOW_MS = 60 * 60 * 1000;

/** 驗證碼只有六位數字，猜得完。十五分鐘十次，讓暴力嘗試不划算 */
const VERIFY_LIMIT = 10;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return list.get("x-real-ip")?.trim() || "unknown";
}

function cleanEmail(value: FormDataEntryValue | null): string {
  const email = String(value ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/** 要一組驗證碼 */
export async function requestCode(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh");
  const email = cleanEmail(formData.get("email"));

  if (!email) redirect(`/${locale}/account?error=email`);

  const gate = rateLimit(`member-code:${await clientIp()}`, CODE_LIMIT, CODE_WINDOW_MS);
  if (!gate.ok) redirect(`/${locale}/account?error=slow`);

  // 【不管寄成功沒有，畫面都往下走。】不然這個表單會變成
  // 「輸入信箱就能問出這個人是不是我們的客人」的工具。
  await sendLoginCode(email);

  redirect(`/${locale}/account?sent=1&email=${encodeURIComponent(email)}`);
}

/** 送出驗證碼 */
export async function submitCode(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh");
  const email = cleanEmail(formData.get("email"));
  const code = String(formData.get("code") ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);

  if (!email || !code) {
    redirect(`/${locale}/account?sent=1&email=${encodeURIComponent(email)}&error=code`);
  }

  const gate = rateLimit(
    `member-verify:${await clientIp()}`,
    VERIFY_LIMIT,
    VERIFY_WINDOW_MS,
  );
  if (!gate.ok) redirect(`/${locale}/account?error=slow`);

  const member = await verifyLoginCode(email, code);
  if (!member) {
    redirect(`/${locale}/account?sent=1&email=${encodeURIComponent(email)}&error=code`);
  }

  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account`);
}

export async function signOutMember(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh");
  await endSession();
  redirect(`/${locale}/account`);
}

/**
 * 刪除帳號。
 *
 * 【刻意要求再打一次「刪除」兩個字。】這是不可逆的動作，
 * 一個按鈕就能按掉太危險 —— 手機上很容易誤觸。
 */
export async function deleteMemberAccount(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh");

  const member = await getMember();
  if (!member) redirect(`/${locale}/account`);

  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation !== "刪除" && confirmation.toLowerCase() !== "delete") {
    redirect(`/${locale}/account?error=confirm`);
  }

  await deleteAccount(member.userId);

  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account?deleted=1`);
}
