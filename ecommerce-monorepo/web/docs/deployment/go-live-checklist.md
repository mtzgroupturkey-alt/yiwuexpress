# Production Go-Live Checklist (چک‌لیست راه‌اندازی و تولید نهایی)

Use this operational checklist before enabling Auto-Pilot in the production environment.

---

### Phase 1: Environment & Secrets Verification (تنظیمات محیط و متغیرهای امنیتی)
- [ ] `NODE_ENV=production` properly set on server environment.
- [ ] Database connection string points to production PostgreSQL with SSL enabled (`DATABASE_URL`).
- [ ] Kill switch credentials: `KILL_SWITCH_SECRET` securely generated and stored in vault.
- [ ] Webhook signature key: `AUTOPILOT_WEBHOOK_SECRET` configured with minimum 32 random hex characters.
- [ ] Telegram Bot credentials:
  - `TELEGRAM_BOT_TOKEN` set.
  - `TELEGRAM_CHAT_ID` set to authorized administrative channel.
  - `TELEGRAM_WEBHOOK_SECRET` matching Telegram webhook configuration.
- [ ] AI API keys: `GEMINI_API_KEY` and optional `OPENAI_API_KEY` populated with active production quotas.
- [ ] Redis / Cache URL configured for distributed sliding-window rate limiters (if multi-instance).

---

### Phase 2: Database & Schema Integrity (پایگاه داده و مهاجرت‌ها)
- [ ] Baseline migrations verified: `npx prisma migrate status` reports schema is in sync with zero unapplied migrations.
- [ ] Database indexes present for `AutoPilotCycle`, `AutoPilotAction`, `AutoPilotFinding`, and `AutoPilotMemory`.
- [ ] System settings initialized:
  ```sql
  SELECT * FROM "SystemSetting" WHERE key LIKE 'autopilot_%';
  ```
- [ ] Verify Kill Switch is INACTIVE globally:
  - `autopilot_kill_global` is `false`.

---

### Phase 3: Action Safeguards & Rate Limits (حفاظت و محدودیت اقدامات)
- [ ] Action Storm throttle configured: max 10 automatic actions per minute globally.
- [ ] High-risk actions (`pause_campaign`, `bulk_refund`, `hold_shipment`) verified set to `"approve"` or `"block"`.
- [ ] Rollback procedures tested for all reversible actions:
  - `block_ip` -> `unblock_ip` verified.
  - `quarantine_order` -> `release_order` verified.
- [ ] Operator notification channels confirmed working:
  - Telegram alert webhook delivers test message.
  - In-app notification center renders pending approvals.

---

### Phase 4: Cost Guard & LLM Budget (سقف هزینه و مصرف هوش مصنوعی)
- [ ] Daily token budget threshold set (recommended: $5.00/day soft cap).
- [ ] Adaptive Model Selector active:
  - Tier 1: Gemini 2.5 Flash for routine triage.
  - Tier 2: Gemini 2.5 Flash Lite when $\ge 80\%$ budget consumed.
  - Tier 3: Heuristic-only fallback when 100% budget reached.
- [ ] Cycle run interval configured:
  - Quick scan: Every 15 minutes (`skipCouncil=true`).
  - Deep council debate: Every 6 hours.

---

### Phase 5: Monitoring & Observability (پایش و رویت‌پذیری سیستم)
- [ ] OpenTelemetry trace exporter URL configured or local console exporter verified.
- [ ] Admin Cockpit accessible at `/admin/autopilot` with role-based access control (`ADMIN` or `SUPERADMIN` only).
- [ ] Public Status page active at `/status/autopilot`.
- [ ] Command Palette accessible via `Cmd+K` / `Ctrl+K`.

---

### Phase 6: Emergency Drill (مانور قطع اضطراری)
- [ ] Test Global Kill Switch activation via CLI / UI:
  - Activate -> verify subsequent cycle dispatches are blocked.
  - Deactivate with signed reason -> verify normal execution resumes.
- [ ] Confirm audit log persists every operator intervention with IP and timestamp.

---

### Sign-off (تأیید نهایی)
- **Deployment Engineer:** ____________________
- **Security Lead:** ____________________
- **Date & Time:** ____________________
