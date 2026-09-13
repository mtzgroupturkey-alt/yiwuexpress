# 🖥️ Dromkok Server - Complete Information

## 🔐 SSH Connection

```bash
ssh djdn@39.175.57.2 -p 22
```

| Parameter | Value |
|-----------|-------|
| IP Address | 39.175.57.2 |
| Username | djdn |
| Password | [Your SSH Password] |
| Port | 22 |

---

## 🗄️ Database (PostgreSQL)

### Connection Information

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | ecommerce |
| Username | ecommerce |
| Password | ecommerce123 |
| Admin User | postgres |
| Admin Password | NewPassword@123 |

### Connection String
```
postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce
```

### Connect to Database

```bash
# Regular user
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432

# Admin user  
/www/server/pgsql/bin/psql -U postgres -d postgres -h localhost -p 5432
```

---

## 📂 Project Paths

| Path | Description |
|------|-------------|
| `/www/wwwroot/www.dromkok.com/` | Project root |
| `/www/wwwroot/www.dromkok.com/web/` | Next.js app directory |
| `/www/server/pgsql/` | PostgreSQL installation |
| `/www/server/nginx/` | Nginx installation |
| `/www/server/panel/vhost/nginx/` | Nginx configs |

---

## 📦 Project Information

| Parameter | Value |
|-----------|-------|
| Framework | Next.js 14 (App Router) |
| ORM | Prisma 6.0.0 |
| Package Manager | npm |
| Node Version | v20.11.1 (recommend upgrade to v22) |
| Dev Port | 3001 |
| Prod Port | 3001 (proxied by Nginx) |
| PM2 App Name | dromkok-web |

### Management Commands

```bash
cd /www/wwwroot/www.dromkok.com/web

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Update database schema
npx prisma db push

# Build project
npm run build

# Restart with PM2
pm2 restart dromkok-web
```

---

## 🌐 Domain & Web Server

| Parameter | Value |
|-----------|-------|
| Domain | www.dromkok.com |
| SSL | Active (Let's Encrypt) |
| Nginx Path | /www/server/nginx/ |
| Nginx Config | /www/server/panel/vhost/nginx/node_web.conf |

### Nginx Commands

```bash
# Test config
sudo /www/server/nginx/sbin/nginx -t

# Reload
sudo /www/server/nginx/sbin/nginx -s reload
```

---

## 🔑 Site Users (Default)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dromkok.com | Admin123! |
| Test User | test@dromkok.com | 123456 |

---

## 🚀 Useful Commands (All-in-One)

### Connect to Server
```bash
ssh djdn@39.175.57.2 -p 22
```

### Connect to Database
```bash
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432
```

### Full Project Restart
```bash
cd /www/wwwroot/www.dromkok.com/web
pm2 restart dromkok-web
sudo /www/server/nginx/sbin/nginx -s reload
```

### View Logs
```bash
# PM2 logs
pm2 logs dromkok-web --lines 50

# Nginx error log
sudo tail -50 /www/server/nginx/logs/error.log
```

### Update Database Schema
```bash
cd /www/wwwroot/www.dromkok.com/web
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma db push
```

---

## ⚠️ Security Notes

| Item | Status | Recommendation |
|------|--------|----------------|
| PostgreSQL Password | ecommerce123 (weak) | Change to strong password |
| JWT Secret | Set in .env.production | Keep secure |
| SSL | Active | Keep updated |
| SSH | Password-based | Consider SSH keys |

---

## 🔄 GitHub Deployment

| Parameter | Value |
|-----------|-------|
| Repository | mtzgroupturkey-alt/dromkok |
| Branch | production |
| Workflow | .github/workflows/deploy.yml |

### Required Secrets

| Secret Name | Value |
|-------------|-------|
| SERVER_HOST | 39.175.57.2 |
| SERVER_USER | djdn |
| SERVER_PASSWORD | [Your SSH Password] |
| SERVER_PORT | 22 |
| DATABASE_URL | postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce |
| GH_USERNAME | mtzgroupturkey-alt |
| GH_TOKEN | [GitHub Token] |

---

## 📊 Quick Health Check

```bash
# Connect to server
ssh djdn@39.175.57.2 -p 22

# Check PM2 status
pm2 status

# Check Nginx
sudo /www/server/nginx/sbin/nginx -t

# Check PostgreSQL
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -c "SELECT version();"

# Check disk space
df -h

# Check site
curl http://localhost:3001
```

---

## 🔧 Database Operations

### Backup Database
```bash
/www/server/pgsql/bin/pg_dump -U ecommerce -h localhost -p 5432 ecommerce > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
/www/server/pgsql/bin/psql -U ecommerce -h localhost -p 5432 ecommerce < backup_file.sql
```

### Connect and Query
```bash
# Connect
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -h localhost -p 5432

# Inside psql:
\dt              # List tables
\d products      # Describe products table
SELECT COUNT(*) FROM products;
\q              # Exit
```

---

## 🛠️ Troubleshooting

### PM2 Not Running
```bash
cd /www/wwwroot/www.dromkok.com/web
pm2 start npm --name "dromkok-web" -- run start
pm2 save
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Restart PostgreSQL (if needed)
sudo systemctl restart postgresql
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check if port 3001 is listening
netstat -tulpn | grep 3001

# Restart PM2
pm2 restart dromkok-web
```

### Build Errors
```bash
cd /www/wwwroot/www.dromkok.com/web
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

---

## 📝 Environment Variables

Your `.env.production` should have:

```env
NODE_ENV=production
DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
JWT_SECRET="your-64-character-random-secret"
NEXT_PUBLIC_API_URL="https://www.dromkok.com"
NEXT_PUBLIC_SITE_URL="https://www.dromkok.com"
```

---

## 🎯 Migration from Localhost

**Important Notes:**
- Your **localhost** uses **MySQL** (WAMP)
- Your **production** uses **PostgreSQL**
- Database type conversion is needed!

### Option 1: Use Prisma (Recommended)
```bash
# After deploying files, use Prisma to recreate schema
cd /www/wwwroot/www.dromkok.com/web
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma db push --accept-data-loss
```

### Option 2: Use pgloader (Advanced)
```bash
# Install pgloader
sudo apt install pgloader

# Convert MySQL to PostgreSQL
pgloader mysql://root@localhost/yiwuexpress postgresql://ecommerce:ecommerce123@localhost/ecommerce
```

---

## 📋 Quick Reference Card

**Connect:** `ssh djdn@39.175.57.2`

**Database:** `postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce`

**Project:** `/www/wwwroot/www.dromkok.com/web`

**Restart:** `pm2 restart dromkok-web`

**Logs:** `pm2 logs dromkok-web`

**Site:** https://www.dromkok.com

---

**Last Updated:** 2026-09-02
