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
import {
  setProductPublished,
  setVariantPrice,
  setVariantStatus,
  type AdminVariant,
} from "@/lib/admin-products";
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

  if (!isUuid(id)) return;

  await setOrderStatus(id, status);

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
}

// ── 商品與價格 ──────────────────────────────────────────

export async function updateVariantPrice(formData: FormData) {
  if (!(await isSignedIn())) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const price = Number(String(formData.get("price") ?? "").trim());

  if (!isUuid(id)) return;

  await setVariantPrice(id, price);
  refreshShop();
}

export async function updateVariantStatus(formData: FormData) {
  if (!(await isSignedIn())) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as AdminVariant["status"];

  if (!isUuid(id)) return;
  if (!["on_sale", "sold_out", "archived"].includes(status)) return;

  await setVariantStatus(id, status);
  refreshShop();
}

export async function updateProductPublished(formData: FormData) {
  if (!(await isSignedIn())) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";

  if (!isUuid(id)) return;

  await setProductPublished(id, published);
  refreshShop();
}

/**
 * 改完價格或狀態之後，把前台的頁面一起更新。
 *
 * 前台為了跑得快，會把頁面暫存起來（最多一分鐘）。不特別講一聲的話，
 * 業主改完價格回前台看，會以為沒有生效 —— 其實只是還在看舊的那一份。
 */
function refreshShop() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

/** 資料庫的 ID 都是 UUID，長度固定。順手擋掉亂塞的字串。 */
function isUuid(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}
