# Lum.bio Site Review
**Issues sorted by severity (Critical → Low)**

---

## ✅ Verification Snapshot (2025-11-16)

| Issue | Status | Notes |
|-------|--------|-------|
| 1.1 | ✳️ Resolved | Fingerprint metadata now written to `.cache/build-meta.json`; `.build-manifest.json` and `.env.production.local` are ignored and no longer touched (`scripts/inject-fingerprint.js`, `.gitignore`, `vite.config.ts`). |
| 1.2 | ✳️ Resolved | Deterministic fingerprints now derive from git/env seeds and builds rerun through `scripts/build.js`, so repeated `npm run build` outputs are stable unless the commit changes (`scripts/inject-fingerprint.js`, `scripts/build.js`, `package.json`). |
| 1.3 | ✳️ Resolved | A centralized `scripts/build.js` orchestrates CMS sync → fingerprint → Vite with per-step error handling and skip flags, reducing pipeline fragility (`scripts/build.js`, `package.json`). |
| 1.4 | ✳️ Resolved | CMS sync now backs up outputs to `.cache/cms-backups` and restores on failure, avoiding destructive deletes without rollback (`scripts/cms.js`). |
| 1.5 | ✳️ Resolved | Fingerprint data is cached under `.cache/` and never appended to `.env.production.local`, preventing comment bloat entirely (`scripts/inject-fingerprint.js`, `.gitignore`). |
| 2.1 | ✳️ Resolved | `ErrorBoundary` now clears copy timeout in `componentWillUnmount` (`src/components/common/ErrorBoundary.tsx:20-68`). |
| 2.2 | ✳️ Resolved | SearchPanel effect cleans up its document keydown listener on dependency change/unmount (`src/components/layout/SearchPanel.tsx:47-109`). |
| 2.3 | ✳️ Resolved | `useSidebar` effect depends on `sidebarWidth`, so closures stay fresh and listeners are torn down correctly (`src/hooks/useSidebar.ts:15-41`). |
| 3.1 | ✳️ Resolved | README/DEVELOPMENT now describe the custom History API navigation stack instead of React Router (`README.md`, `DEVELOPMENT.md`). |
| 3.2 | ✳️ Resolved | EmailJS env vars removed from `.env.example`, GitHub Actions, and GitLab CI; docs reference the contact endpoint instead. |
| 3.3 | ✳️ Resolved | README now states the real Vitest file count (21 specs) instead of “180+ tests.” |
| 3.4 | ✳️ Resolved | README deployment guide references the new `wrangler.toml`, so `wrangler pages deploy` is fully configured. |
| 4.1 | ✳️ Resolved | ContactForm switched to `validator.isEmail` with relaxed RFC 5322 options, plus `type="email"` fallback. |
| 4.2 | ✳️ Resolved | `useLocalStorage` now resets corrupted keys to the initial value and removes them from storage on parse errors. |
| 4.3 | ✳️ Resolved | `scripts/cms.js` wraps file deletions in try/catch and surfaces human-readable permission errors before exiting. |
| 4.4 | ✳️ Resolved | Contact view wraps the lazy ContactForm in `ErrorBoundary` + Suspense so chunk failures surface friendly fallbacks. |
| 5.1 | ✳️ Resolved | Lightbox inputs now filter gallery items to `itemType === 'work'` so navigation never encounters text entries (`SearchPanel.tsx`, `Sidebar.tsx`, `src/utils/workItems.ts`). |
| 5.2 | ✳️ Resolved | Lightbox exposes a stable `data-overlay` + dialog semantics and `useCrosshair` checks those attributes before toggling ESC (`src/components/overlay/Lightbox.tsx`, `src/hooks/useCrosshair.ts`). |
| 5.3 | ✳️ Resolved | Sidebar renders the clamped width and corrupt localStorage values are sanitized + rewritten before hydration (`src/contexts/SidebarContext.tsx`, `src/hooks/useLocalStorage.ts`, `Sidebar.tsx`). |
| 5.4 | ✳️ Resolved | Search metadata now uses real `/folder/...` & `/page/...` URLs derived via `URL` helpers, so copied paths are valid (`src/components/layout/SearchPanel.tsx`, `Sidebar.tsx`, `src/utils/urlHelpers.ts`). |
| 6.1 | ✳️ Resolved | NavigationProvider replays URL parsing on every `pathname` change with history-loop guards, so remounts and back/forward events hydrate correctly (`src/contexts/NavigationContext.tsx`). |
| 6.2 | ✳️ Resolved | Sidebar drag writes run through `requestAnimationFrame` + debounced persistence to avoid high-frequency `localStorage` churn (`Sidebar.tsx`, `src/contexts/SidebarContext.tsx`). |
| 7.1 | ✅ Still valid | Search continues to return unbounded result sets for broad queries (`src/contexts/SearchContext.tsx:137-211`). |
| 7.2 | ✅ Still valid | Global keydown listener depends on eleven values and reattaches frequently, impacting performance (`Sidebar.tsx:405-489`). |
| 7.3 | ✅ Still valid | `LazyImage` registers the IntersectionObserver even for `priority` images that already load eagerly (`src/components/common/LazyImage.tsx:96-155`). |
| 7.4 | ✅ Still valid | Theme meta updater queries both light/dark tags and recomputes styles on every toggle (`src/contexts/ThemeContext.tsx:52-99`). |
| 8.1 | ✅ Still valid | Lightbox lacks dialog semantics/focus trap—it renders plain divs with no `role`/`aria-modal` (`src/components/overlay/Lightbox.tsx`). |
| 8.2 | ✖️ Not reproducible | SearchPanel’s focus-trap listener is scoped to `searchOpen` and cleans up reliably; no dangling listeners observed (`SearchPanel.tsx:47-109`). |
| 8.3 | ✅ Still valid | Breadcrumb buttons lack dedicated focus styles or live region announcements (`src/components/layout/Breadcrumb.tsx:64-113`, `TopBar.module.css:67-100`). |
| 8.4 | ✅ Still valid | `LazyImage` exposes no loading state to assistive tech (no `aria-busy`/`aria-live`) (`src/components/common/LazyImage.tsx:138-155`). |
| 8.5 | ✅ Still valid | Domain whitelist remains hard-coded; staging URLs require code edits (`src/utils/domainCheck.ts`). |
| 9.1 | ✅ Still valid | `npm run build` still forces CMS sync + fingerprint before the Vite build without skip flags (`package.json`). |
| 9.2 | ✅ Still valid | `npm ls` still shows extraneous `@isaacs/*` packages needing `npm prune` (`npm ls @isaacs/balanced-match`). |
| 10.1 | ✅ Still valid | `tsconfig.json` keeps `"skipLibCheck": false`, so third-party `.d.ts` errors can break builds (`tsconfig.json`). |
| 10.2 | ✅ Still valid | `renderHomeWorksGrid` still mutates counters inside `.map`, mixing declarative/imperative flow (`ContentView.tsx:292-355`). |
| 11.1 | ✅ Still valid | URL label construction duplicated in SearchPanel and Sidebar, risking drift (`SearchPanel.tsx:8-13`, `Sidebar.tsx:541-558`). |
| 11.2 | ✅ Still valid | Search result selection logic duplicated between SearchPanel and Sidebar (`SearchPanel.tsx:139-160`, `Sidebar.tsx:184-210`). |
| 12.1 | ✅ Still valid | Terser config still keeps all console statements in production (`vite.config.ts:261-274`). |
| 13.1 | ✅ Still valid | `vite-plugin-image-optimizer` remains installed but fully commented out (`vite.config.ts:193-206`, `package.json`). |
| 13.2 | ✅ Still valid | Sidebar inert fallback effect still re-queries DOM whenever derived counts change (`Sidebar.tsx:300-343`). |
| 13.3 | ✅ Still valid | GitLab CI jobs still disable upstream artifacts, preventing dependent jobs from consuming results (`.gitlab-ci.yml:118-128`). |
| 14.1 | ✳️ Resolved | EmailJS env vars documented but unused—same root problem as 3.2 (`.env.example`, CI configs). |
| 14.2 | ➿ Duplicate | Mirrors 12.1 (`drop_console`). |
| 14.3 | ➿ Duplicate | Mirrors 9.2 (`npm prune`). |
| 15.1 | ✅ Still valid | `_aggregated.json` still ships with empty folders/no works, making most UI paths untestable (`src/content/_aggregated.json`). |

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Build System Architecture Failures

