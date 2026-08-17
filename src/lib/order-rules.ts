/**
 * 出貨與付款的規則設定檔。
 *
 * 【運費寫在這裡，不放資料庫。】兩個理由：
 *   一、運費不常改，改一次要重新部署反而是好事 —— 留得下紀錄。
 *   二、運費必須由伺服器算。放資料庫並不會比較安全，
 *      真正的關鍵是「別讓瀏覽器決定金額」。
 *
 * 要調運費或免運門檻，只需要改這個檔案裡的數字。
 */

/** 出貨方式。資料庫存的就是這幾個英文代號。 */
export type ShippingMethod = "tcat" | "post" | "post_outlying";

/**
 * 付款方式。老闆確認：只收匯款與貨到付款。
 *
 * 【匯款帳號完全不出現在網站上】—— 訂單成立後由店家電話告知，
 * 也不做「回填轉帳末五碼」。這是業主 2026-08-17 拍板的「方案 A」。
 */
export type PaymentMethod = "transfer" | "cod";

export const SHIPPING_METHODS: readonly ShippingMethod[] = [
  "tcat",
  "post",
  "post_outlying",
];

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["transfer", "cod"];

/** 運費（TWD，含稅） */
export const SHIPPING_FEE_TWD: Record<ShippingMethod, number> = {
  tcat: 200, // 黑貓宅急便
  post: 130, // 郵局
  post_outlying: 250, // 離島（澎湖／金門／馬祖）郵局
};

/** 本島滿這個金額免運 */
export const FREE_SHIPPING_MIN_TWD = 2000;

/**
 * 免運只適用本島。
 * 【離島不適用免運】—— 這是業主明確交代的，不要因為金額到了就給折。
 */
const FREE_SHIPPING_METHODS: readonly ShippingMethod[] = ["tcat", "post"];

/** 這個出貨方式吃不吃免運？（用來在畫面上說明「離島不適用」） */
export function isFreeShippingEligible(method: ShippingMethod): boolean {
  return FREE_SHIPPING_METHODS.includes(method);
}

/**
 * 算運費。
 *
 * 【伺服器與畫面用的是同一支函式】—— 客人在結帳頁看到的預估運費，
 * 跟真正寫進訂單的運費保證同一套規則，不會出現「畫面說免運、帳單卻收 200」。
 * 但金額仍以伺服器重算為準：畫面上的小計是拿瀏覽器裡的購物車算的，
 * 伺服器則是重新查資料庫。
 */
export function shippingFeeTwd(
  method: ShippingMethod,
  subtotalTwd: number,
): number {
  if (isFreeShippingEligible(method) && subtotalTwd >= FREE_SHIPPING_MIN_TWD) {
    return 0;
  }
  return SHIPPING_FEE_TWD[method];
}

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return (
    typeof value === "string" &&
    (SHIPPING_METHODS as readonly string[]).includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}
