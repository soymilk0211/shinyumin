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


// ── 系統檢查 ────────────────────────────────────────────

export type CheckResult = {
  status: "idle" | "ok" | "fail";
  message: string;
};

/**
 * 按一下，當場試一次寄信或推播，並把服務商回的原文顯示出來。
 *
 * 【為什麼要有這個】：這些動作平常是在背景跑的，失敗只會寫進伺服器記錄，
 * 業主用手機看不到。做成一個按鈕，出問題時才有辦法自己查，
 * 或至少把錯誤訊息原封不動貼給我。
 *
 * 【不翻譯錯誤訊息。】服務商寫的原文通常已經講清楚原因，
 * 我自己轉述反而會漏掉關鍵字。
 */
export async function runSystemCheck(
  _previous: CheckResult,
  formData: FormData,
): Promise<CheckResult> {
  if (!(await isSignedIn())) redirect("/admin/login");

  // 測試也會消耗額度與寄信配額，所以一樣要限流
  const gate = rateLimit(`admin-check:${await clientIp()}`, 6, 10 * 60 * 1000);
  if (!gate.ok) {
    return { status: "fail", message: "測試太多次了，請等十分鐘再試。" };
  }

  const kind = String(formData.get("kind") ?? "");

  if (kind === "email") return await checkEmail();
  if (kind === "line") return await checkLine();
  return { status: "fail", message: "不認得的檢查項目。" };
}

async function checkEmail(): Promise<CheckResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      status: "fail",
      message:
        "Vercel 上沒有 RESEND_API_KEY。可能是還沒存，或是存了之後還沒重新部署 —— 環境變數要重新部署才會生效。",
    };
  }

  const to = process.env.ORDER_ARCHIVE_EMAIL || "tim78937@gmail.com";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SHIN-YU-MIN Orders <onboarding@resend.dev>",
        to: [to],
        subject: "【御茗】寄信測試",
        html: "<p>這是從後台的系統檢查寄出的測試信。</p><p>收到這一封，代表訂單存檔信也會寄得出去。</p>",
      }),
      signal: AbortSignal.timeout(10000),
    });

    const body = await res.text();

    if (res.ok) {
      return {
        status: "ok",
        message: `已送出到 ${to}。請看一下信箱（也看一下垃圾信匣）。\n\nResend 回應：${body}`,
      };
    }
    return {
      status: "fail",
      message: `收件人：${to}\nHTTP ${res.status}\n\nResend 回的原文：\n${body}`,
    };
  } catch (error) {
    return {
      status: "fail",
      message: `連不上 Resend：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkLine(): Promise<CheckResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    return {
      status: "fail",
      message: `缺少設定：${!token ? "LINE_CHANNEL_ACCESS_TOKEN " : ""}${!groupId ? "LINE_GROUP_ID" : ""}`.trim(),
    };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: groupId,
        messages: [
          { type: "text", text: "🍵 這是從後台按出來的測試訊息，不是真的訂單。" },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const body = await res.text();
    if (res.ok) {
      return { status: "ok", message: "已推送到群組，請看一下 LINE。" };
    }
    return {
      status: "fail",
      message: `HTTP ${res.status}\n\nLINE 回的原文：\n${body}`,
    };
  } catch (error) {
    return {
      status: "fail",
      message: `連不上 LINE：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
