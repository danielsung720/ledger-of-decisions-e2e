# E2E 測試文檔

本文檔詳細記錄 `ledger-of-decisions-e2e` 專案的所有端對端測試案例。

## 測試概覽

| 類別 | 測試檔案 | 測試案例數 | 狀態 |
|------|----------|-----------|------|
| Dashboard | dashboard.spec.ts | 5 | 全部通過 |
| Expense CRUD | expense-crud.spec.ts | 8 | 5 通過, 3 跳過 |
| Navigation | navigation.spec.ts | 6 | 全部通過 |
| Responsive | responsive.spec.ts | 6 | 全部通過 |
| Review | review.spec.ts | 8 | 全部通過 |
| **總計** | **5 個檔案** | **33 個測試** | **30 通過, 3 跳過** |

---

## 1. Dashboard 測試

測試檔案：`tests/dashboard.spec.ts`

### Dashboard Page
| 測試案例 | 描述 |
|---------|------|
| displays hero section with correct content | 顯示 Hero 區域及正確內容 |
| displays monthly stats | 顯示月度統計資料 |
| opens expense form modal when clicking add button | 點擊新增按鈕時開啟消費表單 Modal |
| displays stats cards | 顯示統計卡片 |
| shows empty state when no expenses | 無消費記錄時顯示空狀態 |

---

## 2. Expense CRUD 測試

測試檔案：`tests/expense-crud.spec.ts`

### Create Expense
| 測試案例 | 描述 |
|---------|------|
| creates a new expense from dashboard | 從 Dashboard 新增消費記錄 |
| validates required fields | 驗證必填欄位 |
| creates expense with impulse intent | 建立衝動消費類型的記錄 |

### Read Expenses
| 測試案例 | 描述 |
|---------|------|
| displays expense list | 顯示消費記錄列表 |
| shows pagination for many expenses | 多筆記錄時顯示分頁 |

### Update Expense (跳過)
| 測試案例 | 描述 | 狀態 |
|---------|------|------|
| edits an existing expense | 編輯現有消費記錄 | 跳過 (需現有資料) |

### Delete Expense (跳過)
| 測試案例 | 描述 | 狀態 |
|---------|------|------|
| deletes an expense with confirmation | 確認後刪除消費記錄 | 跳過 (需現有資料) |
| cancels delete operation | 取消刪除操作 | 跳過 (需現有資料) |

---

## 3. Navigation 測試

測試檔案：`tests/navigation.spec.ts`

### Navigation
| 測試案例 | 描述 |
|---------|------|
| navigates to dashboard from root | 從根路徑導航到 Dashboard |
| navigates to expense list | 導航到消費記錄列表 |
| navigates to review page | 導航到回顧頁面 |
| navigates to recurring expenses | 導航到固定支出頁面 |
| header is visible on all pages | 所有頁面都顯示 Header |
| logo links to home | Logo 連結到首頁 |

---

## 4. Responsive 測試

測試檔案：`tests/responsive.spec.ts`

### Mobile View (390x844 - iPhone 12)
| 測試案例 | 描述 |
|---------|------|
| dashboard displays correctly on mobile | Dashboard 在手機上正確顯示 |
| expense form modal is usable on mobile | 消費表單 Modal 在手機上可用 |

### Tablet View (1024x1366 - iPad Pro)
| 測試案例 | 描述 |
|---------|------|
| dashboard displays correctly on tablet | Dashboard 在平板上正確顯示 |
| stats cards are visible on tablet | 統計卡片在平板上可見 |

### Desktop View (1920x1080)
| 測試案例 | 描述 |
|---------|------|
| dashboard uses full width on desktop | Dashboard 在桌面版使用全寬度 |
| navigation is visible on desktop | 導航在桌面版可見 |

---

## 5. Review 測試

測試檔案：`tests/review.spec.ts`

### Review Page
| 測試案例 | 描述 |
|---------|------|
| displays page title | 顯示頁面標題 |
| displays date range selector | 顯示日期範圍選擇器 |
| displays overview cards | 顯示概覽卡片 |
| changes date range when selecting preset | 選擇預設時變更日期範圍 |
| shows custom date inputs when selecting custom range | 選擇自訂範圍時顯示日期輸入 |
| displays total amount in currency format | 以貨幣格式顯示總金額 |
| displays impulse ratio as percentage | 以百分比顯示衝動消費佔比 |
| applies correct color to impulse ratio | 對衝動消費佔比套用正確顏色 |

---

## Page Object Models

### BasePage
基礎頁面物件，提供通用功能：
- `goto(path)` - 導航到指定路徑
- `waitForPageReady()` - 等待頁面載入完成
- `successToast` / `errorToast` / `warningToast` - Toast 通知定位器
- `modal` - Modal 對話框定位器
- `confirmDialog()` / `cancelDialog()` - 確認對話框操作
- `waitForApi(urlPattern)` - 等待 API 回應

