# Auto-Pilot Frequently Asked Questions (FAQ)

### Q1: Can Auto-Pilot run away with cloud LLM costs?
**No.** Auto-Pilot incorporates a strict **3-tier Cost Guard**:
- At **80%** ($4.00 of $5.00 default daily budget): Emits a warning notification and adaptively downgrades model selection to lightweight models (`gemini-2.5-flash-lite`).
- At **100%** ($5.00 limit): Downgrades immediately to **Plan-Only Mode** (zero automated write actions allowed).
- At **150%** ($7.50): Freezes execution completely until daily budget reset.

### Q2: What happens if an external webhook attempts to spam cycles?
Auto-Pilot enforces a strict **30-minute full cycle cooldown** per source (`stripe`, `carrier`, `supplier`). Subsequent events during the cooldown window trigger isolated quick probes or are recorded for audit only, preventing cycle storms.

### Q3: How do operators stop Auto-Pilot in an emergency?
Any operator can engage the **Global Kill Switch** instantly:
- Via Telegram Bot: Send `/kill`
- Via Slack: Send `/autopilot kill`
- Via Cockpit UI: Click the red emergency button on `/admin/autopilot/settings`
- Via CLI: `npm run autopilot:kill`

### Q4: Does Auto-Pilot delete records on rollback?
**No.** Rollbacks never delete history. They execute inverse operational actions (e.g., releasing a reserved session, canceling a transfer) and append a forward-facing compensating audit event (`ACTION_ROLLED_BACK`) to maintain cryptographic chain integrity.

### Q5: Can Auto-Pilot operate if Redis is unavailable?
**Yes.** Auto-Pilot features an automatic in-memory fallback. If `REDIS_URL` is unconfigured or the Redis daemon fails, event distribution and deduplication seamlessly switch to local process memory without errors.

---

## سوالات متداول (Persian Summary)
- **آیا هزینه‌های مدل هوش مصنوعی ممکن است از کنترل خارج شود؟** خیر، نگهبان هزینه (Cost Guard) دارای محدودیت سخت‌گیرانه ۵ دلاری در روز است و با نزدیک شدن به سقف بودجه، مدل‌ها را به گزینه‌های اقتصادی تغییر می‌دهد.
- **چگونه در شرایط اضطراری سیستم متوقف می‌شود؟** با ارسال دستور `/kill` در تلگرام یا اسلک، یا کلیک روی دکمه قرمز داشبورد، کلیه فعالیت‌های خودکار درجا قفل می‌شوند.
- **آیا در صورت قطعی ردیس سیستم متوقف می‌شود؟** خیر، ردیس به صورت خودکار به حافظه رم محلی سوئیچ می‌کند و قطعی ایجاد نمی‌شود.
