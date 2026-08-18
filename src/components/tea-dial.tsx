"use client";

import { useEffect, useState } from "react";

/**
 * 茶湯轉盤 —— 首頁右下角那個圓。
 *
 * 它是一個「你現在在哪一段」的指示器：捲到哪一段，盤子就轉到那一段，
 * 並換成那一段對應的茶湯顏色。該段落的字會轉到正上方，而且【剛好是正的】。
 *
 * 捲到頁尾時會自己淡出讓開 —— 頁尾是地址、電話、統編這類密集資訊，
 * 蓋住那裡只是擋路。
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
 * ## 為什麼不用照片
 *
 * 這個圓原本設計成三張茶湯照。業主 2026-08-18 決定不拍茶湯，
 * 所以改成【用漸層畫出來】。
 *
 * 這不是將就。茶湯照要拍得好其實很難 —— 杯緣會反光、光線一偏色就跑掉、
 * 而且照片有邊界，疊在文字上會顯得髒。漸層沒有這些問題：
 * 中心亮、邊緣沉，本來就是液體在碗裡的樣子，而且【永遠不會載入失敗】。
 *
 * 顏色取自實際的茶湯：紅玉的琥珀紅、高山烏龍的金黃、焙火的深褐。
 * 綠色已經拿掉 —— 綠茶不賣了，首頁不該再出現那個顏色。
 */

/**
 * 三種茶湯，用漸層畫的。
 *
 * 每一組的四個色是【由內而外】：受光的亮點、茶湯本身、沉下去的邊、最外的暗環。
 * 亮點刻意偏左上，像是有一道自然光從窗戶斜進來。
 */
function liquor(highlight: string, mid: string, deep: string, rim: string) {
  return (
    `radial-gradient(circle at 38% 32%, ${highlight} 0%, ${mid} 34%, ` +
    `${deep} 68%, ${rim} 100%)`
  );
}

const TONE_STYLE = {
  /** 紅玉紅茶：透光的琥珀紅 */
  ruby: { gradient: liquor("#eaad86", "#c9613f", "#8f3520", "#5e2214") },
  /** 高山烏龍：金黃 */
  oolong: { gradient: liquor("#f2dba7", "#dcae62", "#a97a32", "#6f4d1c") },
  /** 焙火：沉下去的深褐 */
  roasted: { gradient: liquor("#d9b18c", "#a9713f", "#6f4423", "#452a15") },
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
  const [hidden, setHidden] = useState(false);

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

  // 捲到頁尾時把盤子淡出。
  // 頁尾是密集的聯絡資訊（地址、電話、統編），跟主視覺區不一樣 ——
  // 那裡蓋住內容就只是擋路，不是設計。
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      // 頁尾只要露出一點點就開始讓開，不要等它整個進畫面
      { threshold: 0.01 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const step = sections.length > 0 ? 360 / sections.length : 0;

  // 目前這一段的字要轉到正上方，所以整個盤子往回轉同樣的角度
  const angle = -current * step;
  const tone = sections[current]?.tone ?? "ruby";

  return (
    <div className="tea-dial" data-hidden={hidden || undefined} aria-hidden="true">
      <div
        className="tea-dial__spin"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {(Object.keys(TONE_STYLE) as TeaTone[]).map((key) => (
          <div
            key={key}
            className="tea-dial__layer"
            data-active={key === tone ? "true" : undefined}
            style={{ backgroundImage: TONE_STYLE[key].gradient }}
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
