# Auto-Pilot UI Walkthrough & Operational Guide (راهنمای رابط کاربری)

This document walks through all administrative views and interfaces provided by Auto-Pilot.

---

## 1. Overview Dashboard (`/admin/autopilot`)
The central mission control dashboard giving immediate visibility into system health, active anomalies, and live cycles.

```text
+------------------------------------------------------------------------------------+
|  [🤖 Auto-Pilot Mission Control]              [Status: NORMAL]   [Kill Switch: OFF]|
+------------------------------------------------------------------------------------+
|  [Run Full Cycle]   [Run Quick Scan]   [Demo Playground]   [Onboarding Guide]      |
+------------------------------------------------------------------------------------+
|  METRICS AT A GLANCE:                                                              |
|  - Total Cycles Today: 24          - Active Anomalies: 2                           |
|  - Actions Executed: 18            - LLM Spend Today: $0.021 / $5.00               |
+------------------------------------------------------------------------------------+
|  LATEST COUNCIL CONSENSUS:                                                         |
|  "High card declines detected from range 194.26.x.x. Action: IP throttle initiated |
|   Confidence: 96% | Arbitration: Analytical synthesis upheld"                      |
+------------------------------------------------------------------------------------+
|  DEPARTMENT RADAR:                                                                 |
|  [Orders: 🟢 Healthy]  [Logistics: 🟡 Minor Delay]  [Security: 🔴 Attack Blocked]   |
|  [Finance: 🟢 Normal]  [Support: 🟢 0 Breaches]     [Marketing: 🟢 ROAS 4.2x]      |
+------------------------------------------------------------------------------------+
```

---

## 2. Onboarding Welcome Page (`/admin/autopilot/welcome`)
Interactive introduction for new operators and team members explaining how Auto-Pilot works, safety guardrails, and rollout milestones.

- **Stack Visualizer:** Explains the 7 layers from Probes up to the Self-Improvement Loop.
- **Rollout Schedule:** Week 1 Read-only -> Week 2 Low-risk Auto -> Week 3 Full Autonomous Execution.
- **Direct Navigation:** Quick jump buttons to documentation and demo sandbox.

---

## 3. Demo Playground (`/admin/autopilot/demo`)
A risk-free interactive sandbox that simulates realistic operational crisis scenarios in dry-run mode without modifying actual production databases.

- **Pre-packaged Scenarios:**
  1. *Customs Hold Crisis:* Simulates delayed container logistics with SLA breaches.
  2. *Brute Force Payment Attack:* Simulates distributed card velocity attacks.
  3. *High Velocity Stockout:* Simulates top-selling SKU exhaustion with active marketing spend.
- **Execution:** Clicking **Simulate Scenario** executes the real Auto-Pilot cycle runner in `dryRun: true` mode and renders instant Council and Action execution breakdowns.

---

## 4. War Room & Live Incidents (`/admin/autopilot/war-room`)
Dedicated operational command center for handling critical security breaches, logistics halts, and high-severity incidents.

- Real-time incident logs.
- Immediate one-click department quarantine / unblock.
- Council deliberations streaming directly to operator screen.

---

## 5. Memory & Policy Browser (`/admin/autopilot/memory`)
Inspects the historical decision matrix, retrieved memories, and policy rules.

- Search past decisions using semantic search queries.
- Inspect success/failure retrospective ratings.
- View policy rule weights and dynamic risk thresholds.

---

## 6. Global Command Palette (`Cmd + K` or `Ctrl + K`)
Raycast-style instantaneous command palette accessible from anywhere in the Admin panel.

```text
+--------------------------------------------------------------------+
|  Type a command or search Auto-Pilot...                       [Esc]|
+--------------------------------------------------------------------+
|  NAVIGATION                                                        |
|  > Open Auto-Pilot Cockpit                                         |
|  > Open Incident War Room                                          |
|  > Launch Demo Playground                                          |
|  > Open Onboarding Guide                                           |
|                                                                    |
|  ACTIONS                                                           |
|  > Trigger Full Council Cycle (Manual)                             |
|  > Run 15-Minute Quick Scan                                        |
|  > Toggle Emergency Kill Switch                                    |
+--------------------------------------------------------------------+
```

---

## 7. Public Status Page (`/status/autopilot`)
A clean, minimal, non-confidential status page for external stakeholders and customer-facing teams:
- Operational health of all core probes (Logistics, Orders, Payments, Support).
- Current autonomous action status.
- System uptime and timestamp of the latest automated audit cycle.
