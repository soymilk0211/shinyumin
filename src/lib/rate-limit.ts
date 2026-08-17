/**
 * 簡易速率限制。
 *
 * 要防的不是 DDoS（那種流量層級的攻擊由 Vercel 自動處理），
 * 而是【應用層的濫用】—— 有人寫一支小程式對結帳網址連按一萬次，
 * 資料庫就會塞滿假訂單，業主的 LINE 也會被灌爆。
 *
 * 作法是最單純的一種：在記憶體裡記住「這個 IP 最近送了幾次」。
 *
 * 【已知的限制，寫在這裡免得日後誤會】
 * Vercel 上同時可能有好幾台機器在服務，各自有各自的記憶體，
 * 所以實際的上限會比設定值寬鬆一些；機器重開時計數也會歸零。
 * 對「擋住手滑連按與陽春的灌單程式」這個目的來說已經夠用。
 * 日後若真的遇到有耐心的攻擊者，再換成共用的計數器（例如 Upstash Redis）。
 */

type Bucket = {
  count: number;
  /** 這個計數什麼時候歸零（毫秒時間戳） */
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** 順手清掉過期的紀錄，避免記憶體越積越多 */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** 還要等幾秒才能再試 */
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * 從請求中取得訪客的 IP。
 *
 * 網站前面隔著 Vercel 的伺服器，所以真正的訪客 IP 在 `x-forwarded-for`
 * 這個標頭的第一個位置。取不到時回傳 "unknown" —— 那些請求會共用同一個
 * 計數器，寧可嚴格一點也不要完全不擋。
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
