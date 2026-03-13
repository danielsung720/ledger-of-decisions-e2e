# Ledger of Decisions - QA E2E 測試手冊

最後更新：2026-02-17
適用專案：`ledger-of-decisions-e2e`

## 1. 目的
本手冊提供 QA 進行 E2E 測試的統一操作方式，包含：
- 功能對應測試檔案
- 每條測試案例用途
- 各功能區塊的執行指令
- 最新全量測試狀況與 QA 修正/優化清單

---

## 2. Deterministic 執行模板（QA-E2E-03）

```bash
# Smoke（PR 預設）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh smoke

# Smoke 並行驗證（QA-E2E-07，建議 workers=2 起步）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh smoke-parallel

# Full chromium 回歸
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh chromium

# Full chromium 並行回歸（QA-E2E-07）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh chromium-parallel
```

模板內固定流程：
- `down -v`
- `up -d --build postgres backend frontend`
- `migrate:fresh --seed`
- `run playwright`
- `down -v`

---

## 3. 全量測試指令

### 3.1 前端 Unit/Component（web）
```bash
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-web
npm run test
```

### 3.2 E2E 全量（chromium）
```bash
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh chromium
```

註：目前有 spec 依賴 `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`，未帶環境變數會直接失敗。

---

## 3.3 PR Smoke 測試（QA-E2E-02）

用途：PR 預設快速回歸關鍵流程（auth、dashboard、expense、recurring、cashflow、review、navigation、responsive）。

### Smoke 指令（本機 / CI 同步）
```bash
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh smoke
```

### Smoke 清單（21 cases）
- `displays login form`
- `shows error for invalid credentials`
- `navigates to register page when clicking register link`
- `redirects Home page to login when not authenticated`
- `allows access to login page without authentication`
- `redirects authenticated user away from login page`
- `displays hero section with correct content`
- `opens expense form modal when clicking add button`
- `creates a new expense from dashboard`
- `validates required fields`
- `edits an existing expense`
- `deletes an expense with confirmation`
- `submits recurring create request with normalized optional fields`
- `requests active filter with is_active query parameter`
- `creates income and renders it in income table`
- `requests projection with selected month range when switching month selector`
- `creates cashflow item and renders it in expense table`
- `displays page title`
- `requests summary API with selected preset`
- `navigates to expense list`
- `dashboard displays correctly on mobile`

註：執行時會先跑 `tests/setup/auth.setup.ts` 產生登入態，因此 Playwright 顯示總數通常為 `22`（`21 smoke + 1 setup`）。

## 3.4 storageState 策略（QA-E2E-04）
- setup project：`tests/setup/auth.setup.ts`
- 狀態檔：`playwright/.auth/user.json`
- 非 auth 業務 spec 預設使用已登入狀態（由 `playwright.config.ts` 的 project `dependencies + storageState` 提供）。
- `tests/auth/*.spec.ts` 使用 `test.use({ storageState: { cookies: [], origins: [] } })` 明確覆蓋，確保會員流程仍在未登入初始狀態驗證。

## 3.5 Selector 策略（QA-E2E-05）
- Smoke 核心互動元件優先使用 `data-testid`（例如 dashboard/review/recurring/cashflow）。
- Page Object 與 spec 應優先使用 `getByTestId`，避免依賴易變動文案 selector。
- 僅在語意定位更穩定時使用 role/text selector（例如 auth 標題或無 testid 的靜態文案）。

## 3.6 帳號隔離與並行策略（QA-E2E-07）
- 預設改為「spec group 隔離帳號」：
  - `E2E_TEST_EMAIL=e2e_core@example.com`（storageState 共用只讀/低衝突流程）
  - `E2E_AUTH_EMAIL=auth_e2e@example.com`
  - `E2E_EXPENSE_CRUD_EMAIL=expense_crud@example.com`
  - `E2E_BATCH_DELETE_EMAIL=batch_delete@example.com`
  - `E2E_RECURRING_EMAIL=recurring_e2e@example.com`
  - `E2E_CASHFLOW_INCOME_EMAIL=cashflow_income@example.com`
  - `E2E_CASHFLOW_ITEM_EMAIL=cashflow_item@example.com`
- 並行化採漸進式：
  1. `smoke`（workers=1）維持 PR gate 穩定
  2. `smoke-parallel`（workers=2）做日常 sanity
  3. `chromium-parallel`（workers=2 起）只在需要加速或壓測時使用