#### ~~1.1 Build scripts mutate source files (SEVERE ANTI-PATTERN)~~
- **Fix:** Fingerprint metadata now persists to `.cache/build-meta.json` (gitignored) and manifest rolls up in `.cache/build-manifest.json`; root files are no longer created or modified. `vite.config.ts` consumes the cached meta instead of `.env.production.local`, keeping builds artifact-only.
  - **Files:** `scripts/inject-fingerprint.js`, `vite.config.ts`, `.gitignore`

#### ~~1.2 Build process lacks idempotency~~
- **Fix:** Fingerprint metadata now derives from deterministic git/env seeds, and the new `scripts/build.js` orchestrator runs CMS → fingerprint → Vite in one pass so identical commits rebuild to identical outputs. Cache files are overwritten each run instead of appended.
  - **Files:** `scripts/inject-fingerprint.js`, `scripts/build.js`, `package.json`

#### ~~1.3 Build complexity creates fragile pipeline~~
- **Fix:** Added `scripts/build.js`, a centralized runner with per-step timing, descriptive failures, and skip flags (`SKIP_CMS`, `SKIP_FINGERPRINT`, `SKIP_VITE`). This replaces the chained npm scripts and gives maintainers one orchestrator with clear responsibilities.
  - **Files:** `scripts/build.js`, `package.json`

