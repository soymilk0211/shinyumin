import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildCatalogue } from "@/lib/catalogue";
import { getMember } from "@/lib/member-auth";
import { getSavedContact } from "@/lib/member-orders";
import { getProducts } from "@/lib/products";

/**
 * 結帳頁。
 *
 * 這一頁只負責兩件事：從資料庫拿一份「規格 ID → 名稱與價格」的對照表，
 * 以及把介面文字交給表單。真正的下單動作在 `/api/checkout`（伺服器端）。
 *
 * 【結帳頁不進搜尋引擎。】訂單流程的中間頁被搜尋到沒有意義，
 * 而且客人從搜尋結果直接跳進來只會看到一個空購物車。
 */

/**
 * 【這一頁絕對不可以被快取。】
 *
 * 它會帶入「登入者上次的收件資料」—— 那是因人而異的內容。
 * 一旦被存起來重複使用，第一個結帳的人的姓名、電話、地址
 * 就會被送給下一個打開這一頁的人看。這是會出大事的那種錯。
 *
 * 真正讓它每次都重新產生的是【讀 cookie 這個動作本身】——
 * 下面的 getMember() 會讀 cookie，那屬於 Request-time API，
 * Next.js 一碰到就不會預先產生這一頁。下面這行 export 是第二道保險。
 *
 * ⚠️ 注意：Next.js 16 的文件已經把 `dynamic` 從路由設定表上拿掉了
 * （啟用 Cache Components 之後就完全失效）。所以【不要依賴它】——
 * 日後如果有人在 next.config 打開 cacheComponents，
 * 保護這一頁的會是 cookie 那條路，不是這一行。
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: getDictionary(locale).checkout.title,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const catalogue = buildCatalogue(await getProducts(locale));

  // 登入的人不用每次重打地址。沒登入、或第一次買，這裡就是 null，
  // 表單維持空白 —— 訪客結帳的體驗完全沒有改變。
  const member = await getMember();
  const saved = member ? await getSavedContact(member.userId) : null;
  const initial = saved ?? (member ? { email: member.email } : null);

  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {dict.site.place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] text-ink">
            {dict.checkout.title}
          </h1>

          <div className="mt-14">
            <CheckoutForm
              catalogue={catalogue}
              locale={locale}
              labels={dict.checkout}
              initial={initial}
              prefilled={Boolean(saved)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
