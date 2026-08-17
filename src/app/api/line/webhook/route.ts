import { replyText, verifyLineSignature } from "@/lib/line";

/**
 * LINE 的 Webhook。
 *
 * 【這支程式存在的唯一理由：拿到群組 ID。】
 *
 * 要把訊息推到某個群組，必須知道那個群組的 ID。而 LINE 的後台
 * 【沒有任何地方看得到群組 ID】—— 這是很多人卡住的地方。
 * 唯一的取得方式是：機器人被加進群組之後，有人在群組裡講話，
 * LINE 會把事件送到這支程式，ID 就藏在事件裡面。
 *
 * 所以這支程式做的事是：收到群組裡的訊息 → 把群組 ID 回貼在群組裡，
 * 讓業主用手機直接複製，貼到 Vercel 的設定裡。不需要看任何後台記錄。
 *
 * 設定完成之後它就安靜下來，只有人在群組裡打「ID」才會再回一次。
 */

/** LINE 的事件長什麼樣子。只取我們用得到的欄位。 */
type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type?: string; groupId?: string; roomId?: string };
  message?: { type?: string; text?: string };
};

/** 在群組裡打這幾個字，可以再把 ID 叫出來一次 */
const ID_KEYWORDS = ["id", "ID", "群組id", "群組ID"];

export async function POST(request: Request) {
  // 【一定要先驗簽章。】這個網址是公開的，任何人都打得到，
  // 不驗的話等於讓路人操控這支程式。
  const rawBody = await request.text();
  if (!verifyLineSignature(rawBody, request.headers.get("x-line-signature"))) {
    return new Response("invalid signature", { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(rawBody)?.events ?? []) as LineEvent[];
  } catch {
    // 內容壞掉也回 200 —— LINE 收不到 200 會一直重送同一筆
    return new Response("ok");
  }

  const configured = Boolean(process.env.LINE_GROUP_ID);

  for (const event of events) {
    const replyToken = event.replyToken;
    if (!replyToken) continue;

    const source = event.source ?? {};
    const id = source.groupId ?? source.roomId ?? null;

    // 機器人被拉進群組的那一刻，直接把 ID 貼出來
    if (event.type === "join" && id) {
      await replyText(replyToken, setupMessage(id));
      continue;
    }

    if (event.type !== "message" || event.message?.type !== "text") continue;

    if (!id) {
      // 有人私訊這個帳號。這是內部通知專用的帳號，不是客服窗口。
      await replyText(
        replyToken,
        "這是御茗的內部通知帳號，不會有人看這裡的訊息。\n有任何問題請直接聯絡我們的官方帳號或來電。",
      );
      continue;
    }

    // 設定完成之前每一句都回；設定完成之後只有打「ID」才回，免得吵。
    const asked = ID_KEYWORDS.includes((event.message.text ?? "").trim());
    if (!configured || asked) {
      await replyText(replyToken, setupMessage(id));
    }
  }

  return new Response("ok");
}

function setupMessage(id: string) {
  return [
    "這個群組的 ID 是：",
    "",
    id,
    "",
    "請長按上面那一行複製，貼到 Vercel 的環境變數 LINE_GROUP_ID。",
    "設定好之後，每一張新訂單都會自動推到這個群組。",
  ].join("\n");
}

/**
 * 用瀏覽器打開這個網址時看到的東西。
 *
 * 【這是給業主自己檢查用的。】設定 LINE 的時候最難確認的一件事是
 * 「網址到底有沒有填對」—— 填錯的話 LINE 那邊也只會說失敗，
 * 不會告訴你錯在哪。用手機瀏覽器打開這個網址，看到下面這段話
 * 就表示網址是通的。
 *
 * 這裡【刻意不顯示任何設定內容】—— 這個網址是公開的，
 * 誰都打得開，不能拿來報告哪一把鑰匙有沒有設定。
 */
export function GET() {
  return new Response(
    [
      "御茗 LINE webhook 正常運作中。",
      "",
      "看到這一行，表示您在 LINE 後台填的 Webhook 網址是通的。",
      "接下來請把機器人加進群組，在群組裡打一句話，",
      "它會把群組 ID 回貼在群組裡。",
      "",
      "（機器人沒有回話的話，多半是「自動回應訊息」還開著，",
      "或是兩把鑰匙填進 Vercel 之後還沒有重新部署。）",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