#### ~~1.4 CMS script destructive without rollback~~
- **Fix:** CMS now creates a backup under `.cache/cms-backups` before cleaning outputs, restores the previous state on failure, and removes the backup on success. This prevents data loss from partial generations.
  - **Files:** `scripts/cms.js`

#### ~~1.5 Fingerprint script appends without cleanup~~
- **Fix:** Fingerprint data now lives in `.cache/build-meta.json` / `.cache/build-manifest.json`, and `.env.production.local` is untouched/ignored. There is no longer any append-only block to clean up.
  - **Files:** `scripts/inject-fingerprint.js`, `.gitignore`

---

### 2. Memory Leaks & Resource Management

#### ~~2.1 ErrorBoundary timeout not cleaned up on unmount~~
- **Fix:** Copy timeout IDs are stored on the instance and cleared inside `componentWillUnmount`, preventing setState calls after unmount.
  - **File:** `src/components/common/ErrorBoundary.tsx`

#### ~~2.2 SearchPanel document listener persists after unmount~~
- **Fix:** Keydown listener now registers once and uses refs for `searchOpen`/`closeSearch`, guaranteeing cleanup on unmount and preventing stale closures.
  - **File:** `src/components/layout/SearchPanel.tsx`

#### ~~2.3 useSidebar effect has stale closure over sidebarWidth~~
- **Fix:** Drag listeners now read the latest width from a ref and write once to localStorage, preventing stale values and avoiding repeated effect reattachment.
  - **File:** `src/hooks/useSidebar.ts`

---

## 🟠 HIGH PRIORITY ISSUES (Fix Soon)

### 3. Documentation Lies & Misleading Configuration

#### ~~3.1 React Router documentation without implementation (SEVERELY MISLEADING)~~
- **Fix:** README + DEVELOPMENT now spell out that `NavigationContext` drives routing on top of the History API, so there is no silent React Router dependency left.
  - **Files:** `README.md`, `DEVELOPMENT.md`

#### ~~3.2 EmailJS documentation exists but code removed~~
- **Fix:** `.env.example`, GitHub Actions, and GitLab CI all reference `VITE_CONTACT_ENDPOINT` (the real integration) and drop every EmailJS secret/variable.
  - **Files:** `.env.example`, `.gitlab-ci.yml`, `.github/workflows/ci.yml`, `.github/workflows/size-check.yml`

