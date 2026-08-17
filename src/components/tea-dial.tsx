"use client";

import { useEffect, useState } from "react";

/**
 * 茶湯轉盤 —— 首頁右下角那個圓。
 *
 * 它是一個「你現在在哪一段」的指示器：捲到哪一段，盤子就轉到那一段，
 * 並換成那一段對應的茶湯顏色。該段落的字會轉到正上方，而且【剛好是正的】。
 *
 * ## 為什麼不跟著捲動連續轉
 *
 * 第一版做成「捲動時連續旋轉、拖曳盤子等於捲頁面」，實際用起來很卡 ——
 * 拖曳盤子去捲頁面等於跟瀏覽器搶方向盤；而且連續轉的時候，外圈的字
 * 跟畫面上的內容根本對不起來，轉了半天也不知道那些字在指什麼。
 *
 * 現在改成**一段一格**：每一段對應一個固定角度，捲進哪一段就轉過去，
 * 中間用一次平順的過場補上。好處是
 *   一、不卡 —— 一次捲動只做一次 transform，其餘時間完全靜止
 *   二、字有意義 —— 轉到正上方的那個字，就是你正在看的段落
 *
 * ## 字的方向
 *
 * 每個字的**底部朝向圓心**，不是全部朝同一個方向。
 * 因此轉到正上方的那個字必然是正的，其餘順著圓周傾斜 —— 像轉盤上的刻度。
 *
 * 照片還沒拍，每一層底下先鋪對應的顏色 —— 圖檔不存在時就是一個純色的圓，
 * 畫面不會破。之後把照片放進 /public/images/decor/（檔名不變）就會自動換上。
 */

/** 三種茶湯。顏色是照片到位之前的替身，也是照片載入失敗時的底色。 */
const TONE_STYLE = {
  black: { file: "tea-black.png", color: "#c48770" },
  green: { file: "tea-green.png", color: "#b9c497" },
  oolong: { file: "tea-oolong.png", color: "#dcb383" },
} as const;

export type TeaTone = keyof typeof TONE_STYLE;

/** 一個段落：頁面上的 id、外圈要顯示的字、對應的茶湯 */
export type DialSection = {
  id: string;
  label: string;
  tone: TeaTone;
};

export function TeaDial({ sections }: { sections: DialSection[] }) {
  const [current, setCurrent] = useState(0);

  // 只在「段落清單真的變了」時才重新掛偵測器。
  // 若直接依賴 sections 這個陣列，每次重繪都是新的物件，
  // 偵測器會被反覆拆掉重建。
  const sectionKey = sections.map((section) => section.id).join("|");

  useEffect(() => {
    if (sections.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    // 用 IntersectionObserver 而不是監聽捲動事件：
    // 瀏覽器只在段落進出畫面的那一瞬間通知一次，捲動過程中完全不做事。
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }

        let bestIndex = 0;
        let bestRatio = -1;
        sections.forEach((section, index) => {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });

        setCurrent(bestIndex);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
    // sections 的內容以 sectionKey 代表，見上方說明
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  const step = sections.length > 0 ? 360 / sections.length : 0;

  // 目前這一段的字要轉到正上方，所以整個盤子往回轉同樣的角度
  const angle = -current * step;
  const tone = sections[current]?.tone ?? "black";

  return (
    <div className="tea-dial" aria-hidden="true">
      <div
        className="tea-dial__spin"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {(Object.keys(TONE_STYLE) as TeaTone[]).map((key) => (
          <div
            key={key}
            className="tea-dial__layer"
            data-active={key === tone ? "true" : undefined}
            style={{
              backgroundColor: TONE_STYLE[key].color,
              backgroundImage: `url(/images/decor/${TONE_STYLE[key].file})`,
            }}
          />
        ))}

        {/* 外圈的字。刻意【不】把字轉正 —— 底部朝向圓心，
            轉到正上方的那個字自然就是正的。全部朝同一個方向就沒有轉盤的味道了。 */}
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="tea-dial__label"
            data-current={index === current ? "true" : undefined}
            style={{ transform: `rotate(${index * step}deg)` }}
          >
            <span>{section.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