- workers 由環境變數控制：
  - `E2E_WORKERS`（預設 `smoke/chromium=1`, `*-parallel=2`）
  - `E2E_SMOKE_WORKERS`（覆蓋 smoke worker 數）

## 3.7 CI 快取與分段策略（QA-E2E-08）
- workflow 分段：
  - PR：`.github/workflows/e2e-smoke-pr.yml`
  - Nightly domain regression：`.github/workflows/e2e-domain-nightly.yml`
  - Weekly full regression：`.github/workflows/e2e-full-weekly.yml`
- 每個 workflow 都先用 `docker/build-push-action@v6` 建 backend/frontend image，並啟用 GHA cache：
  - backend scope：`e2e-backend`
  - frontend scope：`e2e-frontend`
- deterministic 腳本支援 `E2E_SKIP_BUILD=1`，CI 在 image 預建後可略過 compose build，減少冷啟動時間。

### CI Workflow
- PR smoke workflow：`.github/workflows/e2e-smoke-pr.yml`
- Nightly domain workflow：`.github/workflows/e2e-domain-nightly.yml`
- Weekly full workflow：`.github/workflows/e2e-full-weekly.yml`
- deterministic 模板：`ledger-of-decisions-e2e/scripts/run-deterministic-e2e.sh`

---

## 4. 功能對檔案與測試用途

## 4.1 Auth 會員流程

**檔案：**
- `tests/auth/login.spec.ts`
- `tests/auth/register.spec.ts`
- `tests/auth/verify-email.spec.ts`
- `tests/auth/forgot-password.spec.ts`
- `tests/auth/reset-password.spec.ts`
- `tests/auth/logout.spec.ts`
- `tests/auth/route-protection.spec.ts`

**執行指令（Auth 全套）：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/auth/login.spec.ts tests/auth/register.spec.ts tests/auth/verify-email.spec.ts tests/auth/forgot-password.spec.ts tests/auth/reset-password.spec.ts tests/auth/logout.spec.ts tests/auth/route-protection.spec.ts --project=chromium --workers=1'
```

### A) `tests/auth/login.spec.ts`
- `displays login form`：驗證登入表單基本元素存在。
- `displays page title and brand`：驗證品牌標題正確渲染。
- `displays forgot password link`：驗證忘記密碼入口可見。
- `displays register link`：驗證註冊入口可見。
- `shows error when email is empty`：驗證 Email 必填。
- `shows error when password is empty`：驗證密碼必填。
- `navigates to register page when clicking register link`：驗證登入頁可正確導到註冊頁。
- `navigates to forgot password page when clicking forgot password link`：驗證登入頁可正確導到忘記密碼頁。
- `shows error for invalid credentials`：驗證錯誤帳密訊息路徑。
- `shows loading state during login`：驗證登入請求期間 loading 狀態。
- `redirects to verify-email when account email is not verified`：驗證未驗證帳號導向 `/verify-email`。

### B) `tests/auth/register.spec.ts`
- `displays registration form`：驗證註冊表單存在。
- `displays login link`：驗證返回登入入口。
- `displays page title`：驗證註冊頁標題。
- `shows error when name is empty`：驗證姓名必填。
- `shows error when name is too short`：驗證姓名長度規則。
- `shows error when email is empty`：驗證 Email 必填。
- `shows error when password is empty`：驗證密碼必填。
- `shows error when password is too short`：驗證密碼最小長度。
- `shows error when password confirmation is empty`：驗證確認密碼必填。
- `shows error when passwords do not match`：驗證密碼一致性。
- `navigates to login page when clicking login link`：驗證註冊頁可回登入。
- `redirects to verify-email page on successful registration`：驗證註冊成功導向驗證頁。
- `shows loading state during registration`：驗證註冊請求期間 loading。
- `shows error when email is already registered`：驗證重複 Email 失敗路徑。

### C) `tests/auth/verify-email.spec.ts`
- `redirects to login when accessing without pending email`：驗證缺少 pendingEmail 時阻擋存取。
- `stays on verify-email page when pending email exists in localStorage`：驗證 pendingEmail 恢復成功。
- `submits verify-email payload with pending email and otp code`：驗證送出 payload（email/code）契約正確。
- `keeps user on page and clears otp input when verify-email fails`：驗證 OTP 驗證失敗 UX（停留頁面 + 清空輸入）。

### D) `tests/auth/forgot-password.spec.ts`
- `displays forgot password form`：驗證忘記密碼表單存在。
- `displays page title`：驗證標題。
- `displays description text`：驗證說明文字。
- `displays back to login link`：驗證回登入入口。
- `shows error when email is empty`：驗證 Email 必填。
- `shows code sent state after valid email submission`：驗證送出成功後狀態轉換。
- `displays enter code button in code sent state`：驗證 codeSent 狀態按鈕。
- `displays resend button in code sent state`：驗證重送按鈕顯示。
- `restores code sent state from pending email after reload`：驗證 reload 後狀態恢復。
- `navigates to login when clicking back link`：驗證返回登入。
- `navigates to reset password page when clicking enter code button`：驗證導向重設密碼。
- `can resend verification code`：驗證重送流程可觸發。

### E) `tests/auth/reset-password.spec.ts`
- `redirects to forgot-password when accessing without pending email`：驗證無 pendingEmail 會回前一步。
- `stays on reset-password page when pending email exists in localStorage`：驗證 pendingEmail 狀態下可進入。
- `submits reset-password payload with pending email, otp code and new password`：驗證重設密碼 payload 契約。

### F) `tests/auth/logout.spec.ts`
- `clears local auth state and redirects to login even when logout API fails`：驗證登出 API 失敗時仍會清本地狀態與導向登入。
- `displays login and register buttons when not logged in`：驗證未登入頁面入口狀態。

### G) `tests/auth/route-protection.spec.ts`
- `allows access to login page without authentication`：驗證 public route 開放。
- `allows access to register page without authentication`：驗證 public route 開放。
- `allows access to forgot-password page without authentication`：驗證 public route 開放。
- `redirects authenticated user away from login page`：驗證已登入使用者不應回登入頁。
- `redirects authenticated user from verify-email page to home`：驗證已登入對 verify-email 的導向規則。

---

## 4.2 Dashboard 首頁

**檔案：** `tests/dashboard.spec.ts`

**執行指令：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/dashboard.spec.ts --project=chromium --workers=1'
```