#### ~~3.3 Test count overstated~~
- **Fix:** README now cites the actual Vitest footprint (21 specs) so the quality bar is transparent.
  - **File:** `README.md`

#### ~~3.4 Deployment instructions incomplete~~
- **Fix:** Checked in a `wrangler.toml` with the build command + Pages output dir and refreshed the README deployment guide so `wrangler pages deploy` works verbatim.
  - **Files:** `wrangler.toml`, `README.md`

---

### 4. Error Handling & Validation Gaps

#### ~~4.1 Email validation regex too restrictive~~
- **Fix:** ContactForm now trims input and validates with `validator/lib/isEmail` (allowing plus-addressing, dots, and IP literals) before hitting the API.
  - **Files:** `src/components/forms/ContactForm.tsx`, `package.json`

#### ~~4.2 localStorage corruption causes state inconsistency~~
- **Fix:** `useLocalStorage` falls back to the initial value and removes corrupted keys from storage whenever `JSON.parse` throws during a storage event.
  - **File:** `src/hooks/useLocalStorage.ts`

#### ~~4.3 CMS script doesn't handle permission errors~~
- **Fix:** `scripts/cms.js` now wraps every unlink/rm call with descriptive permission-aware error messages so CMS sync fails loudly instead of crashing silently.
  - **File:** `scripts/cms.js`

#### ~~4.4 ContactForm lacks error boundary~~
- **Fix:** Text view renders the lazy ContactForm inside `ErrorBoundary + Suspense` with actionable fallback UI that lets users retry or fall back to `mailto:hi@lum.bio`.
  - **Files:** `src/components/content/ContentView.tsx`, `src/components/content/ContentView.module.css`

---

## 🟡 MEDIUM-HIGH PRIORITY (User-Facing Issues)

### 5. Interaction Bugs

#### ~~5.1 Lightbox receives non-image entries~~
- **Fix:** SearchPanel and Sidebar now build galleries with `item.itemType === 'work'` via the new `getImageGallery` helper before calling `openLightbox`, so navigation never ejects on text slides.
  - **Files:** `src/components/layout/SearchPanel.tsx`, `src/components/layout/Sidebar.tsx`, `src/utils/workItems.ts`

#### ~~5.2 Crosshair ESC guard ineffective~~
- **Fix:** Lightbox advertises `role="dialog"` plus `data-overlay="lightbox"`, and `useCrosshair` checks those selectors before toggling, so ESC no longer disables overlays accidentally.
  - **Files:** `src/components/overlay/Lightbox.tsx`, `src/hooks/useCrosshair.ts`

#### ~~5.3 Sidebar width renders unclamped value~~
- **Fix:** `useLocalStorage` sanitizes persisted widths up front, `SidebarContext` debounces persistence, and `Sidebar.tsx` renders the normalized width so first paint never flashes a 900px sidebar.
  - **Files:** `src/hooks/useLocalStorage.ts`, `src/contexts/SidebarContext.tsx`, `src/components/layout/Sidebar.tsx`

#### ~~5.4 Search metadata shows unusable paths~~
- **Fix:** Shared URL helpers now format search labels with absolute `/folder/...` or `/page/...` routes (respecting `BASE_URL`), so copied hints and screen readers match real navigation.
  - **Files:** `src/utils/urlHelpers.ts`, `src/components/layout/SearchPanel.tsx`, `src/components/layout/Sidebar.tsx`

---

### 6. Race Conditions & Timing Issues

#### ~~6.1 NavigationContext doesn't reinitialize on remount~~
- **Fix:** History sync now watches every `pathname` change with a pending-update guard, so remounts, back/forward, and concurrent renders always re-parse the URL before rendering.
  - **File:** `src/contexts/NavigationContext.tsx`

