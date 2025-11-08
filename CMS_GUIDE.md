# 📝 Decap CMS 使用指南

## 🚀 快速開始

### 訪問管理界面

```
https://lum-bio-mh2.pages.dev/admin/
```

首次訪問時，點擊 **Login with GitLab** 並授權即可。

### 📋 工作流模式（批量操作）

CMS 已啟用 **Editorial Workflow** 模式，讓你可以累積多個變更，最後統一發布成一個 commit。

**界面說明：**
- **Content**: 查看和編輯所有內容（和以前一樣）
- **Workflow**: 管理草稿和待發布的變更（新功能！）

**推薦使用方式：**
- **單個修改**：直接在 Content 裡編輯 → 點 Publish（立即生成 commit）
- **批量操作**：在 Content 裡進行多次編輯/刪除 → 到 Workflow 統一發布

## 📚 功能說明

### 🖼️ Images / 圖片作品

管理你的圖片作品集

**添加新作品：**
1. 左側菜單 → **Images**
2. 點擊 **New Image**
3. 填寫基本信息：
   - **ID**: 輸入簡單的編號即可，例如 `1`, `2`, `portrait`（系統會自動加上文件夾名稱避免衝突）
   - **Filename**: 顯示的檔名（例如：`1.png`, `artwork.png`）
   - **Folder (optional)**: 從下拉列表搜尋任何資料夾（支援巢狀層級）。留白就會直接顯示在 lum.bio 首頁。
   - **Date**: 選擇作品日期
   - **Sort Order**: 可選，調整顯示順序，數字越小越靠前；不填則依日期排序
4. 上傳圖片：
   - **縮略圖**: 小圖預覽（建議 400x400）
   - **完整圖片**: 高清大圖
   - **尺寸**: 可選，例如 `1920x1080`
5. 添加詳細信息（可選）：
   - **標題**: 作品標題
   - **描述**: 作品描述
   - **客戶**: 委託客戶
   - **標籤**: 多個標籤，按 Enter 添加
6. 點擊 **Publish**

**批量上傳圖片：**
1. 點擊圖片字段
2. 可以一次選擇多個文件上傳
3. 上傳到 `/images/uploads/` 目錄

**快速找到文件：**
- 列表顯示格式：`檔名 • 資料夾名稱`（例如：`1.png • featured-2025-test`）
- 使用右上角的 **篩選器** 快速查看：
  - **Homepage Only**: 只顯示首頁的圖片
  - **In Folders**: 只顯示資料夾裡的圖片
- 使用 **搜尋框** 搜尋檔名或資料夾名稱
- 點擊欄位標題排序：
  - **Folder Id**: 按資料夾分組查看（推薦！）
  - **Filename**: 按檔名排序
  - **Order**: 按自訂順序
  - **Date**: 按日期排序

💡 **小提示**：點擊 **Folder Id** 欄位排序，可以把同一個資料夾的圖片集中在一起，方便批量管理！

---

### 📄 Pages / 文本頁面

管理網站的文本頁面（About.txt、Contact.txt 等）

**添加新頁面：**
1. 左側菜單 → **Pages**
2. 點擊 **New Page**
3. 填寫：
   - **ID**: `privacy` 或 `contact`（小寫、無空格）
   - **顯示名稱**: `Privacy.txt`（首頁顯示的檔名）
   - **Folder (optional)**: 想要放進某個資料夾時，直接從下拉列表選擇即可。留白就會顯示在首頁。
   - **Folder Filename Override**: 當頁面放在資料夾裡時可以自訂檔名（預設沿用顯示名稱）
   - **Sort Order**: 可選，數字越小越靠前
   - **Published Date**: 可選，用於排序
   - **內容**: 輸入頁面內容
4. 點擊 **Publish**
5. 等待 1-2 分鐘部署

**快速找到文件：**
- 列表顯示格式：`檔名 • 資料夾名稱`（例如：`About.txt • [Home]`）
- 使用右上角的 **篩選器**：
  - **Homepage Only**: 只顯示首頁的頁面
  - **In Folders**: 只顯示資料夾裡的頁面
- 使用 **搜尋框** 搜尋檔名或資料夾名稱
- 點擊 **Folder Id** 欄位排序，按資料夾分組查看

