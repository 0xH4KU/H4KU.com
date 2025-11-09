# 📝 Decap CMS 使用指南

## 🚀 快速開始

### 訪問管理界面

```
https://lum-bio-mh2.pages.dev/admin/
```

首次訪問時，點擊 **Login with GitLab** 並授權即可。

### 📋 工作流模式（目前暫停）

2025-11 Sveltia CMS 尚未支援 **Editorial Workflow**。目前在 CMS 內按 **Publish** 就會直接建立 commit。

🔁 **如果需要一次提交多個變更：**
- 在 CMS 內 **Save draft**，待所有內容修改完成後，到 GitLab 建立 MR 時手動 squash
- 或者先在 CMS 裡建立一個專用分支（Sveltia 會自動開分支），所有變更完成後一次 Merge

一旦 Sveltia 支援 Editorial Workflow，我們會再更新設定與文件。

## 📚 功能說明

### 🖼️ Images / 圖片作品

管理你的圖片作品集

**添加新作品：**
1. 左側菜單 → **Images**
2. 點擊 **New Image**
3. 填寫基本信息：
   - **ID**: 簡單編號（例如：`1`, `2`, `portrait`, `sketch-01`）
     - 只能用**小寫英文、數字、連字符**
     - 不可用中文或空格
     - 系統會自動加上文件夾前綴
   - **Filename**: 顯示的檔名（例如：`1.png`, `artwork.jpg`, `sketch-01.webp`）
     - 必須包含副檔名 (.png / .jpg / .webp)
     - 不可用中文或空格
   - **Folder (optional)**: 從下拉列表搜尋任何資料夾（支援巢狀層級）。留白就會直接顯示在 lum.bio 首頁。
   - **Date**: 選擇作品日期
   - **Sort Order**: 可選，調整顯示順序，數字越小越靠前；不填則依日期排序
4. 上傳圖片：
   - **Image**: 上傳或貼上圖片 URL（建議 1920x1080 以上）
   - 💡 無需額外縮圖欄位，系統會自動沿用原圖做預覽
5. 添加詳細信息（可選）：
   - **Title**: 作品標題
   - **Description**: 作品描述
   - **Tags**: 從預設標籤中選擇（可多選）：
     - 🎨 Fan Art（同人創作）
     - ✨ Original Character (OC)（原創角色）
     - 💼 Commission（委託作品）
     - ✏️ Sketch（草圖/速寫）
     - 🖼️ Illustration（完整插畫）
     - 👤 Portrait（人物/頭像）
     - 🧍 Full Body（全身圖）
     - 🎭 Chibi（Q版）
6. 點擊 **Publish**

**💡 上傳提示：**
- 只需上傳一張高清圖片，系統會自動沿用於清單與 Lightbox
- 上傳到 `/images/uploads/` 目錄
- 單張圖片最大 10MB

- **列表預設會顯示所有作品**，並依照資料夾自動分組（沒有額外篩選條件）
- 使用右上角的 **篩選器** 可快速切換：
  - ⭐ **Featured (All)**、✏️ **Sketches (All)** 等「父層集合」
  - 🗂️ **Featured › 2025** 這類子資料夾（清單會依 `src/content/folders` 自動生成）
- 首頁作品（沒有 folderId）會顯示在分組列表的 **Other**/未分組區塊
- 使用 **搜尋框** 或 **Folder Id** 排序欄可快速定位
- 點擊欄位標題排序：
  - **Folder Id**: 按資料夾分組查看（推薦！）
  - **Filename**: 按檔名排序
  - **Order**: 按自訂順序
  - **Date**: 按日期排序

💡 **管理大量作品的技巧**：
1. 使用 **篩選器** 快速定位到特定資料夾（如：Sketches › 2025）
2. 點擊 **Folder Id** 排序，同資料夾的作品會集中在一起
3. 使用 **搜尋框** 搜尋特定檔名或資料夾 ID

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

- 預設顯示所有頁面，由系統自動依資料夾分組
- 如果頁面沒有 folderId，會落在分組列表的 **Other** 區塊
- 目前暫時沒有額外的內建篩選器（Sveltia 不支援「folderId 為空」的條件）
- 使用搜尋/排序即可快速定位所需頁面

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

## 🔄 批量操作說明

### 目前的批量操作策略

Sveltia CMS 尚未提供 Editorial Workflow，所以沒有 Draft/Ready/Publish 流程。建議改用下列方式：

1. **GitLab 分支 / MR**
   - Sveltia 會在你首次儲存時自動建立一個 branch（例如 `sveltia/cms-username`）
   - 在該分支完成所有內容修改
   - 回到 GitLab 建立 Merge Request，最後選擇 **Squash and merge**，即可把多個變更合併成一個 commit

2. **手動腳本（大量刪除/搬移）**
   ```bash
   # 批量刪除或搬移仍建議直接在 repo 內操作
   git rm src/content/**/*test*
   git commit -m "Clean up test files"
   git push
   ```
   使用命令列可以一次處理多個檔案，也不會被 CMS 的限制卡住。

3. **小幅變更**
   - 在 CMS 中直接 **Publish**，即時生成 commit
   - 若覺得 commit 太多，可定期在 GitLab 上 rebase/squash

