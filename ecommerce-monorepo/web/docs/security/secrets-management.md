# Auto-Pilot Secrets Management & Hygiene Guide

## 1. Secrets Inventory

| Environment Variable | Description | Recommended Length | Rotation Frequency | Leak Impact |
|---|---|---|---|---|
| `JWT_SECRET` | Session signing secret for user & admin authentication | >= 32 characters (256-bit random hex) | 90 days | High (Session forgery) |
| `WEBHOOK_HMAC_SECRET` | Shared secret for incoming webhook validation | >= 24 characters | 90 days | Medium (Forged event injection) |
| `TELEGRAM_BOT_TOKEN` | Token issued by Telegram BotFather | Standard API format | As needed | Medium (Telegram bot impersonation) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret token verified on Telegram webhook headers | >= 16 characters | 90 days | Low (Telegram command spoofing) |
| `SLACK_SIGNING_SECRET` | Secret for verifying Slack slash commands | Standard Slack secret | 90 days | Low (Slack command spoofing) |
| `DATABASE_URL` | PostgreSQL connection string | Standard connection URL | 180 days | Critical (Direct DB compromise) |

---

## 2. Secrets Health Audit Endpoint
To inspect the health and length sufficiency of your configured secrets without exposing raw values, call:
```http
GET /api/autopilot/health/secrets
```
This returns:
```json
{
  "status": "healthy",
  "secretsAudited": 9,
  "results": [
    {
      "name": "JWT_SECRET",
      "configured": true,
      "required": true,
      "status": "SECURE",
      "lengthWarning": null
    }
  ]
}
```

---

## 3. Emergency Leak Response Protocol
If any secret is suspected of being compromised:
1. **Activate Global Kill Switch immediately** via Cockpit (`/admin/autopilot/settings`) or Telegram (`/kill`) to halt autonomous action executions.
2. Rotate the leaked secret in production `.env` / secret manager.
3. Restart PM2 processes (`pm2 restart yiwuexpress-web`).
4. Review the SHA-256 Audit Trail (`/admin/autopilot/audit`) to verify whether any illegitimate actions were executed during the exposure window.
5. Deactivate the Kill Switch once validated.
