import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";

/**
 * 找出某一款茶有哪些照片，以及照片本身是什麼形狀。【伺服器端專用。】
 *
 * 【為什麼用檔案存在與否來判斷，而不是存在資料庫裡】
 *
 * 照片是「有就放上去、沒有就顯示佔位符」的東西。如果檔名要另外記在
 * 資料庫，就會出現「檔案放了但資料庫沒填」與「資料庫填了但檔案沒放」
 * 兩種對不起來的狀態，而且業主每放一張照片都要再去後台登記一次。
 *
 * 直接看檔案在不在最誠實：把圖丟進資料夾，網站就有了。
 *
 * 【為什麼要讀出尺寸】
 *
 * 業主 2026-08-18 指出：橫的照片被塞進直的框裡，兩邊被裁掉了 ——
 * 「你要讓他保持原本的形狀啊」。他是對的。所以這裡把照片真正的
 * 長寬讀出來，讓版面去配合照片，而不是拿照片去配合版面。
 *
 * 檔名規則（見 public/images/README.md）：
 *   罐裝照　`<slug>.jpg`
 *   茶乾照　`<slug>-leaf.jpg`
 */

const PUBLIC_DIR = join(process.cwd(), "public", "images", "products");

export type Photo = {
  src: string;
  width: number;
  height: number;
};

export type ProductImages = {
  /** 主圖：有罐裝照就用罐裝照，只有茶乾照就用茶乾照 */
  main: Photo | null;
  /**
   * 另外附的茶乾照。
   * 【主圖已經是茶乾照時這裡會是 null】—— 同一張圖放兩次只會顯得敷衍。
   */
  leaf: Photo | null;
};

function readPhoto(file: string): Photo | null {
  const path = join(PUBLIC_DIR, file);
  if (!existsSync(path)) return null;

  const size = readImageSize(path);
  if (!size) return null;

  return { src: `/images/products/${file}`, ...size };
}

export function getProductImages(slug: string): ProductImages {
  const tin = readPhoto(`${slug}.jpg`);
  const leaf = readPhoto(`${slug}-leaf.jpg`);

  if (tin) return { main: tin, leaf };
  return { main: leaf, leaf: null };
}

/**
 * 直接從檔案的前幾百個位元組讀出圖片的長寬。
 *
 * 【刻意不依賴任何影像函式庫。】sharp 之類的東西是 Next.js 自己帶進來的，
 * 我們的程式碼去用它等於押注在別人的相依套件上 —— 哪天 Next 換掉，
 * 這裡就跟著壞。JPEG 與 PNG 的長寬就寫在檔頭裡，讀它比裝一個函式庫穩。
 */
function readImageSize(path: string): { width: number; height: number } | null {
  let fd: number | null = null;
  try {
    fd = openSync(path, "r");
    const buffer = Buffer.alloc(65536);
    const read = readSync(fd, buffer, 0, buffer.length, 0);
    const data = buffer.subarray(0, read);

    // PNG：長寬固定在 IHDR，位置是死的
    if (data.length > 24 && data.readUInt32BE(0) === 0x89504e47) {
      return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
    }

    // JPEG：從頭往下找 SOF 標記，長寬就在它後面
    if (data.length > 4 && data[0] === 0xff && data[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < data.length) {
        if (data[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = data[offset + 1];

        // SOF0–SOF15，但跳過 DHT(c4)、JPG(c8)、DAC(cc) —— 那些不是 SOF
        const isSof =
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc;

        if (isSof) {
          return {
            height: data.readUInt16BE(offset + 5),
            width: data.readUInt16BE(offset + 7),
          };
        }

        // 不是 SOF 就照長度跳過這一段
        const length = data.readUInt16BE(offset + 2);
        if (length < 2) break;
        offset += 2 + length;
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    if (fd !== null) closeSync(fd);
  }
}
