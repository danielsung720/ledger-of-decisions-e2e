# E2E QA 修正 TODO

最後更新：2026-02-17
適用範圍：`ledger-of-decisions-e2e`
參考文件：`ledger-of-decisions-e2e/docs/E2E-QA-MANUAL.md`

## 0. 當前狀態
- E2E 全量（chromium）：`123 passed / 11 failed`
- 需修正檔案：
  - `tests/navigation.spec.ts`（4 failed）
  - `tests/responsive.spec.ts`（6 failed）
  - `tests/recurring-expense.spec.ts`（1 failed）

---

## 1. P0 - 先修（阻擋全量綠燈）

## 1.1 Navigation 測試補登入前置
- [ ] `tests/navigation.spec.ts` 增加統一登入 helper（建議 API login）。
- [ ] 修正以下案例前置，避免在未登入狀態進入 `/` 被導向 `/login`：
  - [ ] `navigates to dashboard from root`
  - [ ] `navigates to expense list`
  - [ ] `header is visible on all pages`
  - [ ] `logo links to home`
- [ ] 驗收：
  ```bash
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
    -e E2E_TEST_EMAIL=test@example.com \
    -e E2E_TEST_PASSWORD=password \
    playwright sh -lc 'npm ci && npx playwright test tests/navigation.spec.ts --project=chromium --workers=1'
  ```

## 1.2 Responsive 測試補登入前置
- [ ] `tests/responsive.spec.ts` 增加統一登入前置（同 navigation 使用同一 helper）。
- [ ] 修正以下案例在 authenticated 狀態下執行：
  - [ ] `dashboard displays correctly on mobile`
  - [ ] `expense form modal is usable on mobile`
  - [ ] `dashboard displays correctly on tablet`
  - [ ] `stats cards are visible on tablet`
  - [ ] `dashboard uses full width on desktop`
  - [ ] `navigation is visible on desktop`
- [ ] 驗收：
  ```bash
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
    -e E2E_TEST_EMAIL=test@example.com \
    -e E2E_TEST_PASSWORD=password \
    playwright sh -lc 'npm ci && npx playwright test tests/responsive.spec.ts --project=chromium --workers=1'
  ```

---

## 2. P1 - 次修（契約對齊）

## 2.1 Recurring update payload assertion 對齊 nullable 契約
- [ ] `tests/recurring-expense.spec.ts` 更新 assertion：`note` 空值目前為 `null`（非 `undefined`）。
- [ ] 與前後端確認 update 契約後定稿：
  - 選項 A：維持 `null`（測試改 `toBeNull()`）
  - 選項 B：改回省略欄位（前端 mapping 調整）
- [ ] 修正案例：
  - [ ] `submits recurring update request without blank optional note`
- [ ] 驗收：
  ```bash
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
    -e E2E_TEST_EMAIL=test@example.com \
    -e E2E_TEST_PASSWORD=password \
    -e E2E_RECURRING_EMAIL=test@example.com \
    -e E2E_RECURRING_PASSWORD=password \
    playwright sh -lc 'npm ci && npx playwright test tests/recurring-expense.spec.ts --project=chromium --workers=1'
  ```

---

## 3. P2 - 優化（降低後續維護成本）

## 3.1 共用登入 helper 標準化
- [ ] 在 `helpers/` 建立或統一 `loginByApi` / `loginByUi` helper。
- [ ] 所有需 authenticated 前置的 spec 改用同一 helper。
- [ ] 避免各檔重複 hardcode locator 與 token 寫入流程。

## 3.2 環境變數策略統一
- [ ] 整理 `.env.example`（或文件）中 E2E 參數：
  - [ ] `E2E_TEST_EMAIL`
  - [ ] `E2E_TEST_PASSWORD`
  - [ ] `E2E_CASHFLOW_EMAIL` / `E2E_CASHFLOW_PASSWORD`
  - [ ] `E2E_RECURRING_EMAIL` / `E2E_RECURRING_PASSWORD`
  - [ ] `E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD`
- [ ] 檢查所有 spec 是否仍有硬編碼帳密。

## 3.3 最終全量回歸
- [ ] 跑完整 E2E 回歸（chromium, workers=1）。
- [ ] 目標：`0 failed`。
- [ ] 指令：
  ```bash
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml down -v
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml up -d --build postgres backend frontend
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml run --rm \
    -e E2E_TEST_EMAIL=test@example.com \
    -e E2E_TEST_PASSWORD=password \
    playwright sh -lc 'npm ci && npx playwright test --project=chromium --workers=1'
  docker compose -f ledger-of-decisions-e2e/docker-compose.yml down -v
  ```

---

## 4. 驗收紀錄（QA 填寫）
- [ ] Navigation 區塊通過
- [ ] Responsive 區塊通過
- [ ] Recurring 區塊通過
- [ ] 全量 E2E 通過（0 failed）
- [ ] 回填最終測試時間與結果

最終結果：
- 日期：
- 執行人：
- Pass/Fail：
- 備註：