- `displays hero section with correct content`：驗證 Hero 區塊內容。
- `displays monthly stats`：驗證月統計資訊。
- `opens expense form modal when clicking add button`：驗證快速新增入口可用。
- `displays stats cards`：驗證統計卡顯示。
- `shows empty state when no expenses`：驗證無資料空狀態。

---

## 4.3 Expense CRUD / 篩選 / 決策

**檔案：**
- `tests/expense-crud.spec.ts`
- `tests/batch-delete.spec.ts`

**執行指令（Expense 全套）：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/expense-crud.spec.ts tests/batch-delete.spec.ts --project=chromium --workers=1'
```

### A) `tests/expense-crud.spec.ts`
- `creates a new expense from dashboard`：驗證從首頁新增消費成功。
- `validates required fields`：驗證表單必填。
- `creates expense with impulse intent`：驗證意圖欄位儲存。
- `submits create request to /api/entries with normalized optional fields`：驗證 create payload 正規化。
- `displays expense list`：驗證列表顯示。
- `shows pagination for many expenses`：驗證分頁機制。
- `uses preset query and excludes custom date range when preset is not custom`：驗證預設篩選 query 契約。
- `keeps multi-select category and intent order in list request params`：驗證多選排序/參數順序。
- `edits an existing expense`：驗證更新流程。
- `updates decision only without calling expense update endpoint`：驗證 decision-only 更新路徑。
- `falls back from PUT decision to POST decision when decision does not exist`：驗證 decision fallback。
- `deletes an expense with confirmation`：驗證刪除確認流程。
- `cancels delete operation`：驗證取消刪除不改資料。

### B) `tests/batch-delete.spec.ts`
- `should select a single record when clicking row checkbox`：驗證單筆勾選。
- `should deselect record when clicking selected checkbox`：驗證取消勾選。
- `should select multiple records`：驗證多筆勾選。
- `should select all records when clicking header checkbox`：驗證全選。
- `should deselect all when clicking checked header checkbox`：驗證取消全選。
- `should show indeterminate state when partially selected`：驗證半選狀態。
- `should show confirm dialog when clicking batch delete`：驗證批次刪除對話框。
- `should close dialog and keep selection when clicking cancel`：驗證取消批次刪除。
- `should delete selected records when confirming`：驗證批次刪除成功。
- `should show success toast after deletion`：驗證成功提示。
- `should delete all records when all selected`：驗證全選刪除。
- `selected row should have highlighted styling`：驗證選取樣式。
- `batch action bar should be visible with correct structure`：驗證批次工具列。
- `batch delete button should have danger variant`：驗證危險樣式。
- `should hide batch action bar when no records selected`：驗證零選取 UI。
- `should handle empty list correctly`：驗證空列表邊界。
- `checkboxes should have proper aria attributes`：驗證可及性 aria。
- `should close dialog with Escape key`：驗證鍵盤 Esc。
- `should confirm delete with Enter key when dialog is open`：驗證鍵盤 Enter。

---

## 4.4 Recurring 固定支出

**檔案：** `tests/recurring-expense.spec.ts`

**執行指令：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  -e E2E_RECURRING_EMAIL=test@example.com \
  -e E2E_RECURRING_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/recurring-expense.spec.ts --project=chromium --workers=1'
```

