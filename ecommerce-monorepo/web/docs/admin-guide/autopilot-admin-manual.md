# Auto-Pilot Administrator Manual

## 1. Navigating the Cockpit
- **Cockpit Overview (`/admin/autopilot`):** Shows live system status, current friction KPI metric cards, the Root Cause Directed Causal Vector diagram, high-priority approvals, and the terminal event feed.
- **Approvals Inbox (`/admin/autopilot/approvals`):** Human-in-the-loop review queue for actions classified as `APPROVE` or `BLOCK`.
- **Predictions & Radar (`/admin/autopilot/predictions`):** Linear regression forecasting for 7-day revenue and inventory stockouts.
- **Insights & Retrospective (`/admin/autopilot/insights`):** Monthly performance analysis, memory vector similarity search, and recommended policy adjustments.
- **Policy Rules (`/admin/autopilot/policies`):** Declarative YAML business policy rule editor with built-in live dry-run simulator.
- **Audit Trail (`/admin/autopilot/audit`):** Cryptographic SHA-256 hash-chain verification tool to ensure zero log tampering.
- **Safety & Budgets (`/admin/autopilot/settings`):** Global/department kill switch toggles and daily LLM cost budget caps.

---

## 2. Writing Policy Rules (Layer 2 DSL)
Rules are declared in YAML with Zod schema validation:
```yaml
policy: "low_stock_replenish"
department: "inventory"
priority: 75
description: "Triggers warehouse transfer when low stock count exceeds 3"
when:
  field: "inventory.lowStockCount"
  operator: "gt"
  value: 3
then:
  - action: "create_transfer_request"
    risk: "approve"
    params:
      quantity: 200
```

---

## خلاصه راهنمای ادمین (Admin Summary in Persian)
مدیر سیستم می‌تواند قوانین کسب‌وکار را با فرمت خوانای YAML در بخش قوانین ثبت کند، شبیه‌سازی بلادرنگ انجام دهد، تاییدیه‌ها را با یک کلیک تایید یا رد نماید و سلامت زنجیره لاگ‌ها را اعتبارسنجی کند.