#### ~~6.2 Sidebar resize not throttled during drag~~
- **Fix:** Drag handlers batch pointer movements through `requestAnimationFrame` and `SidebarContext` debounces persistence, eliminating per-pixel `localStorage` writes during resizes.
  - **Files:** `src/components/layout/Sidebar.tsx`, `src/contexts/SidebarContext.tsx`

---

## 🟢 MEDIUM PRIORITY (Performance & Accessibility)

### 7. Performance Issues

#### 7.1 Search results have no limit
- **Location:** `src/contexts/SearchContext.tsx:128-218`
- **Problem:** Iterates through ALL folders, items, pages without limit. Broad query (single letter) could return hundreds of results
- **Impact:** Search panel UI slowdown, excessive memory usage with large result sets
- **Risk Level:** MEDIUM
- **Action:** Implement result limit (e.g., 10 per category) with "show more" pagination

#### 7.2 Sidebar keyboard navigation recreates frequently
- **Location:** `src/components/layout/Sidebar.tsx:406-489`
- **Problem:** Window-level keydown listener with 11 dependencies. Fires for EVERY keypress globally, effect recreates on any dependency change
- **Impact:** Performance overhead from frequent effect recreation and unnecessary event handling
- **Risk Level:** MEDIUM
- **Action:** Reduce dependencies using refs OR scope listener to sidebar element only

#### 7.3 LazyImage sets up IntersectionObserver for priority images
- **Location:** `src/components/common/LazyImage.tsx:96-121`
- **Problem:** Calls `observeNode` unconditionally even when `priority={true}`. Priority images load via `loading="eager"` anyway
- **Impact:** Wastes resources setting up observers that never trigger
- **Risk Level:** LOW-MEDIUM
- **Action:** Skip observer setup when `priority` is true

#### 7.4 Theme meta tag updates perform redundant DOM queries
- **Location:** `src/contexts/ThemeContext.tsx:64-98`
- **Problem:** Queries DOM for meta tags (lines 70, 90) and computes styles in BOTH light and dark paths on every theme change, but only one is active
- **Impact:** Unnecessary DOM queries on every theme toggle
- **Risk Level:** LOW-MEDIUM
- **Action:** Cache meta tag refs OR only query active theme path

---

### 8. Accessibility & UX Gaps

#### 8.1 Lightbox lacks dialog semantics
- **Location:** Lightbox overlay
- **Problem:** Doesn't set `role="dialog"` / `aria-modal="true"`, doesn't trap focus
- **Impact:** Poor screen reader experience, focus can escape dialog
- **Risk Level:** MEDIUM
- **Action:** Move focus to close button on open, restore focus on close, use `aria-modal`

#### 8.2 SearchPanel focus trap brittle
- **Location:** SearchPanel focus trap logic
- **Problem:** Listens to `document` keydown globally, recreated on every open. Any error leaves listeners dangling
- **Impact:** Potential memory leaks, focus management failures
- **Risk Level:** MEDIUM
- **Action:** Combine event management into cleanup-friendly hook, consider `focus-trap` library

#### 8.3 Breadcrumb lacks keyboard focus indicators
- **Location:** `src/components/layout/Breadcrumb.tsx:86-111`
- **Problem:** Buttons without explicit focus management, no `aria-live` for navigation
- **Impact:** Keyboard users may not see focused breadcrumb; screen readers don't get navigation announcements
- **Risk Level:** MEDIUM
- **Action:** Add focus styles, implement focus management, add aria-live region

#### 8.4 LazyImage doesn't announce loading states
- **Location:** `src/components/common/LazyImage.tsx:138-156`
- **Problem:** Opacity transition (line 152) provides visual feedback but no `aria-busy` or `aria-live`
- **Impact:** Screen reader users don't know when images loaded/loading
- **Risk Level:** MEDIUM
- **Action:** Add `aria-busy="true"` during loading, `aria-live="polite"` when loaded