等 Sveltia 官方支援 Editorial Workflow 後，我們會再重新啟用並更新流程。

---

## 💡 使用技巧

### 圖片管理

- **建議尺寸**：1920x1080 px 或更高（同一張圖會用於縮圖與 Lightbox）
- **支持格式**：JPG、PNG、WebP
- **文件大小**：單張圖片最大 10MB
- **上傳位置**：所有圖片保存在 `public/images/uploads/`
- **自動功能**：
  - ✅ 上傳一張圖即可，同時供列表與 Lightbox 使用
  - ✅ 可在媒體庫中重複使用

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

### 自動更新篩選器與分組

新增/調整資料夾後，記得重新生成 CMS 設定：

1. 在 repo 中新增或編輯 `src/content/folders/*.json`
2. 執行 `npm run cms:config`
3. 腳本會讀取資料夾結構，重新產生 `public/admin/config.yml`
   - ⭐/✏️ 等父層濾鏡和 `🗂️ Featured › 2025` 等子濾鏡都會自動更新
4. 將 `public/admin/config.yml` 的變更提交即可

### 內容驗證（避免 CMS 卡死）

在提交前執行 `npm run cms:lint`：
- 檢查 `pages`/`works`/`folders` 是否有重複 ID
- 確認 `folderId` 都指向有效資料夾
- 若有問題會列出清單並以非零狀態碼結束

💡 建議把 `cms:lint` 納入 CI 或至少在 Merge Request 前跑一次，就不會再出現「點集合作品後整個卡死」的情況。

**範例輸出：**
```
📁 Current folder structure:

⭐ Featured (featured)
  ├─ 2025 (featured-2025)
  └─ 2026 (featured-2026)  ← 新增的資料夾
✏️ Sketches (sketches)
  └─ 2025 (sketches-2025)
💼 Commissions (commissions)  ← 新增的資料夾

📋 Suggested view_filters:
   (自動生成的配置，直接複製粘貼即可)
```

**篩選器語法說明：**
- `^featured` - 匹配所有以 featured 開頭的資料夾
- `^featured-2025$` - 精確匹配 featured-2025
- 使用正則表達式，非常靈活

**優點：**
- ✅ 自動偵測資料夾，避免手動逐一輸入
- ✅ 可自訂 emoji / 標籤
- ⚠️ 目前僅用於 `Featured` / `Sketches` 這類有 folderId 的篩選條件

### 批量編輯

1. 在列表視圖中可以看到所有內容
2. 使用排序和篩選快速定位
3. 逐個編輯並發布

### Git 歷史

- 所有修改都會創建 Git commit
- 可以在 GitLab 查看完整歷史
- 如需回滾，可以用 Git revert

## ⚠️ 注意事項

### 為什麼暫時看不到 Workflow？

- Sveltia CMS 官方文件指出：**Editorial Workflow 尚未推出**，預計會在 1.x 版才支援
- 因此我們已停用相關設定，避免出現「No entries found」「New button 失效」等錯誤
- 目前只能使用「Publish 立即提交」或「GitLab 分支/MR」的方式整理 commit

一旦官方釋出支援，會再重新開啟並同步更新文件。

### 不要運行 sync-images

- ❌ **不要運行** `npm run sync-images`
- 這個腳本已廢棄，會覆蓋 CMS 管理的內容
- 所有內容應該通過 CMS 管理

### ID 命名規範

**重要：所有 ID 和檔名必須使用英文，不可用中文或空格！**

- **Images ID**: 簡單的英文編號
  - ✅ 正確：`1`, `2`, `portrait`, `sketch-01`, `commission-2025`
  - ❌ 錯誤：`作品1`, `portrait 1`, `sketch_01`（不可用中文、空格、底線）
  - 只能用：小寫英文字母（a-z）、數字（0-9）、連字符（-）
  - 系統會自動加上資料夾前綴：`featured-1.json`, `sketches-portrait.json`
  - 不同文件夾可用相同 ID（如都用 `1`, `2`, `3`）

- **Images Filename**: 顯示的英文檔名
  - ✅ 正確：`1.png`, `artwork.jpg`, `sketch-01.webp`
  - ❌ 錯誤：`作品.png`, `my art.jpg`, `圖片1.png`
  - 必須包含副檔名：`.png` / `.jpg` / `.webp`

- **Pages ID**: 小寫英文、連字符
  - ✅ 正確：`about`, `privacy-policy`, `contact`
  - ❌ 錯誤：`About`, `privacy_policy`, `聯絡我們`

- **Folder ID**: 小寫英文、連字符
  - ✅ 正確：`featured`, `sketches-2025`, `commissions`
  - ❌ 錯誤：`Featured`, `sketches_2025`, `精選作品`

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
- 若同時需要社群預覽，可額外生成一份低解析度檔案（前端仍只需要一張圖）

---

## 🆘 獲取幫助

- **文檔**: [Decap CMS 官方文檔](https://decapcms.org/docs/)
- **問題**: 在 GitLab 倉庫創建 Issue
- **緊急**: 聯繫開發者

---

## 🎉 享受使用！

現在你可以隨時隨地管理你的作品集了！

有問題隨時問我 🤗
