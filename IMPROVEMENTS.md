# H4KU.com 代碼改進清單

> 最後更新：2026-01-11

## 概述

本文檔記錄了代碼庫分析後發現的改進項目，按優先級分類整理。

---

## 已完成 (Completed)

以下項目已在 `refactor/security-and-performance-improvements` 分支中完成：

### 安全改進

- [x] **機器人防護** - 使用 Cloudflare Turnstile（免費 CAPTCHA 替代方案）取代無效的 in-memory rate limiting
- [x] **CORS 白名單** - 支援 `h4ku.com` 及 `*.h4ku-com.pages.dev` preview 環境
- [x] **所有 contact endpoints 統一保護** - 共用 middleware 處理 Turnstile 驗證、body size 限制、CORS
- [x] **敏感數據遮蔽** - 日誌中 email 使用 masking（如 `us***@ex***.com`）
- [x] **安全參考 ID** - 使用 `crypto.getRandomValues` 取代 `Math.random`
- [x] **CSP 清理** - 移除未使用的 `api.example.com` 域名

### 性能改進

- [x] **SHA-256 非同步計算** - 使用 Web Crypto API（`crypto.subtle.digest`）取代同步計算
- [x] **Sharp 移至 devDependencies** - 只在 build 時使用
- [x] **Bundle 預算擴展** - size-limit 現覆蓋 vendor chunks 和 CSS

### 代碼品質

- [x] **Email 驗證統一** - 前後端共用 `src/shared/emailValidation.ts`
- [x] **Sidebar 組件拆分** - 拆分為 Sidebar.tsx（邏輯）+ SidebarView.tsx（UI）
- [x] **NavigationContext 狀態簡化** - 使用單一狀態物件模式
- [x] **Sentry 監控重構** - 簡化為狀態機模式
- [x] **AppProviders 簡化** - 移除 `reduceRight`，改為明確嵌套
- [x] **測試覆蓋擴展** - 新增 monitoring.test.ts 等

---

## 🟡 中等優先級（Medium）

### 1. 約 40 處 `any` 類型

- **問題**：散布在代碼中的 `any` 和 `@ts-ignore` 降低類型安全
- **典型位置**：
  - `vite.config.ts:220` - bundle entries 使用 `unknown` 類型
- **建議**：使用 `satisfies` 運算符（TypeScript 4.9+）並創建更嚴格的類型

### 2. CSS Modules 無類型支持

- **問題**：CSS modules 作為 `any` 導入，重構 CSS 名稱時不會產生 TypeScript 錯誤
- **建議**：啟用 TypeScript CSS Modules 插件或使用 `typed-css-modules`

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

### 5. 圖片缺少 fetchpriority 屬性

- **位置**：`src/components/common/LazyImage.tsx`
- **問題**：`IMAGE_CONFIG.PRIORITY_COUNT = 2` 已定義，但沒有實際應用機制
- **影響**：LCP（Largest Contentful Paint）圖片沒有優先加載
- **建議**：為 hero 圖片添加 `fetchpriority="high"` 屬性

---

## ✅ 做得好的地方

- **現代化技術棧**：React 19、TypeScript 5.6、Vite 7.2
- **完善的 Bundle 分割**：react-vendor、animation-vendor、icons-vendor、monitoring-vendor
- **懶加載策略**：Lightbox、SearchPanel 使用 React.lazy + Suspense
- **良好的無障礙支持**：ARIA labels、鍵盤導航、焦點管理
- **安全意識**：Turnstile 人機驗證、HTML 轉義、域名驗證、honeypot 反垃圾郵件
- **完整性檢查**：雙算法驗證（FNV-1a + SHA-256）
- **測試覆蓋**：43 個測試文件 / 540+ 測試 + Playwright E2E
- **性能監控**：Bundle 大小限制（300KB）、Web Vitals 追蹤

---

## 參考資源

- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [crypto.subtle.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- [typed-css-modules](https://github.com/Quramy/typed-css-modules)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
