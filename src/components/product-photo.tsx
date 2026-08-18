import Image from "next/image";
import { ImagePlaceholder } from "@/components/image-placeholder";

/**
 * 商品照片。有照片就顯示照片，沒有就顯示佔位符。
 *
 * 【佔位符不是暫時的東西，是永久的後備方案。】
 * 萬一某款茶忘了放照片、檔名打錯、或日後換包裝把舊圖刪了，
 * 顯示的還是那塊有紙質感的留白 —— 畫面不會出現破圖。
 *
 * 照片本身刻意【不加圓角、不加陰影】。這個網站的語彙是細線與留白，
 * 圓角與陰影是軟體介面的語彙，加上去會立刻變成一般的購物網站。
 */
export function ProductPhoto({
  src,
  alt,
  ratio = "aspect-[4/3]",
  className = "",
  placeholderLabel,
  priority = false,
  sizes = "(min-width: 640px) 44vw, 100vw",
}: {
  src: string | null;
  alt: string;
  ratio?: string;
  className?: string;
  placeholderLabel?: string;
  /** 首屏那一張設 true，讓瀏覽器優先載入 */
  priority?: boolean;
  sizes?: string;
}) {
  if (!src) {
    return (
      <ImagePlaceholder
        ratio={ratio}
        className={className}
        label={placeholderLabel}
      />
    );
  }

  return (
    <div
      className={`${ratio} ${className} relative overflow-hidden bg-surface-sunken`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
