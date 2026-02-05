# TODO - H4KU.COM 工程化提升计划

> 基于全面代码审查，按优先级排序的完整任务清单。
> 原则：**加固式重构**，不大重写。

---

## P0 - 立即修复（本周）

### ~~1. [P0][Bug] CORS Origin 大小写不一致~~

**位置**: `functions/api/_middleware.ts:44-45`

```typescript
// 当前（错误）
'https://H4KU.COM',
'https://www.H4KU.COM',

// 应改为
'https://h4ku.com',
'https://www.h4ku.com',
```

**问题**: 浏览器发送的 Origin header 是小写，严格相等比较会失败

**验收**: 生产环境 CORS 请求正常通过

---

### ~~2. [P0][Bug] 域名白名单有重复条目~~

**位置**: `src/utils/domainCheck.ts:21-24`

```typescript
// 当前（有重复）
'H4KU.COM',
'www.H4KU.COM',
'H4KU.COM',      // 重复
'www.H4KU.COM',  // 重复
```

**验收**: 移除重复，统一小写

---

### ~~3. [P0][CI] 移除重复的 Playwright workflow~~

**位置**: `.github/workflows/playwright.yml`

**问题**: `ci.yml:136-172` 已包含 E2E 测试，`playwright.yml` 重复执行

**验收**: 删除 `playwright.yml`，PR 只跑一次 E2E

---

### ~~4. [P0][CI] 依赖更新工具择一~~

**位置**: `renovate.json` + `.github/dependabot.yml`

**问题**: 两者同时运行会产生冲突 PR

**建议**: 保留 Renovate（配置更完善），删除 `dependabot.yml`

**验收**: 只有一个依赖更新来源

---

### ~~5. [P0][CSP] connect-src 域名大小写不一致~~

**位置**: `public/_headers:8` 和 `index.html:81`

```
connect-src 'self' https://api.H4KU.COM ...
```

**问题**: 应统一为小写 `https://api.h4ku.com`

**验收**: CSP 不阻挡 API 请求

---

## P1 - 高优先级（2 周内）

### ~~6. [P1][Test] 为 contact.ts 补充单元测试~~

**位置**: `src/services/contact.ts`（vitest.config.ts:40 排除）

**测试覆盖**:

- `savePendingContact` - sessionStorage 不可用时
- `loadPendingContact` - 过期/格式错误/空值
- `submitContactRequest` - endpoint 未配置、非 JSON 响应、HTTP 错误、timeout
- `mergeAbortSignals` - 多信号合并逻辑

**验收**: 移除 exclude，coverage 通过

---

### ~~7. [P1][Test] 为 Functions middleware 补充测试~~

**位置**: `functions/api/_middleware.ts`

**测试覆盖**:

- `isOriginAllowed` - 大小写、正则、边界值
- `getCorsHeaders` - 允许/不允许 origin
- `verifyTurnstile` - 成功/失败/超时/无 token
- `validateContactPayload` - 边界值

**验收**: 新建测试文件，CI 通过

---

### ~~8. [P1][Perf] 移除内联 CSS 变量的 unsafe-inline 依赖~~

**位置**: `public/_headers:8`

```
style-src 'self' 'unsafe-inline';
```

**问题**: 削弱 CSP 安全性

**方案**:

1. 修改构建脚本，在内联 CSS 后计算其 sha256 hash
2. 动态注入 hash 到 `_headers` 和 `index.html`
3. 移除 `unsafe-inline`

**验收**: CSP 不包含 `unsafe-inline`，页面正常渲染

---

### ~~9. [P1][DX] 常量集中管理~~

**位置**: 分散在多个文件

**需要集中的常量**:

- 域名: `H4KU.COM`, `api.H4KU.COM` (36 处引用)
- 路由段: `'page'`, `'folder'`, `'contact'`, `'verify'`
- Storage keys: `'contact:pending-submission'`, `'theme'`, `'sidebar'`
- Page IDs: `'contact-verify'`

**验收**: 创建 `src/config/domains.ts`，grep 验证无散落字符串

---

### ~~10. [P1][Type] 消除类型不安全代码~~

**统计**: 20 处 `as unknown` 或 `: any`

**高风险位置**:

- `src/hooks/useLocalStorage.ts:25` - 未验证的 `as T`
- `src/services/statePersistence.ts` - 类型断言

**验收**: 使用类型守卫替代强制转换

---

## P2 - 中优先级（1 月内）

### ~~11. [P2][A11y] 完善可访问性标记~~

**缺失项**:

- `FolderTreeItem.tsx` - 图像缺少 alt 验证
- 部分按钮缺少 `aria-label`
- `SidebarSections.tsx` - 图像 alt 属性

**验收**: axe-core 扫描无严重问题

---

### ~~12. [P2][SEO] 动态 meta 标签~~

**位置**: `index.html`

**问题**: 所有 meta 静态，每个作品应有独立的 title/description/og:image

**方案**: 在路由变化时动态更新 `<title>` 和 `<meta>`

**验收**: 分享链接显示正确的预览

---

### ~~13. [P2][Test] 提升测试覆盖率~~

**当前状态**: 44 测试文件，覆盖率约 54%

