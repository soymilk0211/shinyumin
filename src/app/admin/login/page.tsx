import { redirect } from "next/navigation";
import { signIn } from "@/app/admin/actions";
import { isAdminConfigured, isSignedIn } from "@/lib/admin-auth";

/**
 * 後台登入。
 *
 * 表單是最原始的那一種（送出後整頁換掉），沒有用到任何瀏覽器端的程式。
 * 在訊號不好的地方也一定按得動。
 */

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  if (await isSignedIn()) redirect("/admin");

  const { error } = await searchParams;
  const code = Array.isArray(error) ? error[0] : error;

  // 密碼還沒設定就直說。這種時候讓人一直試密碼是最浪費時間的。
  if (!isAdminConfigured()) {
    return (
      <main>
        <h1 className="text-2xl">御茗後台</h1>
        <p className="mt-6 text-[15px] leading-[1.9] text-ink-soft">
          後台還沒有設定密碼，所以現在無法登入。
        </p>
        <p className="mt-4 text-[14px] leading-[1.9] text-ink-faint">
          請在 Vercel 的環境變數加上 <code>ADMIN_PASSWORD</code>，
          再重新部署一次。設定步驟寫在 <code>docs/step-6a-admin.md</code>。
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-2xl">御茗後台</h1>
      <p className="mt-3 text-[14px] text-ink-faint">請輸入密碼</p>

      <form action={signIn} className="mt-10">
        <label htmlFor="password" className="block text-[13px] text-ink-soft">
          密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          // 手機上一進來就能打字，少按一下
          autoFocus
          className="mt-2 w-full border border-line bg-surface px-4 py-3.5 text-[17px] text-ink transition-colors focus:border-brand"
        />

        {code === "wrong" && (
          <p className="mt-3 text-[14px] text-brand">密碼不對，再試一次。</p>
        )}
        {code === "slow" && (
          <p className="mt-3 text-[14px] text-brand">
            試太多次了。請等幾分鐘再試。
          </p>
        )}

        <button
          type="submit"
          className="mt-8 w-full bg-brand px-4 py-4 text-[16px] text-brand-contrast transition-colors hover:bg-brand-strong"
        >
          登入
        </button>
      </form>
    </main>
  );
}
