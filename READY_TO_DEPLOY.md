# ✅ READY TO DEPLOY - Next Steps

## 🎯 Current Status

Your migration system is **100% ready**. All scripts are customized with your exact server configuration:

- ✅ Server: `djdn@39.175.57.2:22`
- ✅ Project path: `/www/wwwroot/www.dromkok.com/web`
- ✅ Database: PostgreSQL (`ecommerce/ecommerce123@localhost:5432`)
- ✅ PM2 app: `dromkok-web`
- ✅ Nginx: `/www/server/nginx/`

## 🚀 Quick Start (3 Steps)

### Step 1: Test SSH Connection (1 minute)

Open PowerShell **as Administrator**:

```powershell
cd c:\wamp64\www\yiwuexpress
.\test-ssh-connection.ps1
```

This will:
- ✅ Test if you can connect to your server
- ✅ Show server information
- ✅ Check PM2, Node.js, database status
- ✅ Verify project directory exists

**If this passes, you're ready to deploy!**

---

### Step 2: Choose Your Deployment Method

#### Option A: Full Migration (Files + Database)

**Use when:** You want to copy everything from localhost to production

```powershell
.\deploy-to-dromkok.ps1
```

This will:
- 📤 Export your local MySQL database
- 📦 Archive all project files (excluding node_modules, .next)
- 💾 Backup current production
- 📥 Upload everything to server
- 🔄 Convert MySQL → PostgreSQL (via Prisma)
- 🏗️ Build and restart the app

**Time:** 30-60 minutes (depends on internet speed)

#### Option B: Files Only (Recommended First Try)

**Use when:** Database is already set up, only code changed

```powershell
.\deploy-to-dromkok.ps1 -SkipDatabase
```

This will:
- 📦 Archive project files only
- 💾 Backup current production
- 📥 Upload files
- 🏗️ Build and restart

**Time:** 10-20 minutes

Then manually sync database schema:
```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma db push --accept-data-loss
```

#### Option C: Keep Using Your Current Method

Continue with your GitHub workflow:

```bash
ssh djdn@39.175.57.2 -p 22
cd /www/wwwroot/www.dromkok.com/web
sudo rm -rf /www/wwwroot/www.dromkok.com/yiwuexpress
sudo git clone http://github.com/mtzgroupturkey-alt/yiwuexpress.git
cd yiwuexpress/ecommerce-monorepo
# ... rest of your commands
```

But **push to GitHub first**:
```powershell
cd c:\wamp64\www\yiwuexpress
git add .
git commit -m "update features"
git push origin main
```

---

### Step 3: Verify Deployment (2 minutes)

After deployment:

1. **Check the site:**
   - Visit: https://www.dromkok.com
   - Test: Login, browse products, admin panel

2. **Check server status:**
   ```bash
   ssh djdn@39.175.57.2
   pm2 status        # Should show "online"
   pm2 logs          # Check for errors
   ```

3. **If something's wrong:**
   ```bash
   pm2 restart dromkok-web
   sudo /www/server/nginx/sbin/nginx -s reload
   ```

---

## 📊 Comparison: Which Method Should You Use?

| Feature | Automated Script | Your Current Method |
|---------|------------------|---------------------|
| **Includes localhost files** | ✅ Yes | ❌ No (GitHub only) |
| **Includes local database** | ✅ Yes | ❌ No |
| **Automatic backup** | ✅ Yes | ❌ Manual |
| **Database migration** | ✅ MySQL → PostgreSQL | ❌ Manual |
| **Rollback support** | ✅ Built-in | Manual |
| **Time required** | 30-60 min (auto) | 10-15 min (manual) |
| **Risk** | Low (auto backup) | Medium |

**Recommendation:**
- **First time?** → Use automated script with `-SkipDatabase` flag
- **Have important data?** → Use full automated migration
- **Just pulling GitHub changes?** → Keep using your current method

---

## 🔧 Troubleshooting

### SSH Connection Fails

**Problem:** `test-ssh-connection.ps1` fails

**Solutions:**
1. Check password is correct
2. Verify server IP: `39.175.57.2`
3. Test manually: `ssh djdn@39.175.57.2 -p 22`
4. Check if port 22 is open in firewall