**目标**: 80%+ 行覆盖率

**优先覆盖**:

- `src/components/content/` - 核心内容视图
- `src/components/layout/` - 导航布局
- `src/contexts/` - 上下文提供者

---

### ~~14. [P2][CI] 合并 size-check 和 codeql workflow~~

**位置**: `.github/workflows/size-check.yml`, `.github/workflows/codeql.yml`

**问题**: 可以作为 CI 的子 job

**验收**: 只保留 `ci.yml`

---

### ~~15. [P2][Perf] 减少不必要的重渲染~~

**位置**: `App.tsx`

**问题**: `domainCheckResult` 和 `allowedDomains` 状态在初始化后不会变化

**方案**: 使用 `useRef` 或提升到模块级

---

### ~~21. [P2][DX] 统一 reportError API~~

**位置**: `src/components/common/ErrorBoundary.tsx` vs `src/utils/reportError.ts`

**问题**: 存在两个不同签名的 `reportError`：
- `ErrorBoundary` 使用 `@/services/monitoring` 的旧版本（3 参数）
- 其他文件使用 `@/utils/reportError` 的新版本（2 参数）

```typescript
// 旧 API（ErrorBoundary）
reportError(error, errorInfo, { componentStack, tags, extra });

// 新 API（其他文件）
reportError(error, { scope, level, logMode, extra });
```

**方案**: 更新 `ErrorBoundary` 使用新版 `reportError`，统一调用方式

**验收**: 全局只有一个 `reportError` 导入来源

---

### ~~22. [P2][Arch] 审视 App.tsx 状态管理技巧~~

**位置**: `src/App.tsx`

**问题**: 使用 `useRef` + `forceSecurityRerender` 代替正统 `useState`

```typescript
const domainCheckRef = useRef<DomainCheckResult>({...});
const [, forceSecurityRerender] = useState(0);
// ...
forceSecurityRerender(version => version + 1);
```

**风险**:
- 竞态条件：ref 更新与 rerender 之间有其他副作用
- 开发可读性降低
- 违反 React 惯用模式

**方案**: 评估是否真的需要此优化，考虑回退到 `useState`

**验收**: 代码审查确认设计合理性

---

## P3 - 低优先级（可选）

### ~~16. [P3][DX] Node.js 版本锁定~~

**位置**: `ci.yml`

**问题**: 硬编码 `node-version: 20`，应使用 `.nvmrc`

**验收**: 创建 `.nvmrc`，CI 读取

---

### ~~17. [P3][CSS] 减少 !important 使用~~

**统计**: 6 处 `!important`

**位置**: `global.css`, `Sidebar.module.css`

**验收**: 重构 CSS 特异性

---

### ~~18. [P3][Security] robots.txt 增强~~

**位置**: `public/robots.txt`

**建议增加**:

```
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

Crawl-delay: 1
```

---

### ~~19. [P3][Observability] 统一错误处理策略~~

**问题**: 错误处理不一致（有的 console.warn，有的 reportError，有的静默）

**验收**: 创建统一的 `reportError` 工具函数

---

### ~~20. [P3][TS] 启用更严格的 TypeScript 配置~~

**位置**: `tsconfig.json`

**建议启用**:

```json
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

**验收**: 逐步启用，修复类型错误

---

### ~~23. [P3][Type] mockData 结构语义变更~~

**位置**: `src/data/mockData.ts`

**问题**: 属性处理从直接赋值改为条件展开

```typescript
// 旧方式（属性存在但值为 undefined）
{ date: work.date, title: work.title }

// 新方式（属性可能不存在）
{ ...(work.date ? { date: work.date } : {}) }
```

**风险**: 依赖 `'date' in item` 或 `item.hasOwnProperty('date')` 的代码行为会改变

**方案**: 搜索所有属性存在性检查，确认无影响

**验收**: `grep -r "hasOwnProperty\|'.*' in " src/` 无相关问题

---

## 决策清单

| 决策项           | 选项                   | 建议                       |
| ---------------- | ---------------------- | -------------------------- |
| 依赖更新工具     | Renovate / Dependabot  | Renovate（配置更完善）     |
| CSP unsafe-inline | 保留 / 移除            | 移除（需重构内联样式）     |
| 动态 meta        | 实现 / 跳过            | 实现（对 SEO 有帮助）      |
| E2E 执行策略     | 每 PR / 变更时         | 每 PR（当前代码库小）      |

---

## 回归验收清单

每次改动后执行：

```bash
npm run lint
npm run format:check
npm run type-check
npm run test:coverage
npm run integrity:check
npm run test:e2e
```

**手动 smoke**:

- [ ] 首页加载
- [ ] 文件夹导航
- [ ] 页面查看
- [ ] 搜索 overlay
- [ ] Contact 两步流程
- [ ] 未授权域名行为

---

## 工作量估算

| 优先级 | 任务数 | 已完成 | 待处理 |
| ------ | ------ | ------ | ------ |
| P0     | 5      | 5      | 0      |
| P1     | 5      | 5      | 0      |
| P2     | 7      | 7      | 0      |
| P3     | 6      | 6      | 0      |

**全部完成**