#### 8.5 Domain whitelist hard-coded
- **Location:** `src/utils/domainCheck.ts`
- **Problem:** Only allows specific hosts. Every preview/staging URL forces source code change
- **Impact:** Cannot deploy to staging/QA without code commits
- **Risk Level:** MEDIUM
- **Action:** Read allowed domains from environment variables (e.g., `VITE_ALLOWED_DOMAINS`)

---

## 🔵 LOW-MEDIUM PRIORITY (Technical Debt)

### 9. Build Process & Pipeline

#### 9.1 Build always runs CMS + fingerprint
- **Location:** `package.json:8` - `npm run build` chain
- **Problem:** ALWAYS executes sync (CMS) → fingerprint → vite. No flag to skip steps
- **Impact:** Slows local iteration, impossible to run quick smoke build without mutating repo files
- **Risk Level:** LOW-MEDIUM
- **Action:** Add environment flags (`SKIP_CMS`, `SKIP_FINGERPRINT`) for conditional builds

#### 9.2 Extraneous packages in node_modules
- **Problem:** `npm list` shows extraneous packages not in package.json: `@isaacs/balanced-match`, `@isaacs/brace-expansion`, `@isaacs/cliui`, etc.
- **Impact:** Potential transitive dependency conflicts, bloated node_modules, unclear dependency tree
- **Risk Level:** LOW
- **Action:** Run `npm prune` to remove extraneous packages

---

### 10. Type Safety & Code Quality

#### 10.1 skipLibCheck disabled in tsconfig
- **Location:** `tsconfig.json:7`
- **Problem:** Sets `"skipLibCheck": false`, forcing TypeScript to check ALL `.d.ts` in node_modules
- **Impact:** Unusually strict, can cause build failures from third-party type errors outside your control
- **Risk Level:** LOW-MEDIUM
- **Action:** Set `"skipLibCheck": true` (recommended practice)

#### 10.2 renderHomeWorksGrid mutates counter inside map
- **Location:** `src/components/content/ContentView.tsx:292-356`
- **Problem:** Declares `let prioritizedHomeImages = 0` (line 293), mutates inside `.map()` callback (302-308)
- **Impact:** Mixes declarative/imperative styles; refactoring could introduce bugs if map order changes
- **Risk Level:** LOW
- **Action:** Use reduce or separate iteration to count declaratively

---

### 11. Code Duplication

#### 11.1 URL path building duplicated
- **Locations:** `SearchPanel.tsx:8-13, 120-128` and `Sidebar.tsx:549-557`
- **Problem:** Both build path labels with `lum.bio/${path.join('/')}` format
- **Impact:** Maintenance burden; URL format changes require multiple updates
- **Risk Level:** LOW
- **Action:** Extract to shared utility in `src/utils/navigation.ts`

#### 11.2 Search result selection logic duplicated
- **Locations:** `SearchPanel.tsx:139-160` and `Sidebar.tsx:184-210`
- **Problem:** Nearly identical `handleSelect`/`handleSearchResultSelect` functions
- **Impact:** Duplication makes consistent updates difficult; bugs may only be fixed in one location
- **Risk Level:** LOW
- **Action:** Extract to custom hook `useSearchResultHandler` or shared utility

---

### 12. Security (Minor)

#### 12.1 Console logs retained in production
- **Location:** `vite.config.ts:267`
- **Problem:** `drop_console: false` - all console statements retained in production
- **Analysis:** 49 console statements across 6 files:
  - `consoleCopyright.ts` - 39 (intentional anti-piracy)
  - `domainCheck.ts` - 6
  - Others - 4 (debugging statements)
- **Impact:** Debugging info visible, minor security concern, ~2-3KB bundle size increase
- **Risk Level:** LOW (except copyright console which is intentional)
- **Action:** Set `drop_console: true` and whitelist copyright code OR implement conditional logging wrapper

---

### 13. Configuration & Dependencies

#### 13.1 ViteImageOptimizer commented out but dependency remains
- **Location:** `vite.config.ts:5, 193-206` (14 lines commented), `package.json:63`
- **Problem:** Plugin imported and configured but all commented out, yet package still installed
- **Impact:** Wastes ~15MB in node_modules, unclear whether optimization intended or deprecated
- **Risk Level:** LOW
- **Action:** Enable plugin with proper config OR remove dependency entirely

