import Link from "next/link";
import { redirect } from "next/navigation";
import {
  updateProductPublished,
  updateVariantPrice,
  updateVariantStatus,
} from "@/app/admin/actions";
import { isSignedIn } from "@/lib/admin-auth";
import {
  listProductsForAdmin,
  MAX_PRICE_TWD,
  type AdminVariant,
} from "@/lib/admin-products";

/**
 * 商品與價格。
 *
 * 三件事：改價、把某個包裝切成售罄、把整款茶上架或下架。
 *
 * 【後台看得到未上架的商品】—— 前台看不到的東西，這裡都看得到，
 * 否則業主想把「焙火烏龍」重新開賣時會找不到它。
 *
 * 【不做新增與刪除商品。】那是偶爾才做、而且要斟酌用字的事
 * （英文名、網址代號、介紹文），在電腦上處理比較妥當。
 */

export const dynamic = "force-dynamic";

/**
 * 按鈕上寫的是「按下去會變成什麼」，不是現在的狀態。
 *
 * 已下架的也要給一個回頭的按鈕 —— 只能下架不能救回來，
 * 那個包裝就等於永遠消失了。
 */
function nextSaleStatus(status: AdminVariant["status"]) {
  return status === "on_sale"
    ? { status: "sold_out" as const, label: "切成售罄" }
    : { status: "on_sale" as const, label: "改回販售中" };
}

export default async function AdminProductsPage() {
  if (!(await isSignedIn())) redirect("/admin/login");

  const products = await listProductsForAdmin();

  return (
    <main>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">商品與價格</h1>
        <Link
          href="/admin"
          className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
        >
          看訂單 →
        </Link>
      </div>

      <p className="mt-4 text-[13px] leading-[1.8] text-ink-faint">
        改價只影響之後的新訂單。已經成立的訂單金額不會跟著變。
      </p>

      {products.map((product) => (
        <section key={product.id} className="mt-8 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 className="text-[18px] text-ink">
              {product.name}
              {product.categoryName && (
                <span className="ml-3 text-[13px] text-ink-faint">
                  {product.categoryName}
                </span>
              )}
            </h2>

            {/* 整款茶要不要出現在網站上 */}
            <form action={updateProductPublished}>
              <input type="hidden" name="id" value={product.id} />
              <input
                type="hidden"
                name="published"
                value={product.isPublished ? "false" : "true"}
              />
              <button
                type="submit"
                className={`text-[13px] underline-offset-4 hover:underline ${
                  product.isPublished
                    ? "text-ink-faint hover:text-brand"
                    : "text-brand"
                }`}
              >
                {product.isPublished ? "從網站上收起來" : "放上網站"}
              </button>
            </form>
          </div>

          {!product.isPublished && (
            <p className="mt-2 text-[13px] text-brand">
              目前沒有出現在網站上
            </p>
          )}

          <ul className="mt-4 space-y-4">
            {product.variants.map((variant) => (
              <li key={variant.id} className="bg-surface px-4 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[15px] text-ink">{variant.label}</span>
                  {variant.status !== "on_sale" && (
                    <span className="text-[13px] text-brand">
                      {variant.status === "sold_out" ? "售罄" : "已下架"}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
                  {/* 改價。輸入框刻意做大，手機上好按 */}
                  <form
                    action={updateVariantPrice}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={variant.id} />
                    <span className="text-[14px] text-ink-soft">NT$</span>
                    <label htmlFor={`price-${variant.id}`} className="sr-only">
                      {variant.label}的價格
                    </label>
                    <input
                      id={`price-${variant.id}`}
                      name="price"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_PRICE_TWD}
                      step={1}
                      defaultValue={variant.priceTwd}
                      className="w-28 border border-line bg-page px-3 py-2.5 text-[16px] text-ink tabular-nums transition-colors focus:border-brand"
                    />
                    <button
                      type="submit"
                      className="bg-brand px-4 py-2.5 text-[14px] text-brand-contrast transition-colors hover:bg-brand-strong"
                    >
                      改價
                    </button>
                  </form>

                  {/* 售罄切換 */}
                  <form action={updateVariantStatus}>
                    <input type="hidden" name="id" value={variant.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={nextSaleStatus(variant.status).status}
                    />
                    <button
                      type="submit"
                      className="text-[13px] text-ink-faint underline-offset-4 hover:text-brand hover:underline"
                    >
                      {nextSaleStatus(variant.status).label}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
