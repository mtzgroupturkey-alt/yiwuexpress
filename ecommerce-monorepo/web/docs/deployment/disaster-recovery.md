# Auto-Pilot Disaster Recovery & Continuity Plan

## 1. Failure Scenarios & Recovery Procedures

### Scenario A: Database Corruption or Data Loss
1. **Immediate Step:** Halt PM2 application: `pm2 stop yiwuexpress-web`
2. **Restore:** Restore from the latest compressed snapshot:
   ```bash
   gunzip -c /var/backups/autopilot/autopilot_backup_YYYYMMDD.sql.gz | psql "$DATABASE_URL"
   ```
3. **Verify:** Check cryptographic audit chain integrity:
   ```bash
   curl -X POST http://localhost:3001/api/autopilot/audit/verify
   ```
4. **Resume:** Restart application: `pm2 start yiwuexpress-web`

---

### Scenario B: Auto-Pilot Runaway or Unexpected Actions
1. **Emergency Halting:** Trigger Global Kill Switch:
   - Via Telegram Bot: Send `/kill`
   - Via CLI: `npm run autopilot:kill`
   - Via UI: Red emergency button on Cockpit (`/admin/autopilot/settings`)
2. **Compensating Rollback:**
   - Review recent executed actions in Approvals page (`/admin/autopilot/approvals?status=EXECUTED`).
   - Click "Rollback" on affected actions to execute inverse operational compensating transactions.

---

### Scenario C: Redis Failure / Connection Drop
- Auto-Pilot is equipped with automatic seamless **In-Memory Fallback**.
- If Redis is down, pub/sub and deduplication seamlessly switch to local process memory with zero crashes or downtime.
- Restart Redis service: `sudo systemctl restart redis-server`.

---

### Scenario D: LLM Provider Outage
- Auto-Pilot's Cost Guard and Model Selector automatically fall back across providers:
  - Gemini 2.5 Flash -> DeepSeek V3 -> Z.ai -> Deterministic Analyst Model.
- If all LLM APIs are unreachable, Auto-Pilot defaults to single deterministic rule-based analysis with zero crashes.
