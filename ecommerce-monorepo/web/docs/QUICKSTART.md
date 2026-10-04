# Auto-Pilot 15-Minute Quickstart Guide

## Step 1: Access the Cockpit (1 minute)
Navigate to [`/admin/autopilot`](http://localhost:3001/admin/autopilot) in your browser.
Confirm the operational status light is **GREEN (Nominal)**.

## Step 2: Try the Safe Demo Playground (3 minutes)
Navigate to [`/admin/autopilot/demo`](http://localhost:3001/admin/autopilot/demo).
Select the **"Customs Transit Hold & Logistics SLA Breach"** scenario and click **"Run Simulation Cycle"**.
Observe:
1. 10 department probes evaluate telemetry in parallel.
2. The Multi-Agent Council synthesizes consensus.
3. Actions are proposed in dry-run mode with **0 database mutations**.

## Step 3: Trigger a Manual Telemetry Cycle (2 minutes)
Open the Command Palette by pressing <kbd>Cmd</kbd> + <kbd>K</kbd> (or <kbd>Ctrl</kbd> + <kbd>K</kbd>).
Select **"Trigger Auto-Pilot Cycle Now"** or click "Trigger Cycle" on the Cockpit.
Follow the live SSE event stream on the War Room screen (`/admin/autopilot/cycles/live`).

## Step 4: Handle an Approval in the Inbox (3 minutes)
Navigate to [`/admin/autopilot/approvals`](http://localhost:3001/admin/autopilot/approvals).
Review the pending action recommendation (e.g. `create_transfer_request`).
Click **Approve** or **Reject** and provide a brief operator reason.

## Step 5: Test Telegram & Slack Integration (4 minutes)
Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in your `.env`.
Send `/status` to your bot.
Receive instant real-time business health telemetry directly on your phone.

## Step 6: Verify Emergency Kill Switch (2 minutes)
Navigate to [`/admin/autopilot/settings`](http://localhost:3001/admin/autopilot/settings).
Click **"Activate Global Kill Switch"**, enter a test reason, and confirm.
Notice the red beacon locks all autonomous action execution across the entire platform.
Click **"Resume Auto-Pilot"** to restore nominal operations.

---

## راهنمای سریع ۱۵ دقیقه‌ای (Persian Summary)
۱. به آدرس `/admin/autopilot` بروید و وضعیت سبز سیستم را بررسی کنید.  
۲. در محیط آزمایشی `/admin/autopilot/demo` یک سناریوی بحرانی را به صورت شبیه‌سازی اجرا کنید.  
۳. با کلیدهای میانبر <kbd>Cmd+K</kbd> یک چرخه زنده را آغاز نمایید.  
۴. در بخش تاییدیه‌ها یک اقدام را بررسی و تایید کنید.  
۵. دستور `/status` را در ربات تلگرام تست کنید.  
۶. سوئیچ اضطراری را در بخش تنظیمات بررسی و عملکرد آن را اعتبارسنجی کنید.
