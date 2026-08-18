-- ============================================================
-- 御茗有限公司 電商網站 — 公告橫幅
-- ============================================================
-- 使用方式：整份複製，貼到 Supabase Dashboard 的 SQL Editor，按 Run。
-- 這份 SQL 可以重複執行，跑第二次不會弄壞任何東西，也不會清掉已經打好的公告。
--
-- 【為什麼要跑這一份】
--
-- 老闆的政策是「調整價格要先公告一個月」。
-- 系統刻意【不做排程改價】（時間到了自動變價格，出錯了很難收拾），
-- 改為提供一條可以自己開關的公告橫幅：業主在後台打字、按一下，
-- 網站每一頁的最上面就會出現那一行字。
--
-- 公告的內容要能在手機上隨時改，所以它必須存在資料庫，
-- 不能寫在程式裡（寫在程式裡，改一個字就要重新部署一次網站）。
-- ============================================================


-- ------------------------------------------------------------
-- 一、公告資料表
-- ------------------------------------------------------------
-- 【這張表永遠只有一列。】
--
-- 網站同一時間只會有一條公告，不需要「公告列表」——
-- 多筆資料就要處理「哪一筆才是現在要顯示的」，那是多出來的複雜度。
-- 用 id = 1 的檢查限制把它鎖死成一列，改公告就是改那一列。
create table if not exists public.announcements (
  id smallint primary key default 1,

  -- 要不要顯示在網站上。預設關著 —— 建好之後不會突然冒出一條空白橫幅。
  is_active boolean not null default false,

  message_zh text not null default '',
  message_en text not null default '',

  -- 公告到哪一天為止（含當天），空白 = 一直顯示。
  --
  -- 【為什麼要有這個欄位】：公告最常見的毛病是「忘記收」。
  -- 一條掛了三個月的漲價公告，客人早就自動略過，等於沒有公告。
  -- 設了日期，時間到了自己收起來，不用記得回來關。
  ends_on date,

  updated_at timestamptz not null default now(),

  constraint announcements_single_row check (id = 1),
  constraint announcements_message_len check (
    length(message_zh) <= 200 and length(message_en) <= 200
  )
);

-- 先放一列空的進去。已經有資料時什麼都不做（所以可以重複執行）。
insert into public.announcements (id) values (1)
on conflict (id) do nothing;

comment on table public.announcements is
  '網站最上方的公告橫幅。永遠只有一列（id = 1）。內容由後台 /admin/announcement 維護。';
comment on column public.announcements.ends_on is
  '公告到哪一天為止（含當天，台灣時間）。null = 一直顯示。';


-- ------------------------------------------------------------
-- 二、門禁（RLS）
-- ------------------------------------------------------------
-- 訪客【只能讀，不能寫】，而且【只讀得到現在真的該顯示的那一條】。
--
-- 為什麼過期與未啟用的公告連讀都不給讀：業主很可能會先把下個月的
-- 漲價公告打好存著、時間到再打開。那段文字在打開之前不應該外流 ——
-- 訪客的瀏覽器裡有 anon 金鑰，等同公開，擋在資料庫這一層才是真的擋住。
alter table public.announcements enable row level security;

drop policy if exists "announcements_public_read" on public.announcements;
create policy "announcements_public_read"
  on public.announcements for select
  to anon, authenticated
  using (
    is_active = true
    and (
      ends_on is null
      -- 【一定要寫明台灣時間。】資料庫的機器跑在 UTC，
      -- 直接用 current_date 會比台灣慢八小時，公告會晚一天才收。
      or ends_on >= (now() at time zone 'Asia/Taipei')::date
    )
  );

-- 寫入一律走伺服器端的後台（service_role 金鑰會繞過 RLS），
-- 訪客那把公開金鑰明確收回寫入權限，多一層保險。
revoke insert, update, delete on public.announcements from anon, authenticated;


-- ------------------------------------------------------------
-- 三、確認結果
-- ------------------------------------------------------------
-- 跑完之後這一段會印出目前的公告狀態。
-- 剛建好時應該是：顯示中 = false、內容是空的。
select
  is_active   as "目前有在顯示嗎",
  message_zh  as "中文內容",
  ends_on     as "公告到哪一天",
  updated_at  as "最後修改時間"
from public.announcements
where id = 1;
