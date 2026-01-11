# H4KU.com 代碼改進清單

> 最後更新：2026-01-11

## 概述

本文檔記錄了代碼庫分析後發現的改進項目，按優先級分類整理。

---

## 🔴 關鍵問題（Critical）

### 1. 缺少服務端速率限制

- **位置**：`functions/api/contact.ts`
- **問題**：目前只有客戶端 60 秒冷卻機制，沒有服務端速率限制
- **風險**：容易被機器人攻擊
- **建議**：使用 Cloudflare 的 namespace bindings 或自定義中間件實現服務端速率限制

### 2. CORS 寫死單一域名

- **位置**：`functions/api/contact.ts:418, 537`
- **問題**：CORS origin 寫死為 `https://h4ku.com`
- **影響**：staging 環境（如 `h4ku-com.pages.dev`）請求會失敗
- **建議**：從允許的域名列表中接受 CORS origin，或使用環境變數配置

### 3. SearchPanel 缺少 ErrorBoundary

- **位置**：`src/App.tsx`
- **問題**：懶加載的 SearchPanel 沒有被 ErrorBoundary 包裹
- **風險**：如果 SearchPanel 出錯，整個應用會崩潰
- **建議**：在 Suspense 外層包裹 ErrorBoundary

### 4. NavigationContext 狀態重複

- **位置**：`src/contexts/NavigationContext.tsx`
- **問題**：同時使用 `useState` 和 `useRef`（如 `currentPathRef`、`pendingHistoryPathRef`）追蹤路徑狀態
- **風險**：ref 和 state 同步問題，難以追蹤狀態更新
- **建議**：整合為單一狀態來源；ref 應該只用於非狀態值（DOM refs、timers 等）

### 5. 其他 contact endpoints 缺乏保護

- **位置**：`functions/api/contact.discord.ts`, `functions/api/contact.email-routing.ts`
- **問題**：與主 contact handler 相同，沒有服務端速率限制 / 請求大小限制，CORS 寫死單一域，且日誌記錄完整 email
- **風險**：攻擊者可改用其他路由繞過新增保護，並暴露敏感資訊
- **建議**：與主 handler 共用同一組中間件（限流、最大 body 長度、允許域名列表、遮蔽 email 日誌），或移除未使用的路由

---

## 🟠 高優先級（High）

### 1. SHA-256 同步計算阻塞主線程

- **位置**：`src/utils/integrity.ts:sha256Internal`
- **問題**：計算密集型操作在主線程同步執行，阻塞頁面交互
- **建議**：改用 `crypto.subtle.digest`（非同步、硬件加速）

