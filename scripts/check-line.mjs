/**
 * LINE 訂單通知健檢
 *
 * 執行方式（在專案資料夾）：
 *   npm run check:line
 *
 * 它會用您設定的鑰匙，實際推一則「測試訂單」的訊息到群組裡。
 * 群組收到訊息，就代表第 5 步設定完成了。
 *
 * 這支程式不會印出任何一把鑰匙的內容。
 */

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const secret = process.env.LINE_CHANNEL_SECRET;
const groupId = process.env.LINE_GROUP_ID;

console.log("");

function missing(name, why) {
  console.log(`❌ 環境變數 ${name} 沒有填`);
  console.log(`   ${why}`);
  console.log("");
  console.log("設定步驟寫在 docs/step-5-line.md，照著做一次就好。");
  process.exit(1);
}

if (!token)
  missing(
    "LINE_CHANNEL_ACCESS_TOKEN",
    "LINE Developers → Messaging API → 最下面的 Channel access token",
  );
if (!secret)
  missing(
    "LINE_CHANNEL_SECRET",
    "LINE Developers → Basic settings → Channel secret",
  );
if (!groupId)
  missing(
    "LINE_GROUP_ID",
    "把機器人加進群組、在群組裡打一句話，機器人會回貼群組 ID",
  );

console.log("✅ 三個設定都有填");
console.log("");
console.log("正在推一則測試訊息到群組…");

const text = [
  "🍵 這是一則測試訊息",
  "",
  "如果您在群組裡看到這一則，代表訂單通知已經接好了。",
  "以後每一張新訂單都會像這樣自動出現在這裡。",
  "",
  "（這則訊息不是真的訂單，不用理它。）",
].join("\n");

const res = await fetch("https://api.line.me/v2/bot/message/push", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ to: groupId, messages: [{ type: "text", text }] }),
});

console.log("");

if (res.ok) {
  console.log("🎉 推播成功。請看一下 LINE 群組，應該已經收到訊息了。");
  console.log("");
  process.exit(0);
}

const body = await res.text();
console.log(`❌ 推播失敗（HTTP ${res.status}）`);
console.log(`   ${body}`);
console.log("");

if (res.status === 401) {
  console.log("這通常代表 LINE_CHANNEL_ACCESS_TOKEN 打錯了，或是已經被重新產生過。");
} else if (res.status === 400) {
  console.log("這通常代表 LINE_GROUP_ID 打錯了，或機器人已經被踢出那個群組。");
} else if (res.status === 429) {
  console.log("這個月的免費推播額度用完了。免費方案每月 200 則。");
}

console.log("");
process.exitCode = 1;
