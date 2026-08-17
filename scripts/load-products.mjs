/**
 * 依照老闆訪談的回覆，把真實的商品與價格寫進資料庫。
 *
 * 執行方式（在專案資料夾）：
 *   npm run load:products
 *
 * 這支程式用 service_role 金鑰直接寫入資料庫，**可以重複執行** ——
 * 以 slug／sku 為準覆蓋同一筆，不會產生重複資料。
 *
 * 資料來源：docs/content-interview.md 的老闆回覆（2026-08-17）。
 * 之後價格與文案應該由業主在後台改，不要再回頭改這支程式。
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("❌ 找不到 .env.local 裡的資料庫網址或 service_role 金鑰");
  process.exit(1);
}

async function api(path, init = {}) {
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
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${path} → HTTP ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

/**
 * 【商品介紹只寫這一款茶自己的事。】
 *
 * 產區、海拔、採收季節、人工採摘這些「每一款都一樣」的事實，
 * 一律放在品牌故事頁講一次就好（`src/i18n/dictionaries/*.json` 的 story 段落）。
 *
 * 原本每一款商品下面都貼同一段產區介紹，業主看到之後說
 * 「是一樣的沒錯，但我不想用同個文案」—— 完全正確：
 * 同一段字重複四次，讀者第二次就不看了，也顯得沒有誠意。
 *
 * 每一款茶的專屬文案要等老闆提供，在那之前寧可留空。
 */

const PRODUCTS = [
  {
    slug: "ruby-18",
    category: "black-tea",
    name_zh: "紅玉紅茶",
    name_en: "Ruby Black Tea",
    tasting_zh: "花香帶薄荷氣息。適合熱飲，也很適合冷泡。",
    tasting_en:
      "Floral with a note of mint. Good served hot, and excellent cold-brewed.",
    desc_zh: "台茶 18 號，也就是俗稱的紅玉。老闆最推薦的一款，也是最有特色的一款。",
    desc_en:
      "Taiwan Tea No. 18, commonly known as Ruby. The one we recommend most, and the most distinctive of our teas.",
    sort: 1,
    variants: [
      ["150", 600],
      ["75", 350],
    ],
  },
  {
    slug: "assam",
    category: "black-tea",
    name_zh: "阿薩姆紅茶",
    name_en: "Assam Black Tea",
    tasting_zh: "蜜香。可以單喝，也很適合做奶茶。",
    tasting_en: "Honeyed aroma. Good on its own, and holds up well in milk tea.",
    // 專屬文案還沒有，先留空 —— 不要拿產區介紹充數
    desc_zh: null,
    desc_en: null,
    sort: 2,
    variants: [
      ["150", 600],
      ["75", 350],
    ],
  },
  {
    slug: "taiwan-wild",
    category: "black-tea",
    name_zh: "台灣山茶",
    name_en: "Taiwan Wild Mountain Tea",
    tasting_zh: "肉桂味。適合熱飲，也可以冷泡。",
    tasting_en: "Cinnamon character. Good served hot, and fine cold-brewed.",
    desc_zh: "產量很少的一款。",
    desc_en: "Made in small quantities.",
    sort: 3,
    variants: [
      ["150", 600],
      ["75", 350],
    ],
  },
  {
    slug: "high-mountain",
    category: "oolong-tea",
    name_zh: "高山茶",
    name_en: "High Mountain Oolong",
    tasting_zh: null,
    tasting_en: null,
    // 業主表示烏龍的介紹不是這樣，先留空等老闆提供。
    // 上面那段 ORIGIN 講的是紅茶的產區與採收方式，套到高山茶並不成立
    // （而且 750 公尺也不該叫高山茶）。
    desc_zh: null,
    desc_en: null,
    sort: 4,
    variants: [["150", 600]],
  },
  // ── 以下三款是業主 2026-08-17 補的烏龍 ─────────────────
  // 【價格與紅茶差很多，這是對的，不要「順手改成一致」】——
  // 四季春與焙火／碳焙是平價的日常茶，高山茶是另一個等級。
  {
    slug: "four-seasons",
    category: "oolong-tea",
    name_zh: "四季春茶",
    name_en: "Four Seasons Oolong",
    tasting_zh: null,
    tasting_en: null,
    desc_zh: null,
    desc_en: null,
    sort: 5,
    variants: [
      ["150", 200],
      ["600", 600],
    ],
  },
  // 焙火烏龍與碳焙烏龍：業主說【先不要上網頁，但之後可能還會上】，
  // 所以資料留在資料庫裡、只是不上架。要開賣時把 unpublished 拿掉重跑，
  // 或日後在後台按一下就好 —— 不必重新建資料。
  {
    slug: "roasted-oolong",
    category: "oolong-tea",
    name_zh: "焙火烏龍",
    name_en: "Roasted Oolong",
    tasting_zh: null,
    tasting_en: null,
    desc_zh: null,
    desc_en: null,
    sort: 6,
    variants: [
      ["150", 150],
      ["600", 450],
    ],
    unpublished: true,
  },
  {
    slug: "charcoal-oolong",
    category: "oolong-tea",
    name_zh: "碳焙烏龍",
    name_en: "Charcoal-Roasted Oolong",
    tasting_zh: null,
    tasting_en: null,
    desc_zh: null,
    desc_en: null,
    sort: 7,
    variants: [
      ["150", 150],
      ["600", 450],
    ],
    unpublished: true,
  },
];

