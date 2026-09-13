# 🚀 START HERE - Deploy Localhost to Dromkok.com

## You Have 2 Options

---

## Option 1: Automated Script (Recommended) ⚡

### Step 1: Edit the Script (1 minute)

Open `deploy-to-dromkok.ps1` and find line 9:

```powershell
[string]$MySQLPassword = ""
```

Change it to:
```powershell
[string]$MySQLPassword = "your_actual_mysql_password"
```

Save the file.

### Step 2: Run the Script

**Right-click PowerShell → Run as Administrator:**

```powershell
cd c:\wamp64\www\yiwuexpress
.\deploy-to-dromkok.ps1
```

Type `yes` when asked, then wait 30-60 minutes.

**That's it!** The script will:
- ✅ Export your local database
- ✅ Archive all project files
- ✅ Upload to server
- ✅ Backup current production
- ✅ Import database
- ✅ Extract files
- ✅ Build and restart app

---

## Option 2: Manual Process (What You Do Now) 🔧

This is your current workflow - keep using it if you prefer:

```bash
# 1. Connect
ssh djdn@39.175.57.2 -p 22

# 2. Cleanup old
cd /www/wwwroot/www.dromkok.com/web
sudo rm -rf /www/wwwroot/www.dromkok.com/yiwuexpress

# 3. Clone from GitHub
sudo git clone http://github.com/mtzgroupturkey-alt/yiwuexpress.git
cd yiwuexpress/ecommerce-monorepo

# 4. Remove old folders
sudo rm -rf /www/wwwroot/www.dromkok.com/docker
sudo rm -rf /www/wwwroot/www.dromkok.com/mobile
sudo rm -rf /www/wwwroot/www.dromkok.com/web

# 5. Move files
sudo mv * /www/wwwroot/www.dromkok.com/
sudo mv .* /www/wwwroot/www.dromkok.com/ 2>/dev/null

# 6. Cleanup and build
cd /www/wwwroot/www.dromkok.com/
sudo rm -rf yiwuexpress
cd web
sudo chown -R $(whoami):$(whoami) .
npm install
npm run build

# 7. Restart
pm2 restart all
```

**Note:** This method deploys from GitHub, not from your localhost. To include localhost changes, you must first:
```bash
cd c:\wamp64\www\yiwuexpress
git add .
git commit -m "update"
git push origin main
```

---

## Which Should You Use?

| Feature | Automated Script | Manual Process |
|---------|------------------|----------------|
| **Includes localhost files** | ✅ Yes | ❌ No (GitHub only) |
| **Includes local database** | ✅ Yes | ❌ No |
| **Automatic backup** | ✅ Yes | ❌ No |
| **Time required** | 5 min setup + auto | 10-15 min manual |
| **Rollback capability** | ✅ Easy | Manual restore |
| **Skip if files unchanged** | Can skip | Can skip |

**Use Automated if:** You want to copy everything from localhost (files + database)

**Use Manual if:** You just want to pull latest code from GitHub

---

## After Migration - Check These

### 1. Verify Site (2 minutes)
```
Visit: https://www.dromkok.com
Test: Login, browse products, check admin
```

### 2. Check Server (1 minute)
```bash
ssh djdn@39.175.57.2
pm2 status        # Should say "online"
pm2 logs          # Check for errors
```

### 3. Update .env if Needed (5 minutes)
```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
nano .env
# Update DATABASE_URL, JWT_SECRET, API URLs
pm2 restart all
```

---

## Need Help?

| Problem | Solution |
|---------|----------|
| Script won't run | See `MIGRATION_GUIDE.md` → Prerequisites |
| Site not loading | `ssh djdn@39.175.57.2` then `pm2 logs` |
| Database errors | See `YOUR_SERVER_GUIDE.md` → Database Commands |
| Want to rollback | See `YOUR_SERVER_GUIDE.md` → Rollback |

---

## Quick Commands

```bash
# Connect to server
ssh djdn@39.175.57.2

# Check status
pm2 status

# View logs
pm2 logs

# Restart
pm2 restart all

# Test site
curl https://www.dromkok.com
```

---

## All Your Files

📄 `START_HERE.md` ← You are here
📄 `deploy-to-dromkok.ps1` ← Automated script
📄 `YOUR_SERVER_GUIDE.md` ← Server commands & troubleshooting
📄 `MIGRATION_GUIDE.md` ← Complete detailed guide
📄 `MIGRATION_CHECKLIST.md` ← Step-by-step checklist
📄 `QUICK_MIGRATION_STEPS.md` ← 5-minute quick ref

---

## Ready? Choose Your Path:

### 🚀 Automated Migration
```powershell
# Edit deploy-to-dromkok.ps1 (add MySQL password)
# Then run:
.\deploy-to-dromkok.ps1
```

### 🔧 Manual GitHub Deploy
```bash
# Push changes first (if any):
git add .
git commit -m "update"
git push

# Then run manual commands from Option 2 above
```

---

**Tip:** Try the automated script - it's safer (automatic backups) and includes your local database!
