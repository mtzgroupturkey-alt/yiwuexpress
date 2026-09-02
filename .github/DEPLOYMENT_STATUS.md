# Deployment Status & Health Check

## Current Deployment Configuration

- **Production URL:** https://www.dromkok.com
- **Branch:** `production` or `main`
- **Deploy Method:** GitHub Actions → SSH
- **Server Path:** `/www/wwwroot/www.dromkok.com/web`
- **Process Manager:** PM2
- **Web Server:** Nginx

---

## Deployment Health Checklist

### ✅ Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build completes without errors
- [ ] Code reviewed and approved

### ✅ During Deployment
- [ ] GitHub Actions workflow succeeds
- [ ] Git fetch/clone completes
- [ ] Dependencies install successfully
- [ ] Prisma generates client
- [ ] Next.js build completes
- [ ] PM2 process restarts
- [ ] Health check returns 200

### ✅ Post-Deployment
- [ ] Site loads at https://www.dromkok.com
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] No errors in PM2 logs
- [ ] No errors in Nginx logs
- [ ] SSL certificate valid

---

## Quick Health Checks

### From Local Machine
```bash
# Test site is live
curl -I https://www.dromkok.com

# Test API health endpoint
curl https://www.dromkok.com/api/health

# Test with timing
curl -w "@-" -o /dev/null -s "https://www.dromkok.com" <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
         HTTP Code:  %{http_code}\n
EOF
```

### From Production Server
```bash
# SSH into server
ssh user@your-server.com

# Check PM2 status
pm2 status

# View recent logs
pm2 logs dromkok-web --lines 50 --nostream

# Check Node.js process
ps aux | grep node

# Check port 3001
netstat -tulpn | grep 3001
# or
ss -tulpn | grep 3001

# Test local health
curl http://localhost:3001/api/health

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top -bn1 | head -20
```

---

## Recent Deployment Issues

### Issue: Git TLS Error (Fixed ✅)
- **Date:** 2026-09-02
- **Error:** `GnuTLS recv error (-110): The TLS connection was non-properly terminated`
- **Fix:** Added retry logic, TLS configuration, and fallback strategies
- **Status:** Resolved in workflow update

### Mitigation Steps Taken:
1. ✅ Updated deployment workflow with retry logic
2. ✅ Added git TLS configuration
3. ✅ Created manual deployment script
4. ✅ Created diagnostic script
5. ✅ Documented troubleshooting steps

---

## Deployment Commands

### Trigger Manual Deployment
```bash
# Method 1: Push to trigger GitHub Actions
git push origin main

# Method 2: Manual workflow dispatch
# Go to: https://github.com/mtzgroupturkey-alt/dromkok/actions
# Click: "Deploy to Production" → "Run workflow"

# Method 3: SSH and run manual script
ssh user@server
cd /www/wwwroot/www.dromkok.com/web
./deploy-manual.sh
```

### Emergency Rollback
```bash
# SSH into server
ssh user@server
cd /www/wwwroot/www.dromkok.com/web

# Option 1: Git rollback
git log --oneline -10  # Find previous commit
git reset --hard <commit-hash>
npm install && npm run build
pm2 restart all

# Option 2: Restore from backup
cd ..
ls -la | grep backup  # Find backup directory
rm -rf web
mv web_backup_TIMESTAMP web
cd web
pm2 restart all
```

### View Deployment History
```bash
# GitHub Actions history
# https://github.com/mtzgroupturkey-alt/dromkok/actions

# Server git history
ssh user@server
cd /www/wwwroot/www.dromkok.com/web
git log --oneline -20

# PM2 restart history
pm2 prettylist
```

---

## Monitoring & Alerts

### Current Monitoring
- GitHub Actions email notifications (on failure)
- PM2 process monitoring
- Nginx access/error logs

### Recommended Additions
1. **Uptime Monitoring:**
   - UptimeRobot (free, 5-minute checks)
   - Pingdom
   - Better Uptime

2. **Error Tracking:**
   - Sentry (free tier)
   - LogRocket
   - Rollbar

3. **Performance Monitoring:**
   - New Relic
   - DataDog
   - AppDynamics

4. **Server Monitoring:**
   - Netdata (open source)
   - Prometheus + Grafana
   - CloudWatch (if on AWS)

---

## Performance Metrics

### Target Metrics
- **Page Load Time:** < 2 seconds
- **API Response Time:** < 200ms
- **Time to First Byte:** < 600ms
- **Uptime:** > 99.9%
- **Build Time:** < 5 minutes
- **Deployment Time:** < 10 minutes

### Current Performance
Run performance test:
```bash
# From local machine
curl -w "@-" -o /dev/null -s "https://www.dromkok.com" <<'EOF'
Time to First Byte: %{time_starttransfer}s
Total Time: %{time_total}s
HTTP Code: %{http_code}
EOF
```

---

## Troubleshooting Resources

| Issue | Solution File |
|-------|--------------|
| Git TLS errors | `QUICK_FIX.md` |
| Detailed troubleshooting | `DEPLOYMENT_TROUBLESHOOTING.md` |
| Manual deployment | `deploy-manual.sh` |
| Server diagnostics | `diagnose-git-tls.sh` |
| GitHub Actions logs | [Actions Tab](https://github.com/mtzgroupturkey-alt/dromkok/actions) |

---

## Contact & Escalation

### Deployment Issues
1. Check GitHub Actions logs
2. SSH into server and check PM2 logs
3. Review `DEPLOYMENT_TROUBLESHOOTING.md`
4. Run diagnostic script if network issues
5. Use manual deployment script if automated fails

### Server Issues
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs --lines 100`
3. Check Nginx: `sudo nginx -t && sudo systemctl status nginx`
4. Check disk: `df -h`
5. Contact hosting provider if hardware/network issue

### Emergency Contacts
- **Server Host:** [Your hosting provider]
- **Domain Registrar:** [Your domain provider]
- **SSL Provider:** Let's Encrypt (auto-renew via Certbot)

---

## Last Updated
- **Date:** 2026-09-02
- **By:** AI Assistant
- **Changes:** Fixed Git TLS error, added retry logic and fallbacks