```typescript
// 改進前
function sha256Internal(str: string): string {
  // 同步計算...
}

// 改進後
async function sha256Internal(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 2. 圖片缺少 fetchpriority 屬性

- **位置**：`src/components/common/LazyImage.tsx`
- **問題**：`IMAGE_CONFIG.PRIORITY_COUNT = 2` 已定義，但沒有實際應用機制
- **影響**：LCP（Largest Contentful Paint）圖片沒有優先加載
- **建議**：為 hero 圖片添加 `fetchpriority="high"` 屬性

### 3. Sentry 初始化邏輯過於複雜

- **位置**：`src/services/monitoring.ts`
- **問題**：多個狀態變數追蹤初始化（`isInitialized`、`monitoringEnabled`、`monitoringInitPromise`、`idleInitScheduled`）
- **建議**：簡化為單一狀態機模式

### 4. 測試覆蓋率不足

- **問題**：關鍵文件被排除在覆蓋率之外
  - `monitoring.ts`
  - `ErrorBoundary.tsx`
  - `SearchPanel.tsx`
  - `useLocalStorage.ts`
  - `useHistoryNavigation.ts`
- **建議**：增加 context providers 和複雜組件的測試覆蓋率

### 5. Contact handler 未設置超時與最大請求體

- **位置**：`functions/api/contact.ts`（Resend）、`functions/api/contact.*` 其他變體
- **問題**：`request.json()` 讀取未受限，Resend 呼叫也無 timeout
- **風險**：大型/慢速 payload 會佔滿執行緒或耗盡上游並行配額
- **建議**：在入口檢查 `Content-Length` 上限（例如 32–64KB），並為外部 fetch 設定 `AbortSignal`/超時；共用中間件覆蓋所有 contact 路由

---

## 🟡 中等優先級（Medium）

### 1. Email 驗證邏輯重複且不一致

- **位置**：
  - 後端：`functions/api/contact.ts` - 簡單 regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - 前端：`src/components/forms/ContactForm.tsx` - 使用 `validator` 庫
- **問題**：驗證邏輯不一致可能導致用戶困惑
- **建議**：創建共享驗證模組，前後端統一使用

### 2. 約 40 處 `any` 類型

- **問題**：散布在代碼中的 `any` 和 `@ts-ignore` 降低類型安全
- **典型位置**：
  - `functions/api/contact.ts:479` - `as Record<string, unknown>` 後接不安全轉換
  - `vite.config.ts:220` - bundle entries 使用 `unknown` 類型
- **建議**：使用 `satisfies` 運算符（TypeScript 4.9+）並創建更嚴格的類型

### 3. Sidebar.tsx 組件過大

- **位置**：`src/components/layout/Sidebar.tsx`
- **問題**：344 行，超過 300 行建議上限
- **建議**：拆分為子組件（SidebarHeader、SidebarContent、SidebarFooter 等）

### 4. CSS Modules 無類型支持

- **問題**：CSS modules 作為 `any` 導入，重構 CSS 名稱時不會產生 TypeScript 錯誤
- **建議**：啟用 TypeScript CSS Modules 插件或使用 `typed-css-modules`

### 5. AppProviders 嵌套反模式

- **位置**：`src/AppProviders.tsx`
- **問題**：`reduceRight` 模式創建深層嵌套組件樹，調試困難
- **建議**：考慮使用 Compound Component 模式或自定義多 provider 工具

### 6. 敏感數據記錄在日誌中

- **位置**：`functions/api/contact.ts:509, 513`
- **問題**：記錄完整的 email 地址
- **建議**：只記錄哈希引用，不記錄原始 email

### 7. CSP 與連線白名單漂移

- **位置**：`index.html` fallback CSP、`public/_headers`
- **問題**：meta CSP 允許 `api.example.com` 且 preconnect 到 `api.H4KU.com`，與實際流量路徑不符
- **風險**：策略分叉容易遺漏封鎖，增加攻擊面
- **建議**：統一來源（優先 `_headers`），移除未使用的域名並自動生成 meta CSP 以防配置漂移

### 8. 追蹤/錯誤參考 ID 熱點使用 `Math.random`

- **位置**：`functions/api/contact*.ts`、`src/components/common/ErrorBoundary.tsx`
- **問題**：`Math.random` 的碰撞風險高且缺乏可審計熵
- **建議**：改用 `crypto.randomUUID()` 或 `crypto.getRandomValues` 生成參考/追蹤 ID

### 9. Bundle 預算覆蓋不足

- **位置**：`package.json` `size-limit` 配置
- **問題**：僅檢查主 chunk，未覆蓋 vendor chunk/CSS
- **風險**：分包或樣式膨脹無預警地溢出體積預算
- **建議**：為 `react-vendor`、`icons-vendor`、CSS 輸出（gzip/brotli）增加 size-limit 條目，並在 CI 報告

---

## 🟢 低優先級（Low）

### 1. theme-color meta 動態創建

- **位置**：`src/contexts/ThemeContext.tsx:93-119`
- **問題**：通過 DOM 操作動態創建 meta 標籤
- **建議**：直接在 `index.html` 中添加帶有 media queries 的 theme-color metas

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)">
```

### 2. 複雜算法缺少文檔

- **問題**：FNV-1a、SHA-256、domain regex 等邏輯缺少上下文說明
- **建議**：添加 JSDoc 註釋說明算法和 regex 模式

### 3. 缺少 Lighthouse CI

- **問題**：有 bundle 大小監控但沒有整合 Lighthouse CI 到 CI pipeline
- **建議**：添加 Lighthouse CI 或 Web Vitals 監控到構建流程

### 4. 缺少資源預加載

- **問題**：關鍵字體沒有使用 `<link rel="preload">` 預加載
- **建議**：在 `index.html` 中添加 woff2 字體的 preload

### 5. 缺少安全響應頭

- **問題**：未配置 X-Content-Type-Options、X-Frame-Options、X-XSS-Protection
- **建議**：在 `_headers` 或 `wrangler.toml` 中添加配置

### 6. Sharp 依賴可能放錯位置

- **位置**：`package.json`
- **問題**：Sharp 列為 production dependency，但似乎只用於 CMS 預處理
- **建議**：如果只是構建時使用，移至 `devDependencies`

---

## ✅ 做得好的地方

- **現代化技術棧**：React 19、TypeScript 5.6、Vite 7.2
- **完善的 Bundle 分割**：react-vendor、animation-vendor、icons-vendor、monitoring-vendor
- **懶加載策略**：Lightbox、SearchPanel 使用 React.lazy + Suspense
- **良好的無障礙支持**：ARIA labels、鍵盤導航、焦點管理
- **安全意識**：HTML 轉義、域名驗證、honeypot 反垃圾郵件
- **完整性檢查**：雙算法驗證（FNV-1a + SHA-256）
- **測試覆蓋**：41 個測試文件 + Playwright E2E
- **性能監控**：Bundle 大小限制（300KB）、Web Vitals 追蹤

---

## 參考資源

- [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [crypto.subtle.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- [typed-css-modules](https://github.com/Quramy/typed-css-modules)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
