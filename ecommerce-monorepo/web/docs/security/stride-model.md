# Auto-Pilot STRIDE Threat Model

**System:** Yiwu Express Auto-Pilot Autonomous Business Engine  
**Version:** 1.0.0 Production Candidate  
**Date:** 2026-10-04  

---

## 1. Threat Matrix

| STRIDE Category | Threat Scenario | Primary Mitigation | Residual Risk | Risk Level |
|---|---|---|---|---|
| **Spoofing** | Attacker transmits crafted webhooks simulating payment disputes or customs delays | Constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) on all webhook endpoints | Secret key compromise if `.env` is leaked | Low |
| **Spoofing** | Attacker sends unauthorized Telegram bot commands | Secret token verification on webhook header (`x-telegram-bot-api-secret-token`) + Telegram username authorization | Telegram bot token leakage | Low |
| **Tampering** | Rogue actor or attacker modifies an executed audit log entry in the database | SHA-256 hash chaining (`previousHash` -> `hash`) detects sequence breaks instantly via cryptographic verification | Database write access by rogue DB superuser | Very Low |
| **Tampering** | Attacker submits malicious YAML rule to execute unauthorized code | Strict Zod validation on YAML schema; Zero `eval()` or Function execution; Whitelisted action registry only | None (Arbitrary code execution prevented by design) | None |
| **Repudiation** | Operator claims they did not approve a high-impact financial action | Every approval records operator identity, IP, exact timestamp, and signed audit event in immutable trail | Shared administrative credentials | Low |
| **Information Disclosure** | Sensitive customer data or payment details leak into telemetry or logs | Automatic PII scrubber (`redactSensitiveData`) in structured logger masks emails, cards, and secret tokens | Zero-day regex bypass on exotic PII formats | Very Low |
| **Information Disclosure** | Business revenue and margins exposed via unauthenticated endpoints | Prometheus metrics and internal health routes require authenticated reverse proxy or internal network | Misconfigured reverse proxy | Low |
| **Denial of Service** | Webhook flooding causes cycle storms and overwhelms system | 30-minute full cycle cooldown per source; 5-minute Redis event deduplication; Generic IP rate limiting | Temporary webhook queue backlog under massive DDoS | Low |
| **Denial of Service** | LLM runaway inference burns entire company cloud budget | 3-tier Cost Guard enforces hard limit at 100% and absolute halt at 150% ($5.00/day default limit) | External model provider billing discrepancies | Very Low |
| **Elevation of Privilege** | Normal user triggers autonomous business action directly | All action executions are gated through backend `resolveApproval` which enforces administrative credentials | Stolen admin JWT session | Low |

---

## 2. Residual Risk Management
1. **Secret Rotation Policy**: Webhook HMAC secrets and JWT secrets must be rotated every 90 days.
2. **Double Confirmation**: Sensitive actions (Kill Switch activation, manual rollback) require mandatory reason inputs.
3. **Dead-Man Switch**: If no cycle runs for >12 hours or a cycle runs for >30 minutes, automatic escalations alert operators.
