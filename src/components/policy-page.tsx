import { ObfuscatedContact } from "@/components/obfuscated-contact";

/**
 * 條款類頁面的共用版型（退換貨、隱私權，之後的食品標示也用這個）。
 *
 * 【這種頁面要好讀，不要好看。】前台其他地方走的是型錄式的巨大標題與
 * 不對稱留白，但條款是拿來查的 —— 客人是帶著問題來的（「破損可以退嗎」），
 * 所以段落標題要明顯、行距要寬、一行不要太長。
 *
 * 每一頁最後都放電話：看條款看到一半想直接問人，是很正常的反應。
 */

export type PolicySection = {
  title: string;
  body: readonly string[];
};

export function PolicyPage({
  title,
  updated,
  sections,
  contactTitle,
  phoneHint,
  serviceHours,
  place,
}: {
  title: string;
  updated: string;
  sections: readonly PolicySection[];
  contactTitle: string;
  phoneHint: string;
  serviceHours: string;
  place: string;
}) {
  return (
    <div className="px-6 pt-14 pb-28 sm:px-10 sm:pt-20 sm:pb-40">
      <div className="flex gap-5 sm:gap-10">
        <span className="vertical label mt-1 shrink-0 text-ink-faint">
          {place}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="display-xl text-[clamp(1.9rem,5vw,3.6rem)] text-ink">
            {title}
          </h1>
          <p className="mt-6 text-[12px] tracking-[0.08em] text-ink-faint">
            {updated}
          </p>

          <div className="mt-16 max-w-[60ch]">
            {sections.map((section) => (
              <section
                key={section.title}
                className="border-t border-line py-10"
              >
                <h2 className="text-[clamp(1.1rem,2.4vw,1.5rem)] text-ink">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-5">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[14px] leading-[2.1] tracking-[0.04em] text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="border-t border-line pt-10">
              <span className="label text-brand">{contactTitle}</span>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] tracking-[0.06em]">
                <ObfuscatedContact kind="phone" revealLabel={phoneHint} />
                <span className="text-ink-faint">{serviceHours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
