-- ============================================================
-- 御茗有限公司 電商網站 — 付款方式改版
-- ============================================================
-- 使用方式：整份複製，貼到 Supabase Dashboard 的 SQL Editor，按 Run。
-- 這份 SQL 可以重複執行，跑第二次不會弄壞任何東西。
--
-- 【為什麼要跑這一份】
--
-- 當初建資料表時，規格書寫的付款方式是「ATM 轉帳 + 顧客回填末五碼」，
-- 所以 orders 這張表只認得 'atm' 這一種付款方式。
--
-- 後來老闆訪談的結論不一樣：接受【匯款】與【貨到付款】兩種，
-- 而且匯款帳號不公開在網站上、也不做回填末五碼（業主拍板的「方案 A」）。
--
-- 資料表還停在舊規格，所以新的結帳功能寫不進去。這份 SQL 就是把它改過來。
-- 目前 orders 裡還沒有任何一筆訂單，改起來沒有風險。
-- ============================================================


-- ------------------------------------------------------------
-- 一、付款方式改成「匯款 / 貨到付款」
--     transfer = 匯款（訂單成立後由店家電話告知帳號）
--     cod      = 貨到付款
-- ------------------------------------------------------------

-- 舊的預設值是 'atm'，會跟新規則打架，先拿掉。
-- 網站每次建單都會明確指定付款方式，不需要預設值。
alter table public.orders
  alter column payment_method drop default;

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('transfer', 'cod'));


-- ------------------------------------------------------------
-- 二、末五碼欄位保留但不再使用
-- ------------------------------------------------------------
-- 「顧客回填轉帳末五碼」的流程已經作廢。
-- 欄位【刻意不刪除】—— 刪欄位是不可逆的，留著也不占空間；
-- 萬一日後老闆改變主意要做對帳，它還在。
comment on column public.orders.transfer_last5 is
  '已停用。原規格的「顧客回填轉帳末五碼」流程已作廢（2026-08-17 業主拍板方案 A）。';

comment on column public.orders.payment_method is
  'transfer = 匯款（帳號不公開在網站上，訂單成立後電話告知）／cod = 貨到付款';


-- ------------------------------------------------------------
-- 三、確認結果
-- ------------------------------------------------------------
-- 跑完之後這一段會印出目前允許的付款方式，應該看得到 transfer 與 cod。
select
  conname  as "限制名稱",
  pg_get_constraintdef(oid) as "目前的規則"
from pg_constraint
where conrelid = 'public.orders'::regclass
  and conname = 'orders_payment_method_check';
