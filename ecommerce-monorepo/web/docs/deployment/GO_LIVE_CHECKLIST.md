# Auto-Pilot Production Go-Live Master Checklist
**Target Host:** Ubuntu 24.04 LTS (Linux, 64-bit) | **Target Domain:** `dromkok.com`  
**Generated:** October 4, 2026 | **Version:** 1.0.0

---

## 1. Server Provisioning Steps (راه‌اندازی سرور)
- [ ] Provision Ubuntu 24.04 LTS VPS with minimum 4GB RAM, 2 vCPUs, and 50GB NVMe storage.
- [ ] Configure non-root sudo user (`deployer`) and disable password-based SSH authentication (`PasswordAuthentication no`).
- [ ] Update APT repositories and install core runtime dependencies:
  ```bash
  sudo apt-get update && sudo apt-get upgrade -y
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs git nginx redis-server postgresql-client certbot python3-certbot-nginx
  ```
- [ ] Verify installed runtimes:
  - Node.js >= 24 (`node -v`)
  - Redis >= 7 (`redis-server -v` and `redis-cli ping -> PONG`)
  - PostgreSQL client >= 15 (`psql --version`)

---

## 2. Database Migration Procedure (پایگاه داده)
- [ ] Verify managed PostgreSQL 15/16 instance connectivity with SSL enabled.
- [ ] Backup existing database prior to deployment:
  ```bash
  pg_dump "$DATABASE_URL" -F c -b -v -f /var/backups/pre_autopilot_$(date +%Y%m%d_%H%M%S).dump
  ```
- [ ] Synchronize schema & apply Prisma migrations in CI/CD pipeline:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```
- [ ] Verify schema drift status:
  ```bash
  npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
  # Expected: "-- This is an empty migration."
  ```

---

## 3. Environment Setup (متغیرهای محیطی)
Deploy `.env.production` containing all required configuration items:
- [ ] `DATABASE_URL` (SSL enabled, max connection pool 15-20)
- [ ] `JWT_SECRET` (>= 32 random characters generated via `openssl rand -hex 32`)
- [ ] `NEXTAUTH_SECRET` (>= 32 random characters)
- [ ] `AUTOPILOT_WEBHOOK_SECRET` (HMAC SHA-256 webhook ingestion secret)
- [ ] `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` (authorized operations group)
- [ ] `TELEGRAM_WEBHOOK_SECRET` (X-Telegram-Bot-Api-Secret-Token)
- [ ] `GEMINI_API_KEY` (production quota enabled)
- [ ] `AUTOPILOT_DAILY_BUDGET_USD=5.00` (soft budget ceiling)
- [ ] `REDIS_URL=redis://localhost:6379` (rate limiting & token bucket)
- [ ] Verify security status: `curl http://localhost:3001/api/autopilot/health/secrets` returns `status: "healthy"`.

---

## 4. PM2 Process Manager Configuration (مدیریت پردازه‌ها)
- [ ] Install PM2 globally: `sudo npm install -g pm2`
- [ ] Start application in cluster mode:
  ```bash
  pm2 start npm --name "yiwuexpress-web" -- start -- -p 3001
  pm2 save
  pm2 startup
  ```
- [ ] Verify logs & memory footprint:
  ```bash
  pm2 status
  pm2 logs yiwuexpress-web --lines 50
  ```

---

## 5. Nginx + SSL Setup (پراکسی و گواهی امنیتی)
- [ ] Deploy Nginx site configuration to `/etc/nginx/sites-available/dromkok.com` with reverse proxy to `127.0.0.1:3001`.
- [ ] Enable SSE stream support for `/api/autopilot/cycles/` (`proxy_buffering off; chunked_transfer_encoding off;`).
- [ ] Obtain Let's Encrypt TLS certificate:
  ```bash
  sudo certbot --nginx -d dromkok.com -d www.dromkok.com --non-interactive --agree-tos -m admin@dromkok.com
  ```
- [ ] Test and reload Nginx:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

---

## 6. Monitoring Setup (پایش سیستم)
- [ ] Verify Prometheus endpoint: `curl -s https://dromkok.com/api/autopilot/metrics`.
- [ ] Configure uptime ping to `https://dromkok.com/api/autopilot/health`.
- [ ] Verify Admin Cockpit accessibility at `https://dromkok.com/admin/autopilot` (role restricted to `ADMIN` / `SUPERADMIN`).

---

## 7. First Cycle Test (تست اولین چرخه)
- [ ] Execute initial dry-run cycle via API:
  ```bash
  curl -X POST https://dromkok.com/api/autopilot/cycles \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -d '{"trigger":"manual","dryRun":true,"skipCouncil":true}'
  ```
- [ ] Confirm cycle status in Cockpit transitions to `COMPLETED` within < 500ms.
- [ ] Verify zero database side-effects during dry run.

---

## 8. Week 1 Observation Checklist (پایش هفته اول)
- [ ] **Day 1:** Run in `dryRun: true` mode exclusively. Review Council consensus quality in War Room.
- [ ] **Day 2-3:** Monitor token usage and daily expenditure in Cost Guard gauge (< $0.05/day target).
- [ ] **Day 4:** Verify automated low-risk actions (`check_carrier_status`, `escalate_support_queue`) work without latency spikes.
- [ ] **Day 5-7:** Confirm Telegram bot alerts deliver properly to the operations channel.

---

## 9. Rollback Procedure (دستورالعمل بازگردانی اضطراری)
If unexpected behavior, budget spikes, or operational errors occur:
1. **Instant Action Cutoff:**
   ```bash
   curl -X POST https://dromkok.com/api/autopilot/kill/activate \
     -H "Content-Type: application/json" \
     -d '{"scope":"global","reason":"Emergency Rollback Drill","actor":"admin:cli"}'
   ```
2. **Revert Actions via History:**
   Access `/admin/autopilot` -> Action Approvals -> Click **Rollback** on affected actions.
3. **Application Reversion:**
   ```bash
   pm2 restart yiwuexpress-web --update-env
   ```