- `submits recurring create request with normalized optional fields`：驗證 create payload 契約。
- `requests active filter with is_active query parameter`：驗證 active filter query。
- `submits recurring update request without blank optional note`：驗證 update payload 對可選欄位策略。

---

## 4.5 Cashflow 現金流

**檔案：**
- `tests/cashflow-income.spec.ts`
- `tests/cashflow-item.spec.ts`

**執行指令：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  -e E2E_CASHFLOW_EMAIL=test@example.com \
  -e E2E_CASHFLOW_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/cashflow-income.spec.ts tests/cashflow-item.spec.ts --project=chromium --workers=1'
```

### A) `tests/cashflow-income.spec.ts`
- `creates income and renders it in income table`：驗證收入新增。
- `edits income and shows updated value`：驗證收入編輯。
- `deletes income and removes it from table`：驗證收入刪除。
- `requests projection with selected month range when switching month selector`：驗證 projection months query。
- `requests projection for 1 and 12 month options`：驗證 1/12 月份邊界契約。
- `keeps page interactive when projection request fails`：驗證 projection 失敗恢復能力。

### B) `tests/cashflow-item.spec.ts`
- `creates cashflow item and renders it in expense table`：驗證支出項目新增。
- `shows validation errors when submitting empty cashflow item form`：驗證必填與表單錯誤。
- `keeps modal open when create request fails`：驗證失敗時 Modal 行為。
- `prevents duplicate create requests while first submit is pending`：驗證防重送。
- `edits cashflow item and shows updated values`：驗證編輯。
- `deletes cashflow item and removes it from expense table`：驗證刪除。

---

## 4.6 Review 回顧統計

**檔案：** `tests/review.spec.ts`

**執行指令：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/review.spec.ts --project=chromium --workers=1'
```

- `displays page title`：驗證頁面標題。
- `displays date range selector`：驗證日期範圍控制。
- `displays overview cards`：驗證總覽卡。
- `changes date range when selecting preset`：驗證 preset 切換。
- `requests summary API with selected preset`：驗證 preset API query。
- `shows custom date inputs when selecting custom range`：驗證 custom 輸入 UI。
- `requests summary API with custom date range query params`：驗證 custom query 契約。
- `displays total amount in currency format`：驗證貨幣格式。
- `displays impulse ratio as percentage`：驗證比率格式。
- `applies correct color to impulse ratio`：驗證顏色規則。

---

## 4.7 Navigation / Responsive / UX 回歸

**檔案：**
- `tests/navigation.spec.ts`
- `tests/responsive.spec.ts`
- `tests/qa-matrix-ux-bugfix.spec.ts`

**執行指令：**
```bash
docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
  -e E2E_TEST_EMAIL=test@example.com \
  -e E2E_TEST_PASSWORD=password \
  playwright sh -lc 'npm ci && npx playwright test tests/navigation.spec.ts tests/responsive.spec.ts tests/qa-matrix-ux-bugfix.spec.ts --project=chromium --workers=1'
```

### A) `tests/navigation.spec.ts`
- `navigates to dashboard from root`：驗證 `/` 導航行為。
- `navigates to expense list`：驗證主導覽到 records。
- `navigates to review page`：驗證主導覽到 review。
- `navigates to recurring expenses`：驗證主導覽到 recurring。
- `header is visible on all pages`：驗證主要頁面 Header 可見。
- `logo links to home`：驗證 logo 導回首頁。

