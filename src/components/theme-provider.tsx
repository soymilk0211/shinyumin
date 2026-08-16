"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * 深淺色模式的總開關。
 *
 * 它做的事是在 <html> 標籤上掛一個 class="dark"，
 * 全站的顏色就會整組換成 theme.css 裡定義的深色版本。
 *
 * 預設跟隨訪客的作業系統設定（手機開了深色模式，網站就是深色），
 * 訪客也可以自己按右上角的按鈕切換，選擇會記在瀏覽器裡。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