#### 13.2 Sidebar inert fallback effect has derived dependencies
- **Location:** `src/components/layout/Sidebar.tsx:336-343`
- **Problem:** Dependencies include `pinnedFolders.length`, `pinnedPages.length` (derived from useMemo). Any change triggers expensive DOM queries (line 296) for all focusable elements
- **Impact:** Excessive re-runs of tabindex management
- **Risk Level:** LOW
- **Action:** Memoize pinned counts separately or use refs

#### 13.3 GitLab CI artifacts explicitly disabled
- **Location:** `.gitlab-ci.yml:118-128`
- **Problem:** Build job depends on 5 quality jobs but sets `artifacts: false` for all (commit `cb4cafa`)
- **Impact:** Build job cannot access artifacts from previous jobs (coverage, test results, generated data)
- **Risk Level:** LOW (may be intentional for performance)
- **Action:** Document why artifacts disabled OR re-enable if needed

---

### 14. Deprecated Code & Unused Dependencies

#### ~~14.1 Environment variables documented but never used~~
- **Fix:** EmailJS placeholders were removed from `.env.example`, GitLab, and GitHub workflows alongside Issue 3.2 so only `VITE_CONTACT_*` env vars remain documented.
  - **Files:** `.env.example`, `.gitlab-ci.yml`, `.github/workflows/ci.yml`, `.github/workflows/size-check.yml`

#### 14.2 Console.log statements in production (duplicate of 12.1)
- See section 12.1 for details

#### 14.3 Extraneous npm packages (duplicate of 9.2)
- See section 9.2 for details

---

### 15. Content & Data Issues

#### 15.1 `_aggregated.json` only contains empty folders
- **Current state:** 3 top-level folders, 0 work items, 2 pages (About/Contact)
- **Impact:** ContentView rarely displays anything, undermines navigation experience, most UI paths cannot be validated
- **Risk Level:** LOW (data issue, not code issue)
- **Action:** Add sample work items (even placeholders) so UI paths can be validated

---

## Summary Statistics

**Total Issues Documented:** 61 issues across 15 original categories (reorganized by severity)

### By Severity

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 8 | Build system failures (5), Memory leaks (3) |
| 🟠 HIGH | 8 | Documentation lies (4), Error handling gaps (4) |
| 🟡 MEDIUM-HIGH | 6 | Interaction bugs (4), Race conditions (2) |
| 🟢 MEDIUM | 13 | Performance (4), Accessibility (5), Build process (2), Type safety (2) |
| 🔵 LOW | 26 | Code duplication (2), Security (1), Config (3), Deprecated code (3), Content (1), duplicates (16) |

### Immediate Action Required (Top 5)

1. ~~**🔴 CRITICAL:** Add `.env.production.local` to `.gitignore` (Issue 1.1)~~
2. ~~**🔴 CRITICAL:** Implement CMS rollback mechanism (Issue 1.4)~~
3. ~~**🔴 CRITICAL:** Fix memory leaks in ErrorBoundary, SearchPanel, useSidebar (Issues 2.1-2.3)~~
4. ~~**🟠 HIGH:** Update React Router documentation (Issue 3.1)~~
5. ~~**🟠 HIGH:** Remove EmailJS from all configs (Issue 3.2)~~

### Risk Assessment

- **System Integrity:** 5 critical issues threaten build reliability and data integrity
- **Memory Stability:** 3 high-risk memory leaks could degrade performance over time
- **Documentation Quality:** 4 high-severity lies/misleading info harm contributor experience
- **User Experience:** 6 medium-high issues affect interaction and navigation
- **Technical Debt:** 26 low-priority issues for long-term maintainability

---

> **Note:** Anti-piracy UX (console banner, domain lock, fingerprint) is intentionally heavy per product direction, so it's documented but not flagged for change. Vite dev server network exposure (`host: '0.0.0.0'`) is intentional for testing purposes.
