# Metadata 配置標準範本

這個文檔提供了標準的 metadata.json 配置範本,供您在添加新內容時參考。

## 基本結構

`metadata.json` 文件是**完全可選的**!

- 如果不需要自定義,可以不創建 metadata.json,腳本會自動使用資料夾名稱和檔案名稱
- 如果創建了 metadata.json,可以包含兩個部分:
  1. **folder** (可選): 自訂資料夾顯示名稱、描述、順序
  2. **items** (可選): 自訂檔案的標題、描述、標籤等

**最簡化情況**: 直接放圖片,不需要任何 metadata.json!

## 範本選項

### 最簡化 - 不需要 metadata.json
直接放圖片即可,腳本會自動處理!

### 選項 1: 只自訂圖片資訊
```json
{
  "items": {
    "檔案名稱.jpg": {
      "title": "作品標題",
      "date": "2025-11-06",
      "tags": ["sketch", "digital"],
      "order": 1
    }
  }
}
```

### 選項 2: 自訂資料夾名稱
```json
{
  "folder": {
    "name": "資料夾顯示名稱",
    "order": 1
  }
}
```

### 選項 3: 完整配置
```json
{
  "folder": {
    "name": "資料夾顯示名稱",
    "description": "資料夾的描述文字",
    "order": 1
  },
  "items": {
    "檔案名稱.jpg": {
      "title": "作品標題",
      "description": "作品的詳細描述",
      "date": "2025-11-06",
      "tags": ["sketch", "digital", "illustration"],
      "order": 1
    }
  }
}
```

## 欄位說明

### Folder 配置

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `name` | string | 是 | 資料夾在側邊欄顯示的名稱 |
| `description` | string | 否 | 資料夾的描述,用於提供額外資訊 |
| `order` | number | 否 | 排序順序,數字越小越靠前,預設使用資料夾建立順序 |

### Items 配置

每個檔案都可以配置以下欄位:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `title` | string | 否 | 作品標題,不填寫則使用檔案名稱 |
| `description` | string | 否 | 作品描述,可以包含創作背景、技法等詳細資訊 |
| `date` | string | 否 | 創作日期,格式: YYYY-MM-DD |
| `tags` | array | 否 | 標籤陣列,用於分類和搜尋 |
| `order` | number | 否 | 排序順序,數字越小越靠前,預設按檔案添加順序 |

## 實際範例

### 範例 1: 完整配置

```json
{
  "folder": {
    "name": "2025",
    "description": "Sketches from 2025",
    "order": 1
  },
  "items": {
    "2025-11-06.jpeg": {
      "title": "角色設計練習",
      "description": "使用 Procreate 繪製的角色設計草圖,探索不同的服裝風格",
      "date": "2025-11-06",
      "tags": ["sketch", "character design", "digital"],
      "order": 1
    },
    "2025-11-07.png": {
      "title": "風景速寫",
      "description": "戶外寫生練習,捕捉光影變化",
      "date": "2025-11-07",
      "tags": ["sketch", "landscape", "plein air"],
      "order": 2
    }
  }
}
```

### 範例 2: 簡化配置

如果不需要詳細資訊,可以省略可選欄位:

```json
{
  "folder": {
    "name": "2025",
    "order": 1
  },
  "items": {
    "2025-11-06.jpeg": {
      "title": "作品標題",
      "date": "2025-11-06",
      "tags": ["sketch", "digital"],
      "order": 1
    }
  }
}
```

### 範例 2.1: 極簡配置 (不需要 folder)

如果資料夾名稱不需要自訂,可以省略 folder 部分:

```json
{
  "items": {
    "2025-11-06.jpeg": {
      "title": "作品標題",
      "date": "2025-11-06",
      "tags": ["sketch", "digital"],
      "order": 1
    }
  }
}
```

### 範例 2.2: 最極簡 - 完全不需要 metadata.json!

如果不需要任何自訂,**直接放圖片就好**,連 metadata.json 都不用創建!
腳本會自動:
- 使用資料夾名稱作為顯示名稱
- 使用檔案名稱作為標題
- 按檔案順序排列

### 範例 3: 多個作品

```json
{
  "folder": {
    "name": "Featured Works",
    "description": "精選作品集",
    "order": 1
  },
  "items": {
    "artwork-01.png": {
      "title": "Summer Breeze",
      "description": "Digital illustration inspired by summer memories",
      "date": "2025-06-15",
      "tags": ["illustration", "digital art", "summer"],
      "order": 1
    },
    "artwork-02.jpg": {
      "title": "Character Study",
      "description": "Character design exploration with various expressions",
      "date": "2025-07-20",
      "tags": ["character design", "digital", "portrait"],
      "order": 2
    },
    "artwork-03.webp": {
      "title": "Urban Landscape",
      "description": "City scene with neon lights and rain reflections",
      "date": "2025-08-10",
      "tags": ["landscape", "urban", "cyberpunk"],
      "order": 3
    }
  }
}
```

## 常用標籤建議

以下是一些常用的標籤建議,可以根據您的需求調整:

