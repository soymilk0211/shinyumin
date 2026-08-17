"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 茶湯轉盤 —— 首頁右下角那個會轉的圓。
 *
 * 它同時是三件事：
 *   一、裝飾：一杯俯視的茶湯，隨捲動連續旋轉
 *   二、指示：捲到哪一區，茶湯就換成那一區的顏色
 *   三、導覽：外圈的字是按鈕，點了會捲到對應的區塊；盤面也可以用手轉
 *
 * 幾個刻意的作法：
 *
 * **旋轉不用 JavaScript。** 用 CSS 的 scroll-driven animation
 * （animation-timeline: scroll()），由瀏覽器自己跑。用 JS 監聽捲動再改角度，
 * 手機上會頓。手轉的角度是另外一層 transform，跟捲動的旋轉互相疊加，
 * 兩者不會打架。
 *
 * **換色只改 opacity。** 三張圖一直疊在那裡，換色是淡入淡出。
 * 若去換 <img> 的 src 或把圖藏起來，正在跑的旋轉會被打斷、畫面會跳。
 *
 * **只有「字」吃得到點擊。** 盤面其他地方一律穿透，
 * 不會擋住底下的連結或按鈕。
 *
 * 照片還沒拍，每一層底下先鋪對應的顏色 —— 圖檔不存在時就是一個純色的圓，
 * 畫面不會破。之後把照片放進 /public/images/decor/（檔名不變）就會自動換上。
 */

/** 三種茶湯。順序＝盤面由外而內的疊放順序，也是換色的先後 */
const TONES = [
  { key: "black", file: "tea-black.png", color: "#c48770" },
  { key: "green", file: "tea-green.png", color: "#b9c497" },
  { key: "oolong", file: "tea-oolong.png", color: "#dcb383" },
] as const;

export type TeaTone = (typeof TONES)[number]["key"];

/** 外圈的一個字標籤：要跳到哪個區塊、擺在幾度的位置 */
export type DialLabel = {
  /** 對應頁面上某個元素的 id */
  targetId: string;
  text: string;
  /** 0 度在正上方，順時針increase */
  angle: number;
};

function isTone(value: string | null | undefined): value is TeaTone {
  return value === "green" || value === "oolong" || value === "black";
}

export function TeaDial({
  initialTone = "black",
  labels = [],
}: {
  /** 一進頁面時顯示哪一杯。由頁面指定，伺服器產生的畫面一開始就是對的 */
  initialTone?: TeaTone;
  labels?: DialLabel[];
}) {
  const [tone, setTone] = useState<TeaTone>(initialTone);
  const dragRef = useRef<HTMLDivElement>(null);

  // 手轉的累積角度。放在 ref 而不是 state：
  // 拖曳時每一次移動都直接改 CSS 變數，不經過 React 重繪，才會跟手。
  const rotation = useRef(0);
  const pointer = useRef<{ id: number; angle: number; moved: number } | null>(
    null,
  );

  // 捲到哪一區，就換成那一區的茶湯顏色
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-tea-tone]");
    if (sections.length === 0) return;
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

  /** 指標相對於盤心的角度 */
  function angleFromCentre(event: React.PointerEvent) {
    const box = dragRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (
      (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI
    );
  }

  function handlePointerDown(event: React.PointerEvent) {
    pointer.current = {
      id: event.pointerId,
      angle: angleFromCentre(event),
      moved: 0,
    };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent) {
    const state = pointer.current;
    if (!state || state.id !== event.pointerId) return;

    const current = angleFromCentre(event);
    let delta = current - state.angle;
    // 跨過 ±180 度的接縫時要修正，否則會突然轉一大圈
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    rotation.current += delta;
    state.angle = current;
    state.moved += Math.abs(delta);

    dragRef.current?.style.setProperty("--drag", `${rotation.current}deg`);
  }

  function handlePointerUp(event: React.PointerEvent) {
    const state = pointer.current;
    pointer.current = null;
    // 有明顯轉動就當作「轉盤子」，不要順便觸發跳頁
    if (state && state.moved > 6) event.preventDefault();
  }

  function goTo(targetId: string) {
    // 剛剛在轉盤子的話就不要跳頁
    if (pointer.current) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <div className="tea-dial">
      {/* 手轉的角度掛在這一層，捲動的旋轉掛在下一層，兩層相乘 */}
      <div
        ref={dragRef}
        className="tea-dial__drag"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
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
              aria-hidden="true"
            />
          ))}

          {/* 外圈的字。整圈跟著盤子轉，但只有字本身吃得到點擊 */}
          {labels.map((label) => (
            <button
              key={label.targetId}
              type="button"
              className="tea-dial__label"
              style={{ transform: `rotate(${label.angle}deg)` }}
              onClick={() => goTo(label.targetId)}
            >
              {/* 字再轉回來，站著的時候是正的 */}
              <span style={{ transform: `rotate(${-label.angle}deg)` }}>
                {label.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
