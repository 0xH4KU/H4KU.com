# 📝 Decap CMS 使用指南

## 🚀 快速開始

### 訪問管理界面

```
https://lum-bio-mh2.pages.dev/admin/
```

首次訪問時，點擊 **Login with GitLab** 並授權即可。

## 📚 功能說明

### 📄 Pages / 頁面

管理網站的文本頁面（About.txt、Contact.txt 等）

**添加新頁面：**
1. 左側菜單 → **Pages**
2. 點擊 **New Page**
3. 填寫：
   - **ID**: `privacy` （小寫、無空格）
   - **顯示名稱**: `Privacy.txt`（首頁顯示的檔名）
   - **Folder (optional)**: 想要放進某個資料夾時，直接從下拉列表選擇即可。留白就會顯示在首頁。
   - **Folder Filename Override**: 當頁面放在資料夾裡時可以自訂檔名（預設沿用顯示名稱）。
   - **Sort Order / Published Date**: 可選，拿來控制排序（數字越小越靠前）。
   - **內容**: 輸入頁面內容
4. 點擊 **Publish**
5. 等待 1-2 分鐘部署。若有選擇資料夾，該頁面會像 .txt 檔一樣出現在該資料夾裡，可直接點擊閱讀。

**編輯現有頁面：**
1. 左側菜單 → **Pages**
2. 點擊要編輯的頁面
3. 修改內容
4. 點擊 **Publish**

---

### 📁 Works / 作品

管理你的作品集

**添加新作品：**
1. 左側菜單 → **Works**
2. 點擊 **New Work**
3. 填寫基本信息：
   - **ID**: `work-001` （唯一標識）
   - **Item Type**: 選擇「Image Work」或「Text Page（.txt）」。
   - **Filename**: 顯示的名稱（會出現在資料夾或首頁）。
   - **Folder (optional)**: 從下拉列表搜尋任何資料夾（支援巢狀層級）。留白就會直接顯示在 lum.bio 首頁。
   - **Date**: 選擇作品日期。
   - **Sort Order**: 可選，調整顯示順序，數字越小越靠前；不填則依日期排序。
4. 上傳圖片：
   - **縮略圖**: 小圖預覽（建議 400x400）
   - **完整圖片**: 高清大圖
   - **尺寸**: 可選，例如 `1920x1080`
5. 添加詳細信息（可選）：
   - **標題**: 作品標題
   - **描述**: 作品描述
   - **標籤**: 多個標籤，按 Enter 添加
   - **客戶**: 委託客戶
   - **Content**: 若 Item Type 選擇 Text Page，可在此輸入文字內容
6. 點擊 **Publish**

💡 **小提示**：想把圖片或 .txt 直接放在 lum.bio 首頁？建立作品時只要把 **Folder** 留空即可；依然可以設定 Sort Order 來調整排列順序。

**批量上傳圖片：**
1. 點擊圖片字段
2. 可以一次選擇多個文件上傳
3. 上傳到 `/images/uploads/` 目錄

**篩選和排序：**
- 使用列表右上角的搜尋框快速鎖定特定檔名或資料夾
- 可按排序欄位（Order、Date、Folder 等）調整顯示。若有設定 Sort Order，系統會優先依數字排序，再依日期由新到舊排列。

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

### 不要運行 sync-images

- ❌ **不要運行** `npm run sync-images`
- 這個腳本已廢棄，會覆蓋 CMS 管理的內容
- 所有內容應該通過 CMS 管理

### ID 命名規範

- **Pages ID**: 小寫、連字符，例如 `about`, `privacy-policy`
- **Works ID**: 推薦格式 `work-001`, `work-002`
- **Folder ID**: 小寫、連字符，例如 `featured`, `sketches-2025`

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
