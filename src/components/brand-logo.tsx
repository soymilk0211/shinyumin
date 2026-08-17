import Image from "next/image";

/**
 * 御茗的商標。
 *
 * 為什麼有兩個檔案：商標的「御茗」書法字是深紅色（#8b0207），
 * 那個顏色放在深色模式的炭焙黑底上，對比只有 1.9:1 —— 幾乎看不見。
 * 所以深色模式改用另一版：書法字換成米白、茶葉換成商標原檔裡
 * 本來就有的較亮赭紅 #d37146。兩個顏色都取自商標原檔，不是另外調的。
 *
 * 換版是用 CSS 決定的（不是用程式判斷目前是深色還是淺色），
 * 這樣伺服器與瀏覽器產生的內容完全一致，畫面不會閃、也不會出錯。
 *
 * 原始檔：`docs/` 外的商標規範 PDF（業主提供），
 * 轉檔方式記錄在 docs/step-2c-logo.md。
 */

/** 商標原始比例（來自商標規範頁的尺寸） */
const WIDTH = 215;
const HEIGHT = 97;

export function BrandLogo({
  alt,
  className = "",
}: {
  alt: string;
  className?: string;
}) {
  return (
    <>
      <Image
        src="/images/trademark/logo.svg"
        alt={alt}
        width={WIDTH}
        height={HEIGHT}
        priority
        unoptimized
        className={`${className} dark:hidden`}
      />
      <Image
        src="/images/trademark/logo-dark.svg"
        alt=""
        aria-hidden="true"
        width={WIDTH}
        height={HEIGHT}
        priority
        unoptimized
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
