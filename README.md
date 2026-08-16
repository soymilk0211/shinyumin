# 御茗有限公司 品牌電商網站

SHIN-YU-MIN Co., Ltd. — 日月潭魚池產區紅茶，家族製茶。

## 文件

| 文件 | 內容 |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | **先讀這份。** 專案共同語言：商品、規格、訂單等詞彙的定義，以及不可違背的規則 |
| [`docs/HANDOVER.md`](docs/HANDOVER.md) | 完整需求訪談結論：技術決定、商業規則、資料表設計、開發步驟、已知地雷 |
| [`docs/`](docs/) | 每個開發步驟的繁體中文說明（做了什麼、檔案在哪、怎麼驗證） |

## 技術

Next.js（App Router）+ TypeScript + Tailwind CSS，資料庫用 Supabase，部署在 Vercel。

## 在自己電腦上跑起來

```bash
npm install
npm run dev
```

然後打開 http://localhost:3000

## 常用指令

```bash
npm run dev     # 開發模式（改了程式碼會自動更新畫面）
npm run build   # 打包成正式版，順便檢查有沒有錯誤
npm run lint    # 檢查程式碼寫法
```
