# Auto-Pilot Autonomous Business Management Architecture

## 1. System Overview (7 Layers)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Layer 7: War Room & Unified UI                   │
│   (Cockpit Overview, Approvals Inbox, Predictions Radar, Audit Log)   │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│                   Layer 6: Action Engine & Kill Switch                 │
│        (Whitelist Registry, 2h SLA Approval Gate, Rollback Engine)     │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│               Layer 5: Multi-Agent Council & Cost Guard                │
│    (Optimist, Pessimist, Analyst, 3-Tier Budget Adaptive Models)       │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│           Layer 4: Algorithmic Root Cause & Early Warning Radar        │
│          (Directed Causal DAG, OLS Linear Regression, $0 LLM)          │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│                    Layer 3: 10 Department Probes                       │
│    (Orders, Finance, Inventory, Support, Logistics, Security, etc.)    │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│               Layer 2: Policy DSL & Rule Arbitration Engine            │
│          (YAML Declarative Rules, Priority Arbitration P0-P100)        │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │
┌────────────────────────────────────┴───────────────────────────────────┐
│              Layer 1: Event Store & State Observer                     │
│         (PostgreSQL Materialized View, SHA-256 Hash Chain)             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bilingual Executive Summary / خلاصه مدیریتی

### English
Auto-Pilot is an autonomous operations engine for Yiwu Express that continuously ingests multi-department business metrics, detects correlated cross-department root causes, deliberates through a 3-persona Multi-Agent Council, enforces strict human approval gates for critical actions, and guarantees mathematical budget bounds ($5.00/day).

### فارسی (Persian Summary)
سامانه **اتوپایلوت (Auto-Pilot)** بستر مدیریت و راهبری خودکار برای تجارت جهانی ییوو اکسپرس است. این سامانه به‌صورت پیوسته شاخص‌های ۱۰ بخش کلیدی کسب‌وکار را دریافت کرده، دلایل ریشه‌ای اختلالات را از طریق گراف‌های علی و بدون هزینه مدل شناسایی می‌کند، از طریق شورای سه نفره چندعاملی تصمیم‌گیری نموده و با سوئیچ اضطراری و تأییدیه انسانی دو مرحله‌ای، امنیت کامل فرآیندها را تضمین می‌نماید.
