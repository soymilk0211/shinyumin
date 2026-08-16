-- ============================================================
-- 御茗有限公司 電商網站 — 測試資料
-- ============================================================
-- 使用方式：先跑完 01-schema.sql，再整份複製這一份貼到 SQL Editor 按 Run。
-- 這份 SQL 可以重複執行，重跑只會把內容更新成最新版，不會產生重複資料。
--
-- ⚠️ 這裡的文案是初稿，是為了讓網站有東西可以顯示。
--    正式文案請業主過目後再調整（第 3 步會處理）。
-- ============================================================


-- ------------------------------------------------------------
-- 分類：紅茶排第一（招牌商品）
-- ------------------------------------------------------------
insert into public.categories (slug, name_zh, name_en, sort_order) values
  ('black-tea',  '紅茶',   'Black Tea',  1),
  ('oolong-tea', '烏龍茶', 'Oolong Tea', 2),
  ('green-tea',  '綠茶',   'Green Tea',  3)
on conflict (slug) do update set
  name_zh    = excluded.name_zh,
  name_en    = excluded.name_en,
  sort_order = excluded.sort_order;


-- ------------------------------------------------------------
-- 商品：紅玉紅茶（台茶 18 號）—— 主力商品
-- ------------------------------------------------------------
insert into public.products (
  slug, category_id, name_zh, name_en,
  description_zh, description_en,
  tasting_notes_zh, tasting_notes_en,
  image_filename, sort_order, is_published
) values (
  'ruby-18',
  (select id from public.categories where slug = 'black-tea'),
  '紅玉紅茶（台茶 18 號）',
  'Ruby Black Tea (Taiwan Tea No. 18)',

  -- 商品故事：寫實際的產區與家族工藝，不寫空泛的形容詞
  '我們的茶園與製茶廠都在南投縣魚池鄉大雁村 —— 日月潭紅茶的核心產區。' ||
  '這裡不是我們挑選的產地，是我們家世代生活與製茶的地方。' || E'\n\n' ||
  '紅玉是台灣自己培育出來的品種，由台灣野生山茶與緬甸大葉種雜交而成，' ||
  '正式編號台茶 18 號。它的香氣是品種本身帶來的，不是任何外加的香料。' || E'\n\n' ||
  '從採菁、萎凋、揉捻到發酵、乾燥，都在自家廠房完成，由家人親手看顧。',

  'Our tea garden and factory are both in Dayan Village, Yuchi Township, Nantou — '  ||
  'the heart of the Sun Moon Lake black tea region. This is not a sourcing choice; ' ||
  'it is where our family has lived and made tea for generations.' || E'\n\n' ||
  'Ruby is a Taiwanese cultivar, bred from native wild Taiwan tea and Burmese '      ||
  'large-leaf assamica, officially registered as Taiwan Tea No. 18. Its aroma comes '||
  'from the cultivar itself — nothing is added.' || E'\n\n' ||
  'Plucking, withering, rolling, oxidation and drying all happen in our own '        ||
  'factory, tended by hand.',

  -- 風味描述
  '天然的肉桂與薄荷氣息，是紅玉這個品種特有的香氣。茶湯明亮紅豔，入口滑順、' ||
  '尾韻回甘而不澀。適合純飲，也耐得住鮮奶，做成奶茶依然吃得出茶味。',

  'Natural notes of cinnamon and mint — the signature character of the Ruby cultivar. ' ||
  'A bright, clear red liquor; smooth on the palate with a sweet finish and no '        ||
  'astringency. Excellent on its own, and strong enough to hold up in milk tea.',

  null,      -- 商品照片還沒有，第 3 步會先用佔位符
  1,
  true
)
on conflict (slug) do update set
  category_id      = excluded.category_id,
  name_zh          = excluded.name_zh,
  name_en          = excluded.name_en,
  description_zh   = excluded.description_zh,
  description_en   = excluded.description_en,
  tasting_notes_zh = excluded.tasting_notes_zh,
  tasting_notes_en = excluded.tasting_notes_en,
  sort_order       = excluded.sort_order,
  is_published     = excluded.is_published;


-- ------------------------------------------------------------
-- 規格：紅玉的兩種包裝
-- 【只有規格能被加入購物車】
-- ------------------------------------------------------------
insert into public.variants (
  product_id, sku, label_zh, label_en, weight_grams, price_twd, status, sort_order
) values
  (
    (select id from public.products where slug = 'ruby-18'),
    'YM-RUBY-150', '150g 真空罐裝', '150g Vacuum-sealed Tin', 150,
    650,          -- 業主已確認
    'on_sale', 1
  ),
  (
    (select id from public.products where slug = 'ruby-18'),
    'YM-RUBY-075', '75g 真空罐裝', '75g Vacuum-sealed Tin', 75,
    380,          -- ⚠️ 暫定價格，業主尚未確認。確認後可直接改這個數字重跑，或第 6 步在後台改
    'on_sale', 2
  )
on conflict (sku) do update set
  product_id   = excluded.product_id,
  label_zh     = excluded.label_zh,
  label_en     = excluded.label_en,
  weight_grams = excluded.weight_grams,
  price_twd    = excluded.price_twd,
  status       = excluded.status,
  sort_order   = excluded.sort_order;
