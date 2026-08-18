import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * 找出某一款茶有哪些照片。【伺服器端專用。】
 *
 * 【為什麼用檔案存在與否來判斷，而不是存在資料庫裡】
 *
 * 照片是「有就放上去、沒有就顯示佔位符」的東西。如果檔名要另外記在
 * 資料庫，就會出現「檔案放了但資料庫沒填」與「資料庫填了但檔案沒放」
 * 兩種對不起來的狀態，而且業主每放一張照片都要再去後台登記一次。
 *
 * 直接看檔案在不在最誠實：把圖丟進資料夾，網站就有了。
 *
 * 檔名規則（見 public/images/README.md）：
 *   罐裝照　`<slug>.jpg`
 *   茶乾照　`<slug>-leaf.jpg`
 */

const PUBLIC_DIR = join(process.cwd(), "public", "images", "products");

function exists(file: string): boolean {
  return existsSync(join(PUBLIC_DIR, file));
}

export type ProductImages = {
  /** 主圖：有罐裝照就用罐裝照，只有茶乾照就用茶乾照 */
  main: string | null;
  /**
   * 另外附的茶乾照。
   * 【主圖已經是茶乾照時這裡會是 null】—— 同一張圖放兩次只會顯得敷衍。
   */
  leaf: string | null;
};

export function getProductImages(slug: string): ProductImages {
  const tin = `${slug}.jpg`;
  const leaf = `${slug}-leaf.jpg`;

  const hasTin = exists(tin);
  const hasLeaf = exists(leaf);

  if (hasTin) {
    return {
      main: `/images/products/${tin}`,
      leaf: hasLeaf ? `/images/products/${leaf}` : null,
    };
  }

  return {
    main: hasLeaf ? `/images/products/${leaf}` : null,
    leaf: null,
  };
}
