/**
 * 商品名稱的排版。
 *
 * 資料庫裡的名稱常常帶括號副標，例如「紅玉紅茶（台茶 18 號）」。
 * 直接當成一整串字排，會發生兩件難看的事：
 *
 *   一、括號那段跟主名稱一樣大，喧賓奪主
 *   二、換行時從括號中間斷開，變成「紅玉紅茶（台」／「茶 18 號）」
 *
 * 所以這裡把括號那段拆出來，設小一號，並且【整段不可拆行】——
 * 位置夠就跟在後面，不夠就整段一起掉到下一行。
 */
export function ProductName({ name }: { name: string }) {
  // 全形括號與半形括號都接
  const match = name.match(/^(.+?)\s*[（(](.+?)[）)]\s*$/);

  if (!match) return <>{name}</>;

  const [, base, note] = match;

  return (
    <>
      {base}
      <span className="ml-[0.15em] inline-block text-[0.55em] whitespace-nowrap opacity-75">
        （{note}）
      </span>
    </>
  );
}
