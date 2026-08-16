/**
 * Supabase 連線與門禁（RLS）健檢
 *
 * 執行方式（在專案資料夾）：
 *   npm run check:supabase
 *
 * 這支程式會做三件事：
 *   1. 確認網站連得上資料庫，測試商品讀得到
 *   2. 確認【訪客讀不到訂單】—— 這是最重要的一項，攸關顧客個資
 *   3. 確認【訪客改不了價格】
 *
 * 它只會印出「通過／失敗」，不會印出任何一把鑰匙的內容。
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const results = [];
let failed = 0;

function record(ok, title, detail) {
  results.push({ ok, title, detail });
  if (!ok) failed++;
  console.log(`${ok ? "✅" : "❌"} ${title}`);
  if (detail) console.log(`   ${detail}`);
}

function missing(name) {
  console.log(`❌ 環境變數 ${name} 沒有填`);
  console.log("");
  console.log("請在專案資料夾建立 .env.local 檔案（可以複製 .env.example 改名），");
  console.log("把 Supabase 後台 Settings → API 頁面上的值填進去，再重新執行。");
  process.exit(1);
}

if (!url) missing("NEXT_PUBLIC_SUPABASE_URL");
if (!anonKey) missing("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** 對 Supabase 的資料 API 發一個請求，回傳 { status, body } */
async function request(path, key, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

console.log("");
console.log(`檢查對象：${url}`);
console.log("");
console.log("── 一、網站讀得到商品嗎 ──────────────────");

// 分類
{
  const { status, body } = await request(
    "categories?select=slug,name_zh&order=sort_order",
    anonKey,
  );
  const ok = status === 200 && Array.isArray(body) && body.length > 0;
  record(
    ok,
    "讀取分類",
    ok
      ? `找到 ${body.length} 個分類：${body.map((c) => c.name_zh).join("、")}`
      : `HTTP ${status} ${JSON.stringify(body)}`,
  );
}

// 商品
{
  const { status, body } = await request(
    "products?select=slug,name_zh,is_published&order=sort_order",
    anonKey,
  );
  const ok = status === 200 && Array.isArray(body) && body.length > 0;
  record(
    ok,
    "讀取商品",
    ok
      ? `找到 ${body.length} 款茶：${body.map((p) => p.name_zh).join("、")}`
      : `HTTP ${status} ${JSON.stringify(body)}`,
  );
}

// 規格
{
  const { status, body } = await request(
    "variants?select=sku,label_zh,price_twd,status&order=sort_order",
    anonKey,
  );
  const ok = status === 200 && Array.isArray(body) && body.length > 0;
  record(
    ok,
    "讀取規格與價格",
    ok
      ? body.map((v) => `${v.label_zh} NT$${v.price_twd}（${v.status}）`).join("　")
      : `HTTP ${status} ${JSON.stringify(body)}`,
  );
}

console.log("");
console.log("── 二、門禁：訪客碰得到不該碰的東西嗎 ──────");

// 訂單必須讀不到
{
  const { status, body } = await request("orders?select=id", anonKey);
  const ok = status === 401 || status === 403 || status === 404;
  record(
    ok,
    "訪客讀取訂單 → 應該被擋下",
    ok
      ? `已被擋下（HTTP ${status}）—— 顧客個資安全`
      : `⚠️ 危險：訪客讀得到訂單！HTTP ${status} ${JSON.stringify(body)}`,
  );
}

// 訂單明細必須讀不到
{
  const { status, body } = await request("order_items?select=id", anonKey);
  const ok = status === 401 || status === 403 || status === 404;
  record(
    ok,
    "訪客讀取訂單明細 → 應該被擋下",
    ok
      ? `已被擋下（HTTP ${status}）`
      : `⚠️ 危險：訪客讀得到訂單明細！HTTP ${status} ${JSON.stringify(body)}`,
  );
}

// 改價必須失敗（刻意把 sort_order 改成它原本就有的值，就算萬一寫成功也不會弄壞資料）
{
  const { status, body } = await request("variants?sku=eq.YM-RUBY-150", anonKey, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ sort_order: 1 }),
  });
  const ok = status === 401 || status === 403 || status === 404;
  record(
    ok,
    "訪客修改規格 → 應該被擋下",
    ok
      ? `已被擋下（HTTP ${status}）—— 價格無法從瀏覽器竄改`
      : `⚠️ 危險：訪客改得動規格！HTTP ${status} ${JSON.stringify(body)}`,
  );
}

// 新增分類必須失敗
{
  const { status, body } = await request("categories", anonKey, {
    method: "POST",
    body: JSON.stringify({
      slug: "rls-test-should-fail",
      name_zh: "測試",
      name_en: "Test",
    }),
  });
  const ok = status === 401 || status === 403 || status === 404;
  record(
    ok,
    "訪客新增分類 → 應該被擋下",
    ok
      ? `已被擋下（HTTP ${status}）`
      : `⚠️ 危險：訪客寫得進資料庫！HTTP ${status} ${JSON.stringify(body)}`,
  );
}

console.log("");
console.log("── 三、伺服器端的萬能鑰匙可以用嗎 ──────────");

if (!serviceKey) {
  record(false, "SUPABASE_SERVICE_ROLE_KEY 沒有填", "第 4 步的結帳功能會需要它");
} else {
  const { status, body } = await request("orders?select=id&limit=1", serviceKey);
  const ok = status === 200;
  record(
    ok,
    "伺服器端讀取訂單",
    ok
      ? `可以正常讀取（目前 ${Array.isArray(body) ? body.length : 0} 筆）`
      : `HTTP ${status} ${JSON.stringify(body)}`,
  );
}

console.log("");
if (failed === 0) {
  console.log("🎉 全部通過。資料庫已經接好，而且門禁是鎖上的。");
} else {
  console.log(`⚠️ 有 ${failed} 項沒通過，請把上面的訊息貼給我，我來處理。`);
  process.exitCode = 1;
}
console.log("");