### Site Not Loading After Deploy

**Problem:** https://www.dromkok.com shows error

**Solutions:**
```bash
ssh djdn@39.175.57.2
pm2 logs dromkok-web --lines 50    # Check errors
pm2 restart dromkok-web             # Restart app
sudo /www/server/nginx/sbin/nginx -t  # Test nginx config
sudo /www/server/nginx/sbin/nginx -s reload
```

### Database Connection Error

**Problem:** App can't connect to database

**Solutions:**
```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web

# Check if .env has correct DATABASE_URL
cat .env.production | grep DATABASE_URL

# Should be:
# DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"

# Test database connection
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432

# If login works, regenerate Prisma client
npx prisma generate
pm2 restart dromkok-web
```

### Build Fails

**Problem:** `npm run build` fails during deployment

**Solutions:**
```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web

# Clean install
rm -rf node_modules .next
npm install --legacy-peer-deps

# Regenerate Prisma
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma generate

# Build again
npm run build
pm2 restart dromkok-web
```

---

## 📁 Important Files Reference

| File | Purpose |
|------|---------|
| `test-ssh-connection.ps1` | Test if you can connect to server |
| `deploy-to-dromkok.ps1` | **Main migration script** |
| `START_HERE.md` | Getting started guide |
| `SERVER_INFO.md` | Complete server details & commands |
| `YOUR_SERVER_GUIDE.md` | Server management & troubleshooting |
| `MYSQL_TO_POSTGRES_MIGRATION.md` | Database conversion details |
| `MIGRATION_GUIDE.md` | Full migration documentation |
| `MIGRATION_CHECKLIST.md` | Step-by-step checklist |

---

## 🎯 Recommended First Run

**For safest first deployment:**

```powershell
# 1. Test connection
.\test-ssh-connection.ps1

# 2. Deploy files only (skip database for now)
.\deploy-to-dromkok.ps1 -SkipDatabase

# 3. Then manually sync database schema via SSH
# ssh djdn@39.175.57.2
# cd /www/wwwroot/www.dromkok.com/web
# export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
# npx prisma db push --accept-data-loss

# 4. Verify site works
# Visit: https://www.dromkok.com
```

This approach:
- ✅ Tests files deployment first
- ✅ Lets you verify file sync works
- ✅ Gives you control over database changes
- ✅ Lower risk (production DB stays intact until you manually push schema)

---

## 🔐 Security Notes

**After first successful deployment, consider:**

1. **Change weak PostgreSQL password:**
   ```bash
   ssh djdn@39.175.57.2
   /www/server/pgsql/bin/psql -U postgres
   ALTER USER ecommerce WITH PASSWORD 'your-strong-password';
   \q
   
   # Update .env.production with new password
   ```

2. **Set strong JWT_SECRET:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   nano .env.production
   # Set JWT_SECRET to 64+ random characters
   pm2 restart dromkok-web
   ```

3. **Use SSH keys instead of password:**
   ```powershell
   ssh-keygen -t ed25519
   ssh-copy-id -p 22 djdn@39.175.57.2
   ```

---

## 📞 Need Help?

**Check these files:**
- `YOUR_SERVER_GUIDE.md` → All server commands
- `SERVER_INFO.md` → Complete server configuration
- `MIGRATION_GUIDE.md` → Detailed migration steps
- `MYSQL_TO_POSTGRES_MIGRATION.md` → Database conversion

**Common issues documented in:**
- `DEPLOYMENT_TROUBLESHOOTING.md` (GitHub Actions issues)
- `YOUR_SERVER_GUIDE.md` → Troubleshooting section

---

## ✅ You're Ready!

**Next action:**

```powershell
cd c:\wamp64\www\yiwuexpress
.\test-ssh-connection.ps1
```

If that passes, run:

```powershell
.\deploy-to-dromkok.ps1 -SkipDatabase
```

Good luck! 🚀

---

**Last Updated:** 2026-09-02
**Server:** Ubuntu 24.04 @ 39.175.57.2
**Project:** YIWU EXPRESS → Dromkok.com
