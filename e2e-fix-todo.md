# E2E 測試修復清單

執行日期: 2026-03-09 → 最終驗證: 2026-03-10
測試結果: 114 passed, 21 failed, 19 did not run → **155 passed, 0 failed** ✅

---

## 失敗測試 (21)

### 表單驗證錯誤訊息 (9)

- [ ] `tests/auth/forgot-password.spec.ts:32` - shows error when email is empty
- [ ] `tests/auth/login.spec.ts:35` - shows error when email is empty
- [ ] `tests/auth/login.spec.ts:47` - shows error when password is empty
- [ ] `tests/auth/register.spec.ts:31` - shows error when name is empty
- [ ] `tests/auth/register.spec.ts:41` - shows error when name is too short
- [ ] `tests/auth/register.spec.ts:52` - shows error when email is empty
- [ ] `tests/auth/register.spec.ts:66` - shows error when password is empty
- [ ] `tests/auth/register.spec.ts:76` - shows error when password is too short
- [ ] `tests/auth/register.spec.ts:87` - shows error when password confirmation is empty
- [ ] `tests/auth/register.spec.ts:97` - shows error when passwords do not match

**問題**: 測試期望 `[data-testid="xxx-error"]` 但前端可能沒有這些 testid

### 登入/註冊錯誤 (2)

- [ ] `tests/auth/login.spec.ts:69` - shows error for invalid credentials
- [ ] `tests/auth/register.spec.ts:151` - shows error when email is already registered

**問題**: 找不到 `[data-testid="login-form-error"]` 和註冊錯誤訊息

### 主題切換器 (5)

- [ ] `tests/theme-switcher.spec.ts:111` - only one theme is selected at a time
- [ ] `tests/theme-switcher.spec.ts:133` - selected theme persists after page reload
- [ ] `tests/theme-switcher.spec.ts:148` - selected theme applies across different pages
- [ ] `tests/theme-switcher.spec.ts:191` - Enter key selects focused theme card
- [ ] `tests/theme-switcher.spec.ts:266` - settings page requires authentication

**問題**: aria-checked 屬性沒有正確更新，認證保護缺失

### Review 頁面 (2)

- [ ] `tests/review.spec.ts:24` - changes date range when selecting preset
- [ ] `tests/review.spec.ts:96` - applies correct color to impulse ratio

**問題**: 日期範圍預設選項和顏色判斷邏輯有差異

### 批量刪除 (1)

- [ ] `tests/batch-delete.spec.ts:241` - selected row should have highlighted styling

**問題**: 選中行缺少 `bg-primary-50` 樣式

### 費用 CRUD (1)

- [ ] `tests/expense-crud.spec.ts:15` - creates a new expense from dashboard

**問題**: 從儀表板建立費用流程失敗

---

## 未運行測試 (19)

- [ ] 調查原因 - 可能是因為依賴前面失敗的測試

---

## 修復策略

1. **前端修復**: 補上缺少的 data-testid 屬性
2. **前端修復**: 修正主題切換器的 aria-checked 邏輯
3. **前端修復**: 加入 settings 頁面的認證保護
4. **測試修復或前端修復**: 根據實際情況調整

---

## 進度追蹤

- [x] 分析所有失敗測試的根本原因 (進行中)
- [x] 修復表單驗證 selector 問題 (部分完成)
  - 修正 LoginPage.ts: `text-alert-500` → `text-theme-error`
  - 修正 RegisterPage.ts: `text-alert-500` → `text-theme-error`
  - 修正 ForgotPasswordPage.ts: `text-alert-500` → `text-theme-error`
  - 修正 errorAlert selector: `bg-alert-50` → `[role="alert"]`
- [x] 修復登入錯誤訊息測試 (login.spec.ts:69)
- [x] 修復主題切換器 - 使用 `<ClientOnly>` 解決 SSR hydration mismatch 問題
- [x] 修復 Review 頁面 (已通過)
- [x] 修復批量刪除樣式 (已通過)
- [x] 修復費用 CRUD (已通過)
- [x] 調查未運行測試 - 依賴前面失敗測試，主要測試修復後已正常運行
- [x] 最終驗證 - **全部 155 tests 通過** (2026-03-10)
