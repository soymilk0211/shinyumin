-- ============================================================
-- 御茗有限公司 電商網站 — 資料表結構
-- ============================================================
-- 使用方式：整份複製，貼到 Supabase Dashboard 的 SQL Editor，按 Run。
-- 這份 SQL 可以重複執行，不會把已經建好的東西弄壞。
--
-- 建完之後請接著執行 02-seed.sql（匯入測試商品）。
-- ============================================================


-- ------------------------------------------------------------
-- 分類 categories
-- 單層分類：紅茶／烏龍／綠茶。紅茶排第一（招牌商品）。
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- 網址用的英文代號，例：black-tea
  name_zh     text not null,
  name_en     text not null,
  sort_order  integer not null default 0     -- 數字越小排越前面
);


-- ------------------------------------------------------------
-- 商品 products
-- 一款茶（紅玉、阿薩姆…）。有故事、風味、照片。
-- 【商品本身不能被購買】—— 能被購買的是下面的「規格」。
-- ------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,     -- 網址用的英文代號，例：ruby-18
  category_id       uuid not null references public.categories(id) on delete restrict,

  name_zh           text not null,
  name_en           text not null,

  description_zh    text,                     -- 商品故事
  description_en    text,

  tasting_notes_zh  text,                     -- 風味描述
  tasting_notes_en  text,

  image_filename    text,                     -- 只存檔名，對應 /public/images/products/
                                              -- 圖片本身不放資料庫

  sort_order        integer not null default 0,
  is_published      boolean not null default false,   -- false = 網站上看不到
  created_at        timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);


-- ------------------------------------------------------------
-- 規格 variants
-- 一款茶的一種包裝，例：「紅玉 150g 真空罐裝」。
-- 【這是唯一能被加入購物車的單位】—— 價格與販售狀態都掛在這裡。
-- 未來的禮盒 = 新增一筆規格，不需要改架構。
-- ------------------------------------------------------------
create table if not exists public.variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  sku           text not null unique,         -- 貨號，例：YM-RUBY-150

  label_zh      text not null,                -- 例：150g 真空罐裝
  label_en      text not null,

  weight_grams  integer,
  price_twd     integer not null check (price_twd >= 0),   -- 台幣、含稅、整數（沒有小數）

  -- 販售狀態。資料庫存英文代號，網站上顯示中文：
  --   on_sale  = 販售中
  --   sold_out = 售罄     （看得到但不能買）
  --   archived = 已下架   （網站上完全看不到）
  status        text not null default 'on_sale'
                check (status in ('on_sale', 'sold_out', 'archived')),

  sort_order    integer not null default 0
);

create index if not exists variants_product_id_idx on public.variants (product_id);


-- ------------------------------------------------------------
-- 訂單 orders
-- 一次結帳的完整紀錄。
-- ------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,     -- 格式：YM-YYYYMMDD-NNNN

  -- 顧客資料。這是「訂單上的聯絡資料」，不是會員帳號。
  -- email 是未來做會員系統時把舊訂單歸戶的鑰匙，一定要存。
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text not null,

  -- 出貨方式。資料庫存英文代號：
  --   tcat           = 黑貓宅急便  $200
  --   post           = 郵局        $130
  --   post_outlying  = 離島郵局    $250（澎湖／金門／馬祖，不適用免運）
  shipping_method   text not null
                    check (shipping_method in ('tcat', 'post', 'post_outlying')),
  shipping_address  text not null,

  -- 金額。全部由伺服器重新計算後寫入，絕不採用前端傳來的數字。
  subtotal_twd      integer not null check (subtotal_twd >= 0),
  shipping_fee_twd  integer not null check (shipping_fee_twd >= 0),
  total_twd         integer not null check (total_twd >= 0),

  -- 付款。第一版只有 ATM 轉帳，顧客回填末五碼、業主人工對帳。
  -- 「建立訂單」與「付款」刻意拆開，未來要接綠界等金流不需重寫。
  payment_method    text not null default 'atm'
                    check (payment_method in ('atm')),
  payment_status    text not null default 'unpaid'
                    check (payment_status in ('unpaid', 'paid')),
  transfer_last5    text check (transfer_last5 ~ '^[0-9]{5}$'),   -- 轉帳末五碼

  -- 訂單狀態：
  --   pending_payment = 待付款
  --   paid            = 已付款
  --   shipped         = 已出貨
  --   completed       = 已完成
  --   cancelled       = 已取消
  order_status      text not null default 'pending_payment'
                    check (order_status in
                      ('pending_payment', 'paid', 'shipped', 'completed', 'cancelled')),

  -- 發票只收集資料，實際開立在外部系統人工處理。兩欄皆可留空。
  tax_id            text,                     -- 統一編號
  invoice_title     text,                     -- 發票抬頭

  note              text,                     -- 顧客備註
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_order_status_idx on public.orders (order_status);


-- ------------------------------------------------------------
-- 訂單明細 order_items
-- 訂單中的一個品項。
-- 【儲存下單當下的價格快照】—— 業主日後改價，不得影響歷史訂單金額。
-- 所以這裡存的是商品名稱與價格的「副本」，不是每次即時去查 variants。
-- ------------------------------------------------------------
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,

  -- 規格可以為空：萬一該規格日後被刪除，訂單紀錄仍必須完整保留。
  variant_id        uuid references public.variants(id) on delete set null,

  product_name_zh   text not null,            -- 快照
  variant_label_zh  text not null,            -- 快照
  unit_price_twd    integer not null check (unit_price_twd >= 0),   -- 快照

  quantity          integer not null check (quantity > 0),
  line_total_twd    integer not null check (line_total_twd >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);


-- ------------------------------------------------------------
-- 訂單的 updated_at 自動更新
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();


-- ============================================================
-- RLS（Row Level Security）—— 資料的門禁
-- ============================================================
-- 為什麼一定要做：網站的 anon 金鑰會出現在每一位訪客的瀏覽器裡，
-- 等同公開。如果沒有 RLS，任何人拿那把鑰匙就能讀走 orders 裡的
-- 顧客姓名、電話、地址，甚至改價格。
--
-- 規則：
--   商品類（categories / products / variants）→ 訪客【只能讀】，且只讀得到上架的
--   訂單類（orders / order_items）           → 訪客【完全碰不到】
--                                              一律由伺服器端用 service_role 金鑰處理
-- ============================================================

alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.variants    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;


-- 分類：全部公開可讀
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);


-- 商品：只有已上架的看得到
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (is_published = true);


-- 規格：未下架、且所屬商品已上架的才看得到
drop policy if exists "variants_public_read" on public.variants;
create policy "variants_public_read"
  on public.variants for select
  to anon, authenticated
  using (
    status <> 'archived'
    and exists (
      select 1 from public.products p
      where p.id = variants.product_id
        and p.is_published = true
    )
  );


-- 訂單與訂單明細：【刻意不建立任何 policy】
-- RLS 開啟但沒有 policy = 全部拒絕。伺服器端的 service_role 金鑰會繞過 RLS，
-- 所以網站後端仍然能正常讀寫。下面再加一道明確的權限收回，多一層保險。
revoke all on public.orders      from anon, authenticated;
revoke all on public.order_items from anon, authenticated;

-- 商品類也明確收回寫入權限，只留讀取
revoke insert, update, delete on public.categories from anon, authenticated;
revoke insert, update, delete on public.products   from anon, authenticated;
revoke insert, update, delete on public.variants   from anon, authenticated;
