# CMS 使用指南

這個專案使用基於檔案系統的內容管理系統(CMS),讓您可以透過直接編輯檔案來管理網站內容。

## 目錄結構

```
public/content/homepage/     # 所有內容的根目錄
├── About.txt                # 首頁層級的文字檔(顯示在側邊欄)
├── Contact.txt              # 首頁層級的文字檔(顯示在側邊欄)
├── featured/                # Featured 資料夾
│   ├── metadata.json        # 資料夾配置
│   └── 2025/                # 2025 子資料夾
│       ├── metadata.json    # 子資料夾配置
│       ├── image1.png       # 圖片檔案
│       └── note.txt         # 資料夾內的文字檔
└── sketches/                # Sketches 資料夾
    ├── metadata.json
    └── 2025/
        └── metadata.json
```

## 工作流程

### 1. 新增內容

#### 新增圖片作品
1. 將圖片檔案放入對應的資料夾,例如: `public/content/homepage/featured/2025/`
2. (可選)在該資料夾的 `metadata.json` 中添加圖片的 metadata
3. 運行同步命令: `npm run cms`

#### 新增文字檔
- **首頁層級**: 放在 `public/content/homepage/` 下,會顯示在側邊欄
- **資料夾內**: 放在任何子資料夾內,會顯示為該資料夾的內容項目

#### 新增資料夾
1. 在對應位置創建新資料夾
2. 在資料夾內創建 `metadata.json` 檔案
3. 運行同步命令: `npm run cms`

### 2. 配置 Metadata

每個資料夾都應該有一個 `metadata.json` 檔案:

```json
{
  "folder": {
    "name": "資料夾顯示名稱",
    "description": "資料夾描述(可選)",
    "order": 1
  },
  "items": {
    "image1.png": {
      "title": "作品標題",
      "description": "作品描述",
      "date": "2025-01-01",
      "tags": ["digital", "illustration"],
      "order": 1
    },
    "note.txt": {
      "title": "筆記標題",
      "order": 2
    }
  }
}
```

### 3. 同步內容

每次修改內容後,運行以下命令來同步配置:

```bash
npm run cms
```

這個命令會:
- 掃描 `public/content/homepage/` 下的所有檔案和資料夾
- 自動生成 `src/content/folders/` 下的資料夾配置
- 自動生成 `src/content/images/` 下的圖片作品配置  
- 自動生成 `src/content/pages/` 下的頁面配置

## 支援的檔案格式

### 圖片格式
- `.png`
- `.jpg` / `.jpeg`
- `.webp`
- `.gif`
- `.svg`

### 文字格式
- `.txt`
- `.md`

## 注意事項

1. **檔案命名**: 建議使用英文和數字,避免使用特殊字符
2. **Metadata**: 如果不提供 metadata,系統會使用檔案名稱作為預設值
3. **Order**: order 數值越小,顯示順序越前面
4. **同步**: 每次修改檔案後記得運行 `npm run cms`

## 範例

### 新增一個作品到 Featured/2025

1. 將圖片 `artwork.png` 複製到 `public/content/homepage/featured/2025/`

2. 編輯 `public/content/homepage/featured/2025/metadata.json`:
```json
{
  "folder": {
    "name": "2025",
    "description": "Featured works from 2025",
    "order": 1
  },
  "items": {
    "artwork.png": {
      "title": "My Amazing Artwork",
      "description": "This is a beautiful illustration",
      "date": "2025-01-15",
      "tags": ["illustration", "character"],
      "order": 1
    }
  }
}
```

3. 運行同步:
```bash
npm run cms
```

4. 啟動開發服務器查看:
```bash
npm run dev
```

## 疑難排解

### 問題: 運行 `npm run cms` 後看不到新內容
- 確認檔案放在正確的位置 (`public/content/homepage/`)
- 確認 metadata.json 格式正確(可用 JSON validator 檢查)
- 檢查控制台輸出是否有錯誤訊息

### 問題: 圖片無法顯示
- 確認圖片檔案格式是否支援
- 確認檔案路徑正確
- 檢查瀏覽器開發者工具的 Network 標籤

### 問題: 資料夾層級顯示不正確
- 確認每個資料夾都有 `metadata.json`
- 確認 `parentId` 設定正確(腳本會自動處理)

## 進階用法

### 批量新增作品
您可以一次性添加多個檔案,然後一次運行 `npm run cms` 來同步所有變更。

### 備份
建議定期備份 `public/content/` 目錄,因為這是您所有內容的來源。

### 版本控制
所有內容檔案都應該納入 Git 版本控制,方便追蹤變更歷史。

---

如有任何問題,請參考專案的其他文檔或聯繫開發者。
