import type { Locale } from "./config";
import en from "./dictionaries/en.json";
import zh from "./dictionaries/zh.json";

/**
 * 介面文字的翻譯檔。
 *
 * 這裡放的是「網站介面」的字（選單、按鈕、頁尾…）。
 * 商品的名稱與介紹**不在這裡** —— 那些存在資料庫的雙語欄位，
 * 因為業主要能在後台自己維護，不需要工程師改程式。
 *
 * 中文檔（zh.json）是基準。英文檔若少了某個詞，TypeScript 會直接報錯，
 * 不會等到網站上線才發現有一塊是空的。
 */
export type Dictionary = typeof zh;

const dictionaries: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
