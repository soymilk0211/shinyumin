import { lookupOrder } from "@/lib/order-lookup";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * 客人查自己的訂單。
 *
 * 【限流是這支程式的重點，不是附加功能。】
 * 訂單編號是猜得到的，真正擋住別人的是「電話後四碼」那一萬種組合。
 * 但一萬種對程式來說不算多 —— 是限流讓它變得不值得試。
 *
 * 十五分鐘五次：正常客人查自己的訂單不會打錯五次，
 * 想暴力破解的人一天最多試四百多次，離一萬還很遠。
 */

const LOOKUP_LIMIT = 5;
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(
    `order-lookup:${clientIp(request)}`,
    LOOKUP_LIMIT,
    LOOKUP_WINDOW_MS,
  );
  if (!gate.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const orderNumber =
    typeof raw.orderNumber === "string" ? raw.orderNumber.slice(0, 40) : "";
  const phoneLast4 =
    typeof raw.phoneLast4 === "string" ? raw.phoneLast4.slice(0, 10) : "";

  const order = await lookupOrder(orderNumber, phoneLast4);

  // 【查不到與電話不符回傳一模一樣的東西。】
  // 分開回應的話，對方可以用「這個編號存在」反推出我們有多少訂單。
  if (!order) {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return Response.json({ ok: true, order });
}