/**
 * 包裝規格。老闆習慣用「兩」報價，網站上兩種單位並陳。
 * 台制一斤 = 十六兩 = 600 克，所以四兩剛好是 150 克。
 *
 * 【全部都是真空包裝，沒有鐵罐。】業主 2026-08-17 更正 ——
 * 早期的 HANDOVER 寫「鐵罐外包裝 + 真空袋內包裝」，那是錯的。
 *
 * 【價格不在這裡】—— 同一個包裝在不同茶款是不同價錢
 * （四兩的四季春 $200、四兩的高山茶 $600），所以價格掛在各自的商品上。
 */
const SIZES = {
  "600": {
    label_zh: "一斤・600g 真空包裝",
    label_en: "600g vacuum pack (1 catty)",
    grams: 600,
  },
  "150": {
    label_zh: "四兩・150g 真空包裝",
    label_en: "150g vacuum pack",
    grams: 150,
  },
  "75": {
    label_zh: "二兩・75g 真空包裝",
    label_en: "75g vacuum pack",
    grams: 75,
  },
};

/** 大包裝排前面，小包裝排後面 */
const SIZE_ORDER = { "600": 1, "150": 2, "75": 3 };

/**
 * 要從資料庫移除的商品。
 * 綠茶：業主 2026-08-17 說「幫我刪掉」。它從來沒有上架過，也沒有訂單用到它。
 */
const REMOVE_SLUGS = ["green-tea"];

const categories = await api("categories?select=id,slug");
const categoryId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

for (const product of PRODUCTS) {
  const [row] = await api("products?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      slug: product.slug,
      category_id: categoryId[product.category],
      name_zh: product.name_zh,
      name_en: product.name_en,
      description_zh: product.desc_zh,
      description_en: product.desc_en,
      tasting_notes_zh: product.tasting_zh,
      tasting_notes_en: product.tasting_en,
      sort_order: product.sort,
      is_published: !product.unpublished,
    }),
  });

  for (const [size, price] of product.variants) {
    const spec = SIZES[size];
    await api("variants?on_conflict=sku", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        product_id: row.id,
        sku: `YM-${product.slug.toUpperCase()}-${size}`,
        label_zh: spec.label_zh,
        label_en: spec.label_en,
        weight_grams: spec.grams,
        price_twd: price,
        status: "on_sale",
        sort_order: SIZE_ORDER[size],
      }),
    });
  }

  console.log(
    `✅ ${product.name_zh}${product.unpublished ? "（未上架）" : ""} — ${product.variants
      .map(([size, price]) => `${SIZES[size].label_zh} NT$${price}`)
      .join("、")}`,
  );
}

// 舊的測試規格（我暫填的 650／380）已被新價格取代，把殘留的下架
const stale = await api("variants?sku=in.(YM-RUBY-150,YM-RUBY-075)&select=sku");
if (stale.length > 0) {
  await api("variants?sku=in.(YM-RUBY-150,YM-RUBY-075)", {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" }),
  });
  console.log(`\n🧹 舊的測試規格已下架：${stale.map((s) => s.sku).join("、")}`);
}

// 業主指名要移除的商品。
// 規格會跟著商品一起刪掉；歷史訂單不受影響 —— order_items 存的是
// 下單當下的商品名稱與價格「快照」，不是每次回頭查商品表。
for (const slug of REMOVE_SLUGS) {
  const found = await api(`products?slug=eq.${slug}&select=id,name_zh`);
  if (found.length === 0) continue;

  await api(`products?slug=eq.${slug}`, { method: "DELETE" });
  console.log(`\n🗑️ 已從資料庫移除：${found[0].name_zh}`);
}

console.log("\n完成。");