### DashboardPage
Dashboard 頁面物件：
- `heroTitle` - Hero 區域標題
- `addExpenseButton` - 新增消費按鈕
- `monthlyAmount` / `monthlyCount` - 月度統計
- `impulseRatio` - 衝動消費佔比
- `statsCards` - 統計卡片
- `openAddExpenseModal()` - 開啟新增消費 Modal

### ExpenseFormModal
消費表單 Modal 物件：
- `amountInput` - 金額輸入
- `categorySelect` - 分類選擇
- `dateInput` - 日期輸入
- `intentNecessity` / `intentImpulse` / ... - 意圖選擇按鈕
- `confidenceHigh` / `confidenceMedium` / `confidenceLow` - 滿意度按鈕
- `fillForm(data)` - 填寫表單
- `submit()` / `cancel()` - 提交/取消

### ExpenseListPage
消費記錄列表頁面物件：
- `pageTitle` - 頁面標題
- `addButton` - 新增按鈕
- `expenseRows` - 消費記錄行
- `pagination` - 分頁元件
- `filterByCategory(category)` - 按分類過濾
- `editExpense(amount)` / `deleteExpense(amount)` - 編輯/刪除

### ReviewPage
回顧頁面物件：
- `dateRangeSelector` - 日期範圍選擇器
- `todayButton` / `thisWeekButton` / `thisMonthButton` - 預設按鈕
- `totalAmountCard` / `impulseRatioCard` / `trendCard` - 概覽卡片
- `selectDateRange(range)` - 選擇日期範圍
- `getTotalAmount()` / `getImpulseRatio()` - 取得統計數據

---

## 執行測試指令

```bash
# 執行所有測試
npm test

# 執行特定瀏覽器
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# UI 模式 (推薦用於 Debug)
npm run test:ui

# 帶瀏覽器執行
npm run test:headed

# Debug 模式
npm run test:debug

# 顯示測試報告
npm run test:report

# Docker 執行
npm run test:docker
```

---

## Docker Compose 執行

### 完整環境執行

```bash
# 一鍵啟動所有服務並執行測試
docker compose up --build

# 分步驟執行
docker compose up -d postgres backend frontend  # 啟動服務
docker compose run --rm playwright              # 執行測試
docker compose down                             # 停止服務
```

### 服務架構

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Playwright   │────▶│    Frontend     │────▶│    Backend      │
│   Test Runner   │     │   (Nuxt 3)      │     │   (Laravel)     │
│   :playwright   │     │   :3000         │     │   :8080         │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │   :5432         │
                                                └─────────────────┘
```

---

## 測試配置

### playwright.config.ts 關鍵設定

| 設定項 | 值 | 說明 |
|--------|-----|------|
| testDir | ./tests | 測試目錄 |
| fullyParallel | true | 平行執行測試 |
| retries | 2 (CI) / 0 (本地) | 失敗重試次數 |
| timeout | 30000ms | 單一測試逾時 |
| actionTimeout | 10000ms | 操作逾時 |
| screenshot | only-on-failure | 失敗時截圖 |
| video | on-first-retry | 重試時錄影 |
| trace | on-first-retry | 重試時記錄追蹤 |

### 支援的瀏覽器

| 專案名稱 | 設備 |
|---------|------|
| chromium | Desktop Chrome |
| firefox | Desktop Firefox |
| webkit | Desktop Safari |
| Mobile Chrome | Pixel 5 |
| Mobile Safari | iPhone 12 |

---

## CI/CD 整合範例

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start services
        run: docker compose up -d frontend backend
        working-directory: ./ledger-of-decisions-e2e

      - name: Wait for services
        run: |
          timeout 60 sh -c 'until curl -s http://localhost:3000; do sleep 1; done'

      - name: Run E2E tests
        run: docker compose run --rm playwright
        working-directory: ./ledger-of-decisions-e2e

      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: ledger-of-decisions-e2e/playwright-report/
```

---

## 測試輸出目錄

```
ledger-of-decisions-e2e/
├── test-results/           # 測試結果 (截圖、影片、追蹤)
│   ├── results.json        # JSON 格式結果
│   └── */                  # 失敗測試的 artifacts
├── playwright-report/      # HTML 報告
│   └── index.html          # 開啟此檔案檢視報告
```

---

## 測試覆蓋的用戶流程

### 核心流程

1. **新增消費** - 從 Dashboard 開啟 Modal → 填寫表單 → 儲存
2. **查看記錄** - 導航到記錄列表 → 查看分頁
3. **回顧分析** - 選擇日期範圍 → 查看統計

### 響應式設計

- 手機版 (390x844) - 基本功能可用
- 平板版 (1024x1366) - 卡片佈局正確
- 桌面版 (1920x1080) - 完整導航可見

### 頁面導航

- 首頁 → 消費記錄
- 首頁 → 回顧
- 首頁 → 固定支出
- Logo → 首頁
