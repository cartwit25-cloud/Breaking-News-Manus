# 🔥 Breaking News — 部署說明

本網站由兩個部分組成：
- **前端**：靜態 HTML/CSS/JS，部署在 GitHub Pages
- **後端**：Google Apps Script (GAS)，負責抓取 RSS 新聞並存入 Google Sheet

---

## 📋 部署步驟

### Step 1：建立 Google Sheet + GAS 後端

1. 前往 [Google Sheets](https://sheets.google.com) 建立一個新的試算表
2. 點選上方選單 **Extensions（擴充功能）→ Apps Script**
3. 刪除預設的空白程式碼，將 `gas_backend.js` 的全部內容貼入
4. 點選 **儲存（Ctrl+S）**，專案名稱可命名為 `Breaking News Backend`

### Step 2：部署 GAS 為 Web App

1. 點選右上角 **Deploy（部署）→ New Deployment（新增部署）**
2. 點選 **Select type（選擇類型）→ Web app（網頁應用程式）**
3. 填寫設定：
   - **Description**：Breaking News API
   - **Execute as（執行身分）**：Me（我）
   - **Who has access（存取權限）**：Anyone（所有人）
4. 點選 **Deploy（部署）**
5. 複製顯示的 **Web App URL**（格式如 `https://script.google.com/macros/s/XXXXX/exec`）

> ⚠️ 注意：每次修改 GAS 程式碼後，需要重新部署（New Deployment）才會生效

### Step 3：部署前端到 GitHub Pages

1. 在 GitHub 建立一個新的 Repository（例如 `breaking-news`）
2. 將以下檔案上傳到 Repository：
   - `index.html`
   - `style.css`
   - `app.js`
3. 前往 Repository 的 **Settings → Pages**
4. Source 選擇 **Deploy from a branch**，Branch 選 **main**，資料夾選 **/ (root)**
5. 點選 **Save**，等待幾分鐘後，GitHub Pages 會提供一個網址

### Step 4：連接前後端

1. 開啟你的 GitHub Pages 網址
2. 點選右上角的 **⚙️ 設定按鈕**
3. 將 Step 2 複製的 **GAS Web App URL** 貼入輸入框
4. 點選 **💾 儲存設定**
5. 網頁會自動開始抓取新聞！

---

## 🔄 Refresh 說明

| 按鈕 | 功能 | 說明 |
|------|------|------|
| **Quick** | 快速更新 | 只補入比現有更新的最多 5 則新聞，不重新排序 |
| **Full** | 完整重抓 | 重新抓取全部 20 則，自動去重、重新分類排序 |

> **Reload 頁面**：不會重新呼叫 API，直接從 Google Sheet 讀取快取資料

---

## 📊 Google Sheet 欄位說明

| 欄位 | 說明 |
|------|------|
| Title | 新聞標題 |
| Summary | 3-5 行摘要 |
| WhyItMatters | 一句話判斷（為什麼重要） |
| Impact | 影響等級（🔴/🟡/⚪） |
| Source | 來源媒體 |
| Link | 原始文章連結 |
| PubDate | 發布時間 |
| Category | 分類標籤 |
| Timestamp | 最後同步時間戳 |

---

## 🆓 費用說明

本網站完全免費：
- **Google Apps Script**：免費（每天 6 分鐘執行時間限制）
- **Google Sheets**：免費
- **GitHub Pages**：免費
- **RSS Feeds**：全部為公開免費 RSS

---

## 📡 新聞來源

| 媒體 | RSS 類型 |
|------|---------|
| Reuters | 頭條 + 商業 |
| AP | 頭條 + 商業 |
| BBC | 頭條 + 世界 + 科技 |
| Bloomberg | 市場 + 政治 |
| WSJ | 世界 + 商業 |
| Financial Times | 首頁 |
| NYT | 首頁 + 世界 + 科技 |
| Washington Post | 世界 + 商業 |
| CNN | 版本 + 世界 |
| The Guardian | 世界 + 科技 |
| Deutsche Welle | 全部 + 世界 |
| The Economist | 財經 + 國際 |
| AFP/France24 | 頭條 |

---

## ❓ 常見問題

**Q: 為什麼新聞顯示的是示範資料？**
A: 尚未設定 GAS 網址。點擊右上角 ⚙️ 按鈕進行設定。

**Q: 為什麼 Full Refresh 很慢？**
A: GAS 需要抓取多個 RSS 來源，通常需要 15-30 秒，請耐心等待。

**Q: 如何讓新聞自動更新？**
A: 在 GAS 編輯器中，點選 **Triggers（觸發器）→ Add Trigger**，設定 `manualFullRefresh` 每小時執行一次。

**Q: 某些來源的新聞沒有出現？**
A: 部分媒體（如 Bloomberg、FT）的 RSS 可能有存取限制，GAS 會自動跳過並繼續抓取其他來源。