**編輯現有頁面：**
1. 左側菜單 → **Pages**
2. 點擊要編輯的頁面
3. 修改內容
4. 點擊 **Publish**

---

### 🗂️ Folders / 文件夾

管理文件夾結構

**添加新文件夾：**
1. 左側菜單 → **Folders**
2. 點擊 **New Folder**
3. 填寫：
   - **Folder ID**: `commissions` （小寫）
   - **Folder Name**: `Commissions`
4. 巢狀設定（可選）：
   - **Parent Folder**: 直接從下拉列表選擇要歸屬的父層（支援任意深度）。
   - **Sort Order**: 數字越小越靠前，可控制同層的排序。
   - **Hidden**: 若只想拿來放作品、不想顯示在 UI，可勾選。
5. 點擊 **Publish**。只要建立了資料夾，它就會自動出現在 Works / Pages 的下拉選單裡，不需再手動改設定。

---

### 🔗 Social Links / 社交鏈接

管理社交媒體鏈接

**添加社交鏈接：**
1. 左側菜單 → **Social Links**
2. 點擊 **New Social Link**
3. 填寫：
   - **名稱**: `Instagram`
   - **代碼**: `IG` （2-3個大寫字母）
   - **URL**: `https://instagram.com/username`
4. 點擊 **Publish**

---

## 🔄 批量操作教學

### 情境：清理測試文件（統一 commit）

假設你想刪除多個測試文件，並且只生成一個 commit：

**步驟：**

1. **進入 Content 標籤**
   - 選擇要操作的類型（Images / Pages / Folders）

2. **進行第一次刪除**
   - 點擊要刪除的項目
   - 點擊 **Delete entry**
   - ⚠️ **重要**：在彈出的對話框中選擇 **Delete unpublished entry** 或直接確認
   - 這個刪除會進入「草稿」狀態，**不會**立即產生 commit

3. **繼續刪除其他項目**
   - 重複步驟 2，刪除所有想刪除的內容
   - 每次刪除都會進入草稿狀態

4. **切換到 Workflow 標籤**
   - 點擊頂部的 **Workflow** 標籤
   - 你會看到三個列表：
     - **Drafts**（草稿）：新建的內容
     - **In Review**（審核中）：可選的中間狀態
     - **Ready**（就緒）：準備發布的變更

5. **查看待刪除的項目**
   - 在 **Drafts** 列表中，你會看到所有待刪除的項目
   - 可以點擊預覽或修改

6. **統一發布（生成一個 commit）**
   - 將所有項目移到 **Ready** 狀態（或直接從 Drafts 發布）
   - 點擊 **Publish** 按鈕
   - 系統會生成**一個** commit，包含所有變更
   - Commit 訊息會自動生成，包含所有變更的摘要

**結果：**
```
✅ 一個 commit: "Delete test files (10 files removed)"

而不是：
❌ 10 個 commits:
    "Delete test-1.png"
    "Delete test-2.png"
    ...
```

### 情境：批量添加新內容

1. 在 Content 中創建第一個新項目 → Save（進入 Draft）
2. 繼續創建其他項目 → 都 Save
3. 到 Workflow → 檢查所有新項目
4. 統一 Publish → 一個 commit 包含所有新內容

### 情境：混合操作（新增 + 編輯 + 刪除）

1. 刪除一些舊文件
2. 編輯一些現有內容
3. 新增一些新內容
4. 到 Workflow 統一發布 → 一個 commit："Update portfolio - add new works, remove old tests, update descriptions"

---

## 💡 使用技巧

### 圖片管理

- **建議尺寸**：
  - 縮略圖：400x400 px
  - 完整圖片：1920x1080 px 或更高
- **支持格式**：JPG、PNG、WebP
- **上傳位置**：所有圖片保存在 `public/images/uploads/`
- **使用圖片**：上傳後可以在媒體庫中重複使用

### 內容預覽

- 編輯時可以點擊右上角的眼睛圖標預覽
- 發布前確認所有內容正確

### 部署時間

- 每次 Publish 後需要等待 **1-2 分鐘**
- CI/CD 會自動構建和部署
- 可以在 GitLab Pipelines 查看進度

### 移動端使用