### 作品類型
- `illustration` - 插畫
- `sketch` - 素描/草圖
- `character design` - 角色設計
- `landscape` - 風景
- `portrait` - 肖像
- `concept art` - 概念藝術

### 媒材
- `digital` - 數位繪畫
- `watercolor` - 水彩
- `oil painting` - 油畫
- `pencil` - 鉛筆
- `ink` - 墨水

### 風格
- `anime` - 動漫風格
- `realistic` - 寫實風格
- `abstract` - 抽象
- `minimalist` - 極簡風格
- `cyberpunk` - 賽博龐克

## 快速開始步驟

1. **新增作品檔案**
   ```bash
   # 將圖片放入對應資料夾
   cp your-artwork.jpg public/content/homepage/featured/2025/
   ```

2. **編輯 metadata.json**
   ```bash
   # 編輯對應資料夾的 metadata.json
   nano public/content/homepage/featured/2025/metadata.json
   ```

3. **添加作品配置**
   ```json
   "your-artwork.jpg": {
     "title": "作品標題",
     "description": "作品描述",
     "date": "2025-11-06",
     "tags": ["tag1", "tag2"],
     "order": 1
   }
   ```

4. **同步配置**
   ```bash
   npm run cms
   ```

5. **查看結果**
   ```bash
   npm run dev
   # 瀏覽器打開 http://localhost:5173
   ```

## 文件排序方案

系統提供**三種排序方式**,按優先級自動處理:

### 方案 1: 文件名前綴排序 (最簡單,推薦)

直接在文件名前加數字前綴:

```
public/content/homepage/featured/2025/
├── 01-character-design.jpg
├── 02-landscape.jpg
├── 03-portrait.jpg
└── 10-sketch.jpg
```

**優點**:
- ✅ 不需要 metadata.json
- ✅ 直觀,一看就知道順序
- ✅ 方便調整(重命名即可)
- ✅ 作品多也不怕,可以用 01, 02... 或 001, 002...

**使用技巧**:
- 用兩位數 (01-99) 適合少於 100 個作品
- 用三位數 (001-999) 適合大量作品
- 中間留空號(如 10, 20, 30),方便插入新作品

### 方案 2: 日期排序 (自動化)

使用 YYYY-MM-DD 格式的文件名或 metadata:

```
# 文件名
2025-01-15-artwork.jpg
2025-02-20-sketch.jpg

# 或 metadata.json
{
  "items": {
    "artwork.jpg": {
      "date": "2025-01-15"
    }
  }
}
```

**優點**:
- ✅ 自動按時間順序
- ✅ 適合日常創作流程
- ✅ 最新作品自動在前

### 方案 3: Order 字段 (最靈活)

在 metadata.json 中指定順序:

```json
{
  "items": {
    "highlight.jpg": { "order": 1 },
    "recent.jpg": { "order": 2 },
    "archive.jpg": { "order": 99 }
  }
}
```

**優點**:
- ✅ 完全自定義
- ✅ 可以隨時調整

**技巧**: 使用 10, 20, 30 而不是 1, 2, 3,方便中間插入

### 排序優先級

系統會按以下順序檢查:
1. **order 字段** (最高優先級)
2. **date 字段**
3. **文件名數字前綴** (01-, 02- 等)
4. **文件名字母順序** (最後備案)

### 混合使用範例

```
featured/2025/
├── 01-best-work.jpg        # 前綴排序
├── 02-featured.jpg          # 前綴排序
├── 2025-03-15-recent.jpg   # 日期排序
└── other.jpg                # 字母排序

+ metadata.json:
{
  "items": {
    "01-best-work.jpg": { "order": 1 },  # 明確指定第一
    "special.jpg": { "order": 2 }        # 沒有前綴也可以排序
  }
}
```

## 注意事項

1. **檔案名稱**: 必須與實際檔案名稱完全一致(包含副檔名)
2. **JSON 格式**: 確保 JSON 格式正確,可使用 JSON validator 檢查
3. **日期格式**: 統一使用 YYYY-MM-DD 格式
4. **標籤**: 使用小寫和連字符,保持一致性
5. **排序建議**: 
   - 少量作品(<20): 用文件名前綴 (01-, 02-)
   - 大量作品: 用文件名前綴 + metadata.json 的 order 混合
   - 日常創作: 用日期格式文件名

## 文字檔案配置

文字檔案(.txt, .md)也可以配置 metadata:

```json
"note.txt": {
  "title": "創作筆記",
  "order": 10
}
```

注意: 文字檔案只需要 `title` 和 `order` 欄位。

## 疑難排解

### Q: 修改 metadata 後看不到變化?
A: 記得運行 `npm run cms` 同步配置。

### Q: 圖片路徑錯誤?
A: 確認檔案名稱(包含副檔名)與 metadata 中的完全一致。

### Q: 標籤不顯示?
A: 檢查標籤格式是否為陣列: `["tag1", "tag2"]`

---

更多資訊請參考 `CMS_GUIDE.md`
