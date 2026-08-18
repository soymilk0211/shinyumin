import Image from "next/image";
import { ImagePlaceholder } from "@/components/image-placeholder";
import type { Photo } from "@/lib/product-images";

/**
 * 商品照片。有照片就顯示照片，沒有就顯示佔位符。
 *
 * 【照片維持它原本的形狀，不裁。】
 *
 * 第一版是把照片塞進固定比例的框裡（用 object-cover 填滿），
 * 結果橫的照片放進直的框，左右被裁掉 —— 業主一眼就看出來：
 * 「你要讓他保持原本的形狀啊」。
 *
 * 現在改成【版面配合照片】：讀出照片真正的長寬，讓它自己撐開高度。
 * 佔位符才用固定比例 —— 那是我們自己畫的東西，形狀本來就該由版面決定。
 *
 * 照片刻意【不加圓角、不加陰影】。這個網站的語彙是細線與留白，
 * 圓角與陰影是軟體介面的語彙，加上去會立刻變成一般的購物網站。
 */
export function ProductPhoto({
  photo,
  alt,
  placeholderRatio = "aspect-[4/3]",
  className = "",
  placeholderLabel,
  priority = false,
  sizes = "(min-width: 640px) 44vw, 100vw",
}: {
  photo: Photo | null;
  alt: string;
  /** 沒有照片時，佔位符要用的比例 */
  placeholderRatio?: string;
  className?: string;
  placeholderLabel?: string;
  /** 首屏那一張設 true，讓瀏覽器優先載入 */
  priority?: boolean;
  sizes?: string;
}) {
  if (!photo) {
    return (
      <ImagePlaceholder
        ratio={placeholderRatio}
        className={className}
        label={placeholderLabel}
      />
    );
  }

  return (
    <div className={`${className} overflow-hidden bg-surface-sunken`}>
      <Image
        src={photo.src}
        alt={alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        priority={priority}
        // h-auto 是關鍵：高度由照片自己的比例決定，不被外框綁住
        className="h-auto w-full"
      />
    </div>
  );
}