- Decap CMS 支持手機和平板瀏覽器
- 隨時隨地更新內容
- 圖片上傳在移動端也完全支持

---

## 🎨 高級功能

### 批量編輯

1. 在列表視圖中可以看到所有內容
2. 使用排序和篩選快速定位
3. 逐個編輯並發布

### Git 歷史

- 所有修改都會創建 Git commit
- 可以在 GitLab 查看完整歷史
- 如需回滾，可以用 Git revert

## ⚠️ 注意事項

### Editorial Workflow 模式說明

**兩種發布方式：**

1. **立即發布（單個變更）**
   - 在編輯頁面直接點 **Publish now**
   - 立即生成一個 commit 並部署
   - 適合：單個緊急修改

2. **延遲發布（批量變更）**
   - 在編輯頁面點 **Save**（不要點 Publish）
   - 變更進入 Workflow
   - 累積多個變更後，到 Workflow 統一 Publish
   - 適合：大量清理、批量上傳

**已發布的內容如何編輯？**
- 編輯已發布的內容時，會創建一個「待審核」版本
- 修改會進入 Workflow，不會立即生效
- 在 Workflow 中 Publish 後才會更新

**如何取消草稿？**
- 在 Workflow 中點擊項目
- 點擊 **Delete unpublished changes**
- 不會影響已發布的內容

### 不要運行 sync-images

- ❌ **不要運行** `npm run sync-images`
- 這個腳本已廢棄，會覆蓋 CMS 管理的內容
- 所有內容應該通過 CMS 管理

### ID 命名規範

- **Images ID**: 只需要輸入簡單的編號，例如 `1`, `2`, `3` 或 `portrait`, `landscape`
  - 系統會自動生成：`featured-2025-1.json`, `sketches-portrait.json`
  - 不同文件夾下可以用相同的 ID（如都用 `1`, `2`, `3`）
- **Pages ID**: 小寫、連字符，例如 `about`, `privacy-policy`, `contact`
- **Folder ID**: 小寫、連字符，例如 `featured`, `sketches-2025`, `commissions`

### 避免並發編輯

- 不要同時在 CMS 和本地代碼編輯相同文件
- 可能導致 Git 衝突

---

## 🐛 故障排查

### 無法登錄

- 檢查網絡連接
- 確認 GitLab OAuth 應用配置正確
- 清除瀏覽器緩存後重試

### 圖片上傳失敗

- 檢查圖片大小（建議 < 5MB）
- 檢查圖片格式（JPG/PNG/WebP）
- 確認網絡穩定

### 發布後看不到更新

1. 等待 2-3 分鐘
2. 檢查 GitLab Pipeline：`https://gitlab.com/lummuu/lum.bio/-/pipelines`
3. 清除瀏覽器緩存（Ctrl+Shift+R / Cmd+Shift+R）
4. 如果 Pipeline 失敗，查看錯誤日誌

### 內容丟失

- 所有修改都有 Git 歷史記錄
- 可以在 GitLab 回滾到之前的版本
- 聯繫開發者協助恢復

---

## 📱 移動端使用

### iOS Safari

1. 訪問 `/admin/`
2. 點擊分享 → 添加到主屏幕
3. 像原生應用一樣使用

### Android Chrome

1. 訪問 `/admin/`
2. 菜單 → 添加到主屏幕
3. 獲得原生應用體驗

---

## 🎯 最佳實踐

### 定期備份

雖然 Git 已經保存所有歷史，但建議：
- 定期檢查 GitLab 倉庫
- 重要修改前可以創建 Git tag

### 內容組織

- **Featured**: 精選作品
- **Sketches**: 草圖和速寫
- 考慮按年份組織（2024, 2025...）
- 使用標籤分類（人物、風景、委託等）

### 圖片優化

- 上傳前使用工具壓縮圖片
- 保持合理的文件大小
- 為縮略圖和完整圖使用不同尺寸

---

## 🆘 獲取幫助

- **文檔**: [Decap CMS 官方文檔](https://decapcms.org/docs/)
- **問題**: 在 GitLab 倉庫創建 Issue
- **緊急**: 聯繫開發者

---

## 🎉 享受使用！

現在你可以隨時隨地管理你的作品集了！

有問題隨時問我 🤗
