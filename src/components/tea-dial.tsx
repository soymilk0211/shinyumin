"use client";

import { useEffect, useState } from "react";

/**
 * 茶湯轉盤 —— 首頁右下角的裝飾元素。
 *
 * 一個俯視茶湯的圓，三分之一裁切在畫面外。隨著捲動連續旋轉，
 * 捲到不同的段落時，茶湯的顏色會柔和地換過去（綠茶／烏龍／紅茶）。
 *
 * 三個地方是刻意這樣做的：
 *
 * 1. **旋轉不用 JavaScript。** 用 CSS 的 scroll-driven animation
 *    （animation-timeline: scroll()），由瀏覽器自己在合成執行緒上跑。
 *    如果改用 JavaScript 監聽捲動再去改角度，手機上會頓。
 *
 * 2. **換色只改 opacity，不換圖檔、不用 display:none。**
 *    三張圖一直都疊在那裡，換色是讓其中一張淡入、其他淡出。
 *    如果去換 <img> 的 src 或把圖藏起來，正在跑的旋轉會被打斷、畫面會跳一下。
 *
 * 3. **旋轉套在外層容器，圖片疊在裡面。** 同上，旋轉的元素本身不能被動到。
 *
 * 照片還沒拍，所以每一層底下都先鋪一個對應的顏色 ——
 * 圖檔不存在時看到的是一個純色的圓，畫面不會破。
 * 之後把照片放進 /public/images/decor/（檔名不變）就會自動換成實拍照。
 */

/** 三種茶湯。顏色是照片到位之前的替身，也是照片載入失敗時的底色。 */
const TONES = [
  { key: "green", file: "tea-green.png", color: "#8a9a5b" },
  { key: "oolong", file: "tea-oolong.png", color: "#c08a3e" },
  { key: "black", file: "tea-black.png", color: "#8b3a2a" },
] as const;

export type TeaTone = (typeof TONES)[number]["key"];

function isTone(value: string | null | undefined): value is TeaTone {
  return value === "green" || value === "oolong" || value === "black";
}

export function TeaDial({
  /**
   * 一進頁面時顯示哪一杯。
   *
   * 由頁面直接指定（通常就是最上面那個段落的顏色），而不是在瀏覽器裡去讀 DOM ——
   * 這樣伺服器產生的畫面一開始就是對的，不會先閃一個顏色再換過去。
   */
  initialTone = "black",
}: {
  initialTone?: TeaTone;
}) {
  const [tone, setTone] = useState<TeaTone>(initialTone);

  useEffect(() => {
    // 哪一個段落正在畫面中央，轉盤就換成那個段落指定的茶湯顏色。
    //
    // 這裡用 IntersectionObserver 而不是監聽 scroll 事件：
    // 瀏覽器只在「進出畫面」的那一瞬間通知一次，捲動過程中完全不做事，
    // 所以不會拖慢捲動。
    const sections = document.querySelectorAll<HTMLElement>("[data-tea-tone]");
    if (sections.length === 0) return;

    // 瀏覽器不支援就維持 initialTone，畫面仍然是完整的、只是不會換色
    if (typeof IntersectionObserver === "undefined") return;

    const visible = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target, entry.intersectionRatio);
        }

        let best: Element | null = null;
        let bestRatio = 0;
        for (const [element, ratio] of visible) {
          if (ratio > bestRatio) {
            best = element;
            bestRatio = ratio;
          }
        }

        const next = best?.getAttribute("data-tea-tone");
        if (isTone(next)) setTone(next);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="tea-dial" aria-hidden="true">
      {/* 旋轉套在這一層。裡面的圖從頭到尾都不會被替換或隱藏 */}
      <div className="tea-dial__spin">
        {TONES.map((t) => (
          <div
            key={t.key}
            className="tea-dial__layer"
            data-active={t.key === tone ? "true" : undefined}
            style={{
              backgroundColor: t.color,
              backgroundImage: `url(/images/decor/${t.file})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
