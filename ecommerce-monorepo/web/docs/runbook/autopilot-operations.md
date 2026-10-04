# Auto-Pilot Operational Runbook & Incident Management

## 1. Daily Operator Routine
1. **Morning Inspection:** Open Cockpit (`/admin/autopilot`). Ensure Operational Beacon is **GREEN (Nominal)**.
2. **Review Pending Approvals:** Check `/admin/autopilot/approvals`. Review any `APPROVE` or `BLOCK` actions requiring operator review within the 2-hour SLA window.
3. **Inspect Predictions:** Review `/admin/autopilot/predictions` to monitor 7-day revenue trajectories and inventory stockout forecast dates.
4. **Check LLM Daily Spend:** Ensure cost is within normal operating ranges ($0.00 to $0.05 / day).

---

## 2. Common Incident Playbooks

### Incident 1: Security Brute Force Spike
- **Symptoms:** High failed login count (>20 in last hour) across multiple foreign IPs.
- **Auto-Pilot Behavior:** Security probe alerts `CRITICAL`. Council consensus proposes `lock_suspicious_sessions`.
- **Operator Action:** If risk is high, confirm action in Approvals Inbox to ban the offending IP range.

### Incident 2: Customs Transit Hold (>48 Hours)
- **Symptoms:** High-value container held at border post.
- **Auto-Pilot Behavior:** Logistics probe detects SLA breach. Council drafts customer delay notice and notifies logistics coordinator.
- **Operator Action:** Review carrier documentation and release approval.

### Incident 3: Emergency Kill Switch Activation
- **Command:** Click red emergency button on Cockpit or send `/kill` on Telegram.
- **Recovery:** Once root cause is resolved, enter reason and click "Resume Auto-Pilot" or send `/resume` on Telegram.

---

## خلاصه فارسی (Runbook Summary in Persian)
اپراتور سیستم باید روزانه به پنل هدایت خودکار مراجعه نموده و تاییدیه‌های در صف (Approvals) را پیش از پایان مهلت ۲ ساعته تعیین تکلیف کند. در صورت بروز هرگونه مشکل امنیتی یا رفتارهای غیرمنتظره، با استفاده از سوئیچ اضطراری در تلگرام یا داشبورد، کلیه فعالیت‌های خودکار متوقف می‌شوند.
