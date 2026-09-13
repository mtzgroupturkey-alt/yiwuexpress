# 🚀 Quick Migration Steps

## For Busy People (5-Minute Setup, 30-Minute Run)

### 1️⃣ Edit Script (2 minutes)

Open `migrate-localhost-to-production.ps1` and update:

```powershell
$ProdServer = "123.456.789.0"           # Your server IP
$ProdUser = "root"                       # SSH username
$ProdDbPass = "your_secure_password"     # Production DB password
```

Save the file.

---

### 2️⃣ Run Script (30-60 minutes)

**PowerShell (Right-click → Run as Administrator):**
```powershell
cd c:\wamp64\www\yiwuexpress
.\migrate-localhost-to-production.ps1
```

**Or Git Bash:**
```bash
cd /c/wamp64/www/yiwuexpress
./migrate-localhost-to-production.sh
```

Type `yes` when prompted, then wait.

---

### 3️⃣ Update .env (5 minutes)

```bash
# SSH into server
ssh root@your-server-ip

# Edit environment
cd /www/wwwroot/www.dromkok.com/web
nano .env

# Update these:
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@localhost:5432/database"
JWT_SECRET="generate-64-character-random-string"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"

# Save: Ctrl+O, Enter, Ctrl+X
# Restart: pm2 restart all
```

---

### 4️⃣ Test (2 minutes)

Visit: **https://www.dromkok.com**

- [ ] Homepage loads
- [ ] Can browse products
- [ ] Can login
- [ ] Admin panel works

---

## Done! 🎉

### If It Works:
- Monitor for 24 hours
- Setup automated backups (see `MIGRATION_GUIDE.md`)

### If It Doesn't Work:
1. Check: `ssh root@server; pm2 logs`
2. See: `MIGRATION_GUIDE.md` → Troubleshooting
3. Rollback: `ssh root@server` then restore from `/www/backups/dromkok_backup_TIMESTAMP/`

---

## Essential Commands

```bash
# Check status
ssh root@server
pm2 status
pm2 logs

# Restart
pm2 restart all

# View database
mysql -u dromkok_user -p dromkok
> SHOW TABLES;

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## Emergency Rollback

```bash
ssh root@server
cd /www/wwwroot/www.dromkok.com
pm2 stop all
rm -rf web
cp -r /www/backups/dromkok_backup_LATEST/web .
cd web && pm2 restart all
```

---

## Files Created

- ✅ `migrate-localhost-to-production.ps1` - PowerShell script
- ✅ `migrate-localhost-to-production.sh` - Bash script
- ✅ `MIGRATION_GUIDE.md` - Detailed guide (50+ pages)
- ✅ `MIGRATION_CHECKLIST.md` - Step-by-step checklist
- ✅ `QUICK_MIGRATION_STEPS.md` - This file

**Read full guide if issues occur:** `MIGRATION_GUIDE.md`

---

**Ready? Update the script and run it!**

```powershell
.\migrate-localhost-to-production.ps1
```