### B) `tests/responsive.spec.ts`
- `dashboard displays correctly on mobile`：驗證手機版首頁可用。
- `expense form modal is usable on mobile`：驗證手機版 modal 互動。
- `dashboard displays correctly on tablet`：驗證平板版首頁。
- `stats cards are visible on tablet`：驗證平板統計卡。
- `dashboard uses full width on desktop`：驗證桌機版首頁。
- `navigation is visible on desktop`：驗證桌機版導覽列。

### C) `tests/qa-matrix-ux-bugfix.spec.ts`
- `TC-01: authenticated user stays logged in after reload on protected routes`：驗證登入狀態持久化。
- `TC-02: dashboard updates recent records immediately after creating expense`：驗證新增後首頁即時刷新。
- `TC-03: records/recurring/cashflow reflect new data immediately after save`：驗證跨頁即時一致性。
- `TC-04: date picker constraints are correct per form context`：驗證日期欄位約束規則。

---

## 5. 最新測試狀況快照（QA-E2E-06）

資料來源：2026-02-17 deterministic smoke 執行結果

### 5.1 E2E Smoke（PR Gate）
- 指令：`./scripts/run-deterministic-e2e.sh smoke`
- 結果：`22 passed, 0 failed`
- 備註：`22 = 21 smoke + 1 setup(auth.setup.ts)`

### 5.2 Full Regression（需要時才跑）
- 指令：`./scripts/run-deterministic-e2e.sh chromium`
- 使用時機：
  - Smoke 失敗且 root-cause 未明
  - 合併前 release gate
  - 涉及跨模組高風險改動

---

## 6. 失敗分類標準（QA-E2E-06）

所有 E2E 失敗先分類，再決定 rerun 範圍，分類順序固定如下：

1. **環境（Environment Drift）**
   - 常見訊號：容器未健康、DB 未 fresh seed、服務連線/timeout、baseURL 不可達。
2. **Auth / 測試資料前置（Auth/Data Setup）**
   - 常見訊號：被導向 `/login`、seed 帳號不存在、token/state 遺失、資料污染。
3. **契約不一致（Contract Mismatch）**
   - 常見訊號：API status/payload/query 與測試預期不一致、selector/DOM 契約漂移。
4. **產品邏輯缺陷（Business Logic Defect）**
   - 常見訊號：前置與契約都正確，但功能流程仍錯誤（計算、狀態流、互動邏輯）。

### 6.1 最小 triage checklist
- 先確認是否使用 deterministic 模板（`down -v -> up --build -> migrate:fresh --seed -> run -> down -v`）。
- 先跑失敗 spec（單檔）再跑失敗 domain（多檔），避免一開始 full rerun。
- 每次失敗都要輸出：
  - root-cause 類別（四選一）
  - 影響流程
  - 固定 rerun 指令

---

## 7. 標準 rerun 指令矩陣（QA-E2E-06）

```bash
# A) 單檔失敗重跑（最小成本）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
docker compose down -v
docker compose up -d --build postgres backend frontend
docker compose exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'
docker compose run --rm playwright sh -lc 'npm ci && npx playwright test tests/<failed-spec>.spec.ts --project=chromium --workers=1'
docker compose down -v

# B) 失敗 domain 重跑（同領域多檔）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
docker compose down -v
docker compose up -d --build postgres backend frontend
docker compose exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'
docker compose run --rm playwright sh -lc 'npm ci && npx playwright test tests/<spec-a>.spec.ts tests/<spec-b>.spec.ts --project=chromium --workers=1'
docker compose down -v

# C) Smoke gate 重跑（PR 風險確認）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh smoke

# D) Full regression（僅必要時）
cd /Users/songshaoning/Myproject/ledger-of-decisions-plan/ledger-of-decisions-e2e
./scripts/run-deterministic-e2e.sh chromium
```

---

## 8. 失敗回報格式（QA-E2E-06）

請使用：`ledger-of-decisions-e2e/docs/E2E-FAILURE-REPORT-TEMPLATE.md`

每次回報至少要有：
- Scope + exact commands
- 結果摘要（passed/failed/skipped）
- root-cause 類別（Environment/Auth-Data/Contract/Business Logic）
- fixed rerun command
