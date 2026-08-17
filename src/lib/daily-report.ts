import { readLineQuota } from "@/lib/line";
import { getAdminClient } from "@/lib/supabase-admin";

/**
 * 每日報表。【伺服器端專用。】
 *
 * 每天早上把「昨天賣了什麼」整理成一則 LINE 訊息。
 *
 * 【為什麼不是每來一張訂單就報一次】——那是即時通知在做的事（lib/line.ts）。
 * 日報要回答的是另一個問題：**昨天整體如何、今天有什麼要處理**。
 *
 * 【純樣板，不經過 AI。】跟即時通知同一個理由：數字要對、要準時、要一定送到。
 */

/** 台灣時間的某一天，起訖各是什麼時刻 */
function taipeiDayRange(daysAgo: number) {
  const now = new Date();
  // 先換算成台灣時間的年月日，再往回推幾天
  const taipeiNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const target = new Date(taipeiNow.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, "0");
  const day = String(target.getUTCDate()).padStart(2, "0");

  // 明確寫出 +08:00，不依賴機器所在的時區 ——
  // 網站跑在國外的機房上，用機器時間會把台灣的一天切錯地方。
  const start = new Date(`${year}-${month}-${day}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  // 星期要從【已經加過八小時的 target】上讀，不能從 start 讀。
  // start 是「台灣時間的凌晨」，換算成 UTC 之後會落在前一天下午四點 ——
  // 對它取 getUTCDay() 會少一天（8/17 星期一會被寫成星期日）。
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][target.getUTCDay()];

  return {
    start,
    end,
    label: `${Number(month)}/${Number(day)}（${weekday}）`,
  };
}

function money(twd: number) {
  return `NT$ ${twd.toLocaleString("zh-TW")}`;
}

export type DailyReport = {
  /** 有沒有值得推播的東西。沒有的話就不要推，省下額度。 */
  worthSending: boolean;
  text: string;
};

type OrderRow = {
  order_number: string;
  total_twd: number;
  order_status: string;
  payment_method: string;
};

export async function buildDailyReport(): Promise<DailyReport> {
  const db = getAdminClient();
  if (!db) return { worthSending: false, text: "" };

  const yesterday = taipeiDayRange(1);

  // 昨天成立的訂單
  const { data: orderRows, error } = await db
    .from("orders")
    .select("id, order_number, total_twd, order_status, payment_method")
    .gte("created_at", yesterday.start.toISOString())
    .lt("created_at", yesterday.end.toISOString())
    .order("created_at");

  if (error) {
    console.error("日報讀取訂單失敗：", error.message);
    return { worthSending: false, text: "" };
  }

  const orders = (orderRows ?? []) as unknown as (OrderRow & { id: string })[];

  // 昨天賣出的品項（取消的訂單不算）
  const liveOrderIds = orders
    .filter((order) => order.order_status !== "cancelled")
    .map((order) => order.id);

  const itemLines: string[] = [];
  if (liveOrderIds.length > 0) {
    const { data: itemRows } = await db
      .from("order_items")
      .select("product_name_zh, variant_label_zh, quantity")
      .in("order_id", liveOrderIds);

    // 同一個品項跨訂單合併，看的是「總共要出幾罐」
    const tally = new Map<string, number>();
    for (const row of (itemRows ?? []) as Record<string, unknown>[]) {
      // 包裝標籤只取前面那一段（「四兩・150g 真空包裝」→「四兩」），
      // 一行才不會長到換行
      const size = String(row.variant_label_zh).split("・")[0];
      const key = `${row.product_name_zh} ${size}`;
      tally.set(key, (tally.get(key) ?? 0) + Number(row.quantity));
    }
    for (const [name, quantity] of tally) {
      itemLines.push(`　${name} × ${quantity}`);
    }
  }

  // 目前還沒處理完的訂單（不限昨天）——「今天要做什麼」
  const { data: pendingRows } = await db
    .from("orders")
    .select("order_status")
    .in("order_status", ["pending_payment", "paid"]);

  const pending = (pendingRows ?? []) as { order_status: string }[];
  const waitingPayment = pending.filter(
    (row) => row.order_status === "pending_payment",
  ).length;
  const waitingShipment = pending.filter(
    (row) => row.order_status === "paid",
  ).length;

  const live = orders.filter((order) => order.order_status !== "cancelled");
  const revenue = live.reduce((sum, order) => sum + Number(order.total_twd), 0);

  // 昨天沒訂單、也沒有待處理的事 —— 那就不要推。
  // LINE 免費方案每月只有 200 則，一則「今天沒事」不值得花掉一則。
  if (live.length === 0 && waitingPayment === 0 && waitingShipment === 0) {
    return { worthSending: false, text: "" };
  }

  const lines: string[] = [];
  lines.push(`🍵 御茗日報　${yesterday.label}`);
  lines.push("");

  if (live.length === 0) {
    lines.push("昨天沒有新訂單。");
  } else {
    lines.push(`昨天 ${live.length} 張訂單，${money(revenue)}`);
    if (itemLines.length > 0) {
      lines.push("");
      lines.push(...itemLines);
    }
  }

  if (waitingPayment > 0 || waitingShipment > 0) {
    lines.push("");
    lines.push("──────────");
    if (waitingPayment > 0) {
      lines.push(`待付款　${waitingPayment} 張　← 等客人來電`);
    }
    if (waitingShipment > 0) {
      lines.push(`已付款未出貨　${waitingShipment} 張`);
    }
    lines.push("──────────");
  }

  const quota = await readLineQuota();
  if (quota) {
    lines.push("");
    lines.push(`本月 LINE 推播已用 ${quota.used}／${quota.limit} 則`);
    if (quota.limit - quota.used <= 30) {
      lines.push("⚠️ 額度快用完了。剩下的會留給這則日報。");
      lines.push("個別訂單的即時通知會先暫停，請直接看後台。");
    }
  }

  return { worthSending: true, text: lines.join("\n") };
}
