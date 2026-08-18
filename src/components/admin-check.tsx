"use client";

import { useActionState } from "react";
import { runSystemCheck, type CheckResult } from "@/app/admin/actions";

/**
 * 系統檢查的按鈕。
 *
 * 【為什麼需要這一頁】：寄信與推播失敗時，錯誤原本只會寫進伺服器的記錄裡 ——
 * 那個要進 Vercel 後台翻好幾層才看得到，業主用手機根本查不了。
 *
 * 這一頁把「按一下、當場看到結果」做出來，而且【原封不動顯示服務商回的錯誤】。
 * 錯誤訊息通常已經寫清楚原因（金鑰不對、收件人不被允許、額度用完），
 * 我自己翻譯反而會漏掉重點。
 */

const INITIAL: CheckResult = { status: "idle", message: "" };

export function AdminCheck({
  kind,
  label,
  hint,
}: {
  kind: "email" | "line";
  label: string;
  hint: string;
}) {
  const [state, action, pending] = useActionState(runSystemCheck, INITIAL);

  return (
    <div className="border-t border-line py-6">
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[16px] text-ink">{label}</p>
            <p className="mt-1 text-[13px] text-ink-faint">{hint}</p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 bg-brand px-5 py-3 text-[14px] text-brand-contrast transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-ink-faint"
          >
            {pending ? "測試中…" : "測試"}
          </button>
        </div>
      </form>

      {state.status !== "idle" && (
        <div
          className={`mt-4 border-l-2 pl-4 ${
            state.status === "ok" ? "border-ink-faint" : "border-brand"
          }`}
        >
          <p
            className={`text-[14px] ${
              state.status === "ok" ? "text-ink" : "text-brand"
            }`}
          >
            {state.status === "ok" ? "✅ 成功" : "❌ 失敗"}
          </p>
          {/* 服務商回的原文。刻意不翻譯、不美化 —— 要拿去問客服時就是這一段 */}
          <p className="mt-2 text-[13px] leading-[1.9] break-all whitespace-pre-wrap text-ink-soft">
            {state.message}
          </p>
        </div>
      )}
    </div>
  );
}
