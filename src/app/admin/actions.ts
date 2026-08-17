"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  endSession,
  isSignedIn,
  startSession,
} from "@/lib/admin-auth";
import { setOrderStatus, type OrderStatus } from "@/lib/admin-orders";
import { rateLimit } from "@/lib/rate-limit";

/**
 * 後台的動作。
 *
 * 【每一個動作都要自己檢查有沒有登入。】這些函式雖然是從後台頁面
 * 呼叫的，但它們同時也是一個網址 —— 沒有登入的人可以直接對它送請求。
 * 「頁面有擋」不等於「動作有擋」。
 */

/** 同一個 IP 十分鐘內最多試 8 次密碼 */
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return list.get("x-real-ip")?.trim() || "unknown";
}

export async function signIn(formData: FormData) {
  // 【密碼一定要限制嘗試次數。】只有一組密碼，不擋的話
  // 寫個小程式一秒試幾百次，遲早會被試出來。
  const gate = rateLimit(`admin-login:${await clientIp()}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!gate.ok) redirect("/admin/login?error=slow");

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) redirect("/admin/login?error=wrong");

  await startSession();
  redirect("/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}

export async function updateOrderStatus(formData: FormData) {
  if (!(await isSignedIn())) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return;

  await setOrderStatus(id, status);

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
}
