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

/** 產地與工藝的共同段落。只寫公開事實，不碰製茶機密。 */
const ORIGIN = [
  "我們的製茶廠在南投縣魚池鄉大雁村 —— 日月潭紅茶的核心產區。",
  "茶菁向固定合作的茶農收，茶園海拔約 750 公尺，一年採五季，",
  "其中夏、秋兩季的香味最濃。全程人工採摘。",
].join("");

const PRODUCTS = [
  {
    slug: "ruby-18",
    category: "black-tea",
    name_zh: "紅玉紅茶",
    name_en: "Ruby Black Tea",
    tasting_zh: "花香帶薄荷氣息。適合熱飲，也很適合冷泡。",
    tasting_en:
      "Floral with a note of mint. Good served hot, and excellent cold-brewed.",
    desc_zh: `台茶 18 號，也就是俗稱的紅玉。老闆最推薦的一款，也是最有特色的一款。\n\n${ORIGIN}`,
    desc_en: `Taiwan Tea No. 18, commonly known as Ruby. The one we recommend most, and the most distinctive of our teas.\n\nOur factory is in Dayan Village, Yuchi Township, Nantou — the heart of the Sun Moon Lake black tea region. Leaf is bought from growers we work with regularly; the gardens sit at around 750 metres. We pick five seasons a year, and the summer and autumn pickings carry the strongest aroma. All hand-plucked.`,
    sort: 1,
    sizes: ["150", "75"],
  },
  {
    slug: "assam",
    category: "black-tea",
    name_zh: "阿薩姆紅茶",
    name_en: "Assam Black Tea",
    tasting_zh: "蜜香。可以單喝，也很適合做奶茶。",
    tasting_en: "Honeyed aroma. Good on its own, and holds up well in milk tea.",
    desc_zh: ORIGIN,
    desc_en:
      "Our factory is in Dayan Village, Yuchi Township, Nantou — the heart of the Sun Moon Lake black tea region. Leaf is bought from growers we work with regularly; the gardens sit at around 750 metres. We pick five seasons a year, and the summer and autumn pickings carry the strongest aroma. All hand-plucked.",
    sort: 2,
    sizes: ["150", "75"],
  },
  {
    slug: "taiwan-wild",
    category: "black-tea",
    name_zh: "台灣山茶",
    name_en: "Taiwan Wild Mountain Tea",
    tasting_zh: "肉桂味。適合熱飲，也可以冷泡。",
    tasting_en: "Cinnamon character. Good served hot, and fine cold-brewed.",
    desc_zh: `產量很少的一款。\n\n${ORIGIN}`,
    desc_en: `Made in small quantities.\n\nOur factory is in Dayan Village, Yuchi Township, Nantou — the heart of the Sun Moon Lake black tea region. Leaf is bought from growers we work with regularly; the gardens sit at around 750 metres. We pick five seasons a year, and the summer and autumn pickings carry the strongest aroma. All hand-plucked.`,
    sort: 3,
    sizes: ["150", "75"],
  },
  {
    slug: "high-mountain",
    category: "oolong-tea",
    name_zh: "高山茶",
    name_en: "High Mountain Oolong",
    tasting_zh: null,
    tasting_en: null,
    desc_zh: ORIGIN,
    desc_en:
      "Our factory is in Dayan Village, Yuchi Township, Nantou. Leaf is bought from growers we work with regularly; the gardens sit at around 750 metres.",
    sort: 4,
    sizes: ["150"],
  },
  {
    // 綠茶老闆說「先不要賣」→ 建好但不上架，之後在後台按一下就能開賣
    slug: "green-tea",
    category: "green-tea",
    name_zh: "綠茶",
    name_en: "Green Tea",
    tasting_zh: null,
    tasting_en: null,
    desc_zh: ORIGIN,
    desc_en: "Our factory is in Dayan Village, Yuchi Township, Nantou.",
    sort: 5,
    sizes: ["150"],
    unpublished: true,
  },
];

/** 兩種規格。老闆用「兩」報價，網站兩種單位都標出來 */
const SIZES = {
  "150": {
    label_zh: "四兩・150g 鐵罐",
    label_en: "150g tin",
    grams: 150,
    price: 600,
  },
  "75": {
    label_zh: "二兩・75g 鐵罐",
    label_en: "75g tin",
    grams: 75,
    price: 350,
  },
};

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

  for (const size of product.sizes) {
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
        price_twd: spec.price,
        status: "on_sale",
        sort_order: size === "150" ? 1 : 2,
      }),
    });
  }

  console.log(
    `✅ ${product.name_zh}${product.unpublished ? "（未上架）" : ""} — ${product.sizes
      .map((s) => `${SIZES[s].label_zh} NT$${SIZES[s].price}`)
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

console.log("\n完成。");
