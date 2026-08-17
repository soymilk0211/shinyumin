-- ============================================================
-- 御茗有限公司 電商網站 — 資料庫檢查
-- ============================================================
-- 用來確認 01-schema.sql 與 02-seed.sql 有沒有真的跑成功。
--
-- 使用方式：整份複製，貼到 Supabase 的 SQL Editor，按 Run。
-- 這份 SQL 只是「查看」，不會改動任何東西，可以隨時執行。
--
-- 為什麼需要這一份：Table Editor 在手機上會把左邊的資料表清單收起來，
-- 看起來像是沒有任何資料表。用 SQL 查最準。
-- ============================================================


-- ------------------------------------------------------------
-- 一、五張資料表在不在？門禁（RLS）開了沒？
-- ------------------------------------------------------------
-- 預期：五列，「已啟用RLS」全部是 true
--       商品類各 1 條政策，訂單類 0 條（0 條 = 全部拒絕，這是正確的）
select
  c.relname                                   as 資料表,
  c.relrowsecurity                            as 已啟用RLS,
  (select count(*) from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = c.relname)            as 政策數
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;


-- ------------------------------------------------------------
-- 二、測試資料進去了沒？
-- ------------------------------------------------------------
-- 預期：categories 3、products 1、variants 2、orders 0、order_items 0
select 'categories'  as 資料表, count(*) as 筆數 from public.categories
union all
select 'products',   count(*) from public.products
union all
select 'variants',   count(*) from public.variants
union all
select 'orders',     count(*) from public.orders
union all
select 'order_items', count(*) from public.order_items
order by 資料表;


-- ------------------------------------------------------------
-- 三、商品長什麼樣子？
-- ------------------------------------------------------------
-- 預期：兩列，紅玉紅茶的 150g（650）與 75g（380）
select
  p.name_zh   as 商品,
  v.label_zh  as 規格,
  v.price_twd as 價格,
  v.status    as 狀態,
  v.sku       as 貨號
from public.variants v
join public.products p on p.id = v.product_id
order by v.sort_order;
