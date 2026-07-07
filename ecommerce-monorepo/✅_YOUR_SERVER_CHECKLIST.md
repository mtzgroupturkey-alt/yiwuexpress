# ✅ YOUR SERVER DEPLOYMENT - QUICK CHECKLIST

## You Have Server + Domain + PostgreSQL 18 → Perfect Setup!

---

## 🎯 COMPLETE THIS IN 45 MINUTES

### ☐ STEP 1: Server Prep (10 min)

```bash
# SSH into your server
ssh root@your-server-ip

# Install required software
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install nginx -y

# Create directory
sudo mkdir -p /var/www/yiwuexpress
sudo chown -R $USER:$USER /var/www/yiwuexpress
```

---

### ☐ STEP 2: Setup Database (5 min)

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE yiwuexpress;
CREATE USER yiwuadmin WITH ENCRYPTED PASSWORD 'PUT_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE yiwuexpress TO yiwuadmin;
\c yiwuexpress
GRANT ALL ON SCHEMA public TO yiwuadmin;
\q
```

**Save this:**
```
postgresql://yiwuadmin:YOUR_PASSWORD@localhost:5432/yiwuexpress
```

---

### ☐ STEP 3: Upload Code (10 min)

**Choose ONE method:**

**A) FTP/SFTP (Easiest)**
- Use FileZilla/WinSCP
- Upload `web` folder to `/var/www/yiwuexpress/`

**B) cPanel**
- Compress `web` folder
- Upload via File Manager
- Extract in domain folder

**C) Git**
```bash
cd /var/www/yiwuexpress
git clone YOUR_REPO_URL .
```

---

### ☐ STEP 4: Configure (5 min)

```bash
cd /var/www/yiwuexpress/web
nano .env
```

**Paste this (edit values):**
```env
DATABASE_URL="postgresql://yiwuadmin:YOUR_PASSWORD@localhost:5432/yiwuexpress"
JWT_SECRET="RUN_THIS_COMMAND_TO_GENERATE"
JWT_EXPIRES_IN="7d"
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
NEXT_PUBLIC_API_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### ☐ STEP 5: Install & Build (10 min)

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

---

### ☐ STEP 6: Start App (5 min)

```bash
pm2 start npm --name "yiwuexpress" -- start
pm2 save
pm2 startup
pm2 status
```

**Test:** `curl http://localhost:3001`

---

### ☐ STEP 7: Configure Nginx (10 min)

```bash
sudo nano /etc/nginx/sites-available/yiwuexpress
```

**Paste this (replace yourdomain.com):**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/yiwuexpress /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### ☐ STEP 8: Setup SSL (10 min)

**Point your domain first:**
- Go to domain registrar
- Add A record: `@` → `YOUR_SERVER_IP`
- Add A record: `www` → `YOUR_SERVER_IP`
- Wait 5-10 minutes

**Then install SSL:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts, choose redirect HTTP to HTTPS.

---

## 🎉 DONE! TEST YOUR SITE

Visit: **https://yourdomain.com**

**Login:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**⚠️ CHANGE PASSWORD IMMEDIATELY!**

---

## 🔧 DAILY COMMANDS

```bash
# Restart app
pm2 restart yiwuexpress

# View logs
pm2 logs yiwuexpress

# Update code
cd /var/www/yiwuexpress/web
git pull
npm install
npm run build
pm2 restart yiwuexpress

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 SECURITY NOW!

```bash
# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Change admin password via admin panel
```

---

## 💾 AUTO BACKUP (Optional but Recommended)

```bash
sudo nano /root/backup.sh
```

**Add:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /backups
pg_dump -U yiwuadmin yiwuexpress > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /root/backup.sh
sudo crontab -e
# Add: 0 2 * * * /root/backup.sh
```

---

## ⚡ QUICK TROUBLESHOOTING

**Site not loading?**
```bash
pm2 status
sudo systemctl status nginx
sudo ufw status
```

**502 Error?**
```bash
pm2 restart yiwuexpress
pm2 logs yiwuexpress
```

**Database error?**
```bash
sudo systemctl status postgresql
psql -U yiwuadmin -d yiwuexpress -h localhost
```

---

## 📊 YOUR SETUP SUMMARY

| Component | Location |
|-----------|----------|
| **Server** | Your VPS/Dedicated |
| **Database** | PostgreSQL 18 (localhost) |
| **Web Server** | Nginx |
| **App Manager** | PM2 |
| **Domain** | yourdomain.com |
| **SSL** | Let's Encrypt (Free) |
| **App Files** | /var/www/yiwuexpress/web |

---

## ✅ SUCCESS CHECKLIST

- [ ] Server software installed
- [ ] Database created & configured
- [ ] Code uploaded to server
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] App built successfully
- [ ] PM2 running app
- [ ] Nginx configured
- [ ] Domain pointed to server
- [ ] SSL certificate installed
- [ ] Site loads via HTTPS
- [ ] Admin login works
- [ ] Products display
- [ ] Changed admin password
- [ ] Firewall enabled
- [ ] Backups configured

---

## 🎯 YOUR ADVANTAGES

✅ **Full Control** - You own everything  
✅ **Cost Effective** - Fixed monthly cost  
✅ **Fast Database** - Same server, no network latency  
✅ **No Limits** - No bandwidth/request limits  
✅ **Professional** - Enterprise-grade setup  

---

## 📚 DETAILED GUIDE

For complete instructions, see: `🎯_YOUR_SERVER_DEPLOYMENT.md`

---

**Total Time:** 45 minutes  
**Total Cost:** Your server cost only (no additional fees!)  
**Result:** Professional production deployment! 🚀
