# 🎯 DEPLOY TO YOUR OWN SERVER - STEP BY STEP

## ✅ Perfect! You Have Everything You Need!

**What You Have:**
- ✅ Your own server
- ✅ PostgreSQL 18 installed
- ✅ Your domain name
- ✅ Full control

**This is the BEST option** - professional, cost-effective, and you control everything!

---

## 📋 SERVER REQUIREMENTS CHECK

Before we start, verify your server has:

```bash
# Check Node.js version (need 18+)
node -v

# Check npm
npm -v

# Check PostgreSQL
psql --version

# Check if port 80/443 are available
netstat -tuln | grep :80
netstat -tuln | grep :443
```

**Required:**
- Node.js 18+ ✅
- npm ✅
- PostgreSQL 18 ✅ (You have this!)
- Nginx or Apache (we'll install if needed)
- Port 80 & 443 available

---

## 🚀 DEPLOYMENT STEPS (45 MINUTES)

### STEP 1: Prepare Your Server (10 min)

```bash
# Connect to your server via SSH
ssh root@your-server-ip
# Or use your hosting control panel terminal

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (keeps your app running)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install nginx -y

# Create application directory
sudo mkdir -p /var/www/yiwuexpress
sudo chown -R $USER:$USER /var/www/yiwuexpress
```

✅ **Server is ready!**

---

### STEP 2: Setup PostgreSQL Database (5 min)

```bash
# Switch to postgres user
sudo -u postgres psql
```

In PostgreSQL console, run:

```sql
-- Create database
CREATE DATABASE yiwuexpress;

-- Create user with strong password
CREATE USER yiwuadmin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE yiwuexpress TO yiwuadmin;

-- Grant schema permissions (PostgreSQL 15+)
\c yiwuexpress
GRANT ALL ON SCHEMA public TO yiwuadmin;

-- Exit
\q
```

**Save this connection string:**
```
postgresql://yiwuadmin:YOUR_STRONG_PASSWORD_HERE@localhost:5432/yiwuexpress
```

✅ **Database is ready!**

---

### STEP 3: Upload Your Project (10 min)

**Option A: Using Git (Recommended)**

```bash
cd /var/www/yiwuexpress

# If you have GitHub repo:
git clone https://github.com/YOUR_USERNAME/yiwuexpress.git .

# Or initialize and push from local:
# (On your local machine first)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo
git init
git add .
git commit -m "Deploy to server"
# Then push and pull on server
```

**Option B: Using FTP/SFTP**

1. Use FileZilla or WinSCP
2. Connect to your server
3. Upload the `web` folder contents to `/var/www/yiwuexpress/`

**Option C: Using cPanel File Manager**

1. Compress your `web` folder locally
2. Upload via cPanel File Manager
3. Extract in `/var/www/yiwuexpress/` or `public_html/`

✅ **Code is on server!**

---

### STEP 4: Configure Application (5 min)

```bash
cd /var/www/yiwuexpress

# Navigate to web folder (if needed)
cd web

# Create .env file
nano .env
```

Add this to `.env`:

```env
# Database
DATABASE_URL="postgresql://yiwuadmin:YOUR_STRONG_PASSWORD_HERE@localhost:5432/yiwuexpress"

# JWT Secret (generate random string)
JWT_SECRET="your_very_long_random_secret_at_least_64_characters_long_12345"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0

# Your Domain
NEXT_PUBLIC_API_URL=https://yourdomain.com

# CORS (your domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**To generate secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save and exit (Ctrl+X, Y, Enter)

✅ **Environment configured!**

---

### STEP 5: Install & Build (10 min)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed with sample data
npm run db:seed

# Build for production
npm run build
```

✅ **Application built!**

---

### STEP 6: Start Application with PM2 (5 min)

```bash
# Start application
pm2 start npm --name "yiwuexpress" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup

# Check if running
pm2 status
pm2 logs yiwuexpress
```

Your app is now running on `http://localhost:3001`

✅ **App is running!**

---

### STEP 7: Configure Nginx (Web Server) (10 min)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/yiwuexpress
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload size for product images
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files optimization
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Error pages
    error_page 502 503 504 /502.html;
}
```

**Replace `yourdomain.com` with your actual domain!**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/yiwuexpress /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

✅ **Nginx configured!**

---

### STEP 8: Point Domain & SSL (10 min)

**A. Configure DNS:**

Go to your domain registrar (GoDaddy, Namecheap, etc.):

```
Type    Name    Value              TTL
A       @       YOUR_SERVER_IP     3600
A       www     YOUR_SERVER_IP     3600
```

Wait 5-30 minutes for DNS propagation.

**B. Install SSL Certificate (FREE with Let's Encrypt):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Redirect HTTP to HTTPS? YES

# Test auto-renewal
sudo certbot renew --dry-run
```

✅ **SSL installed! Your site is now HTTPS!**

---

## 🎉 YOUR SITE IS LIVE!

Visit: **https://yourdomain.com**

**Test these URLs:**
- Homepage: `https://yourdomain.com`
- Shop: `https://yourdomain.com/shop`
- Products: `https://yourdomain.com/products`
- Admin: `https://yourdomain.com/admin/login`

**Default Admin Login:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**⚠️ IMPORTANT:** Change admin password immediately!

---

## 🔧 USEFUL COMMANDS

### Check Application Status
```bash
pm2 status
pm2 logs yiwuexpress
pm2 restart yiwuexpress
```

### Update Code
```bash
cd /var/www/yiwuexpress/web
git pull  # If using Git
npm install
npm run build
pm2 restart yiwuexpress
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Database Management
```bash
# Access database
sudo -u postgres psql yiwuexpress

# Backup database
pg_dump -U yiwuadmin yiwuexpress > backup.sql

# Restore database
psql -U yiwuadmin yiwuexpress < backup.sql
```

### View Application Logs
```bash
pm2 logs yiwuexpress --lines 100
```

---

## 🔒 SECURITY CHECKLIST

```bash
# Setup firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Secure PostgreSQL
sudo nano /etc/postgresql/18/main/pg_hba.conf
# Ensure only local connections allowed

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Monitor logs
pm2 logs
tail -f /var/log/nginx/access.log
```

---

## 📊 MONITORING & MAINTENANCE

### Setup Automatic Backups

```bash
# Create backup script
sudo nano /root/backup-yiwuexpress.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/yiwuexpress"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U yiwuadmin yiwuexpress > $BACKUP_DIR/db_$DATE.sql

# Backup uploads folder
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/yiwuexpress/web/public/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /root/backup-yiwuexpress.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /root/backup-yiwuexpress.sh
```

---

## 🔄 UPDATING YOUR SITE

When you make changes locally:

```bash
# On your local machine
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
# Make changes...
git add .
git commit -m "Update description"
git push

# On your server
cd /var/www/yiwuexpress/web
git pull
npm install  # If dependencies changed
npm run build
pm2 restart yiwuexpress
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Enable Gzip Compression

```bash
sudo nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

### Enable Caching

Already configured in Nginx config above for static files!

---

## 🆘 TROUBLESHOOTING

### Site shows "502 Bad Gateway"

```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart yiwuexpress

# Check logs
pm2 logs yiwuexpress
```

### Database connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U yiwuadmin -d yiwuexpress -h localhost

# Check .env DATABASE_URL is correct
cat /var/www/yiwuexpress/web/.env
```

### Can't access site

```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status

# Check DNS
ping yourdomain.com
```

### SSL certificate issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 💰 YOUR COSTS

**Server:** $5-50/month (depending on your plan)  
**Domain:** $10-15/year  
**SSL Certificate:** $0 (Let's Encrypt is FREE!)  
**Total:** **~$5-50/month** + domain

**This is much cheaper than:**
- Vercel Pro: $20/month
- Railway: $10-20/month
- AWS: $50-100+/month

---

## ✅ ADVANTAGES OF YOUR SETUP

- ✅ **Full Control** - You own everything
- ✅ **Cost Effective** - One fixed price
- ✅ **Better Performance** - Dedicated resources
- ✅ **No Vendor Lock-in** - Easy to migrate
- ✅ **Custom Configuration** - Configure anything
- ✅ **Database Included** - No separate database cost

---

## 🎯 QUICK REFERENCE

**Your Setup:**
```
Server: Your VPS/Dedicated Server
Database: PostgreSQL 18 (localhost)
Web Server: Nginx
Process Manager: PM2
Domain: yourdomain.com
SSL: Let's Encrypt (Free)
```

**Key Files:**
```
App: /var/www/yiwuexpress/web
Config: /var/www/yiwuexpress/web/.env
Nginx: /etc/nginx/sites-available/yiwuexpress
Logs: pm2 logs yiwuexpress
```

**Key Commands:**
```bash
pm2 restart yiwuexpress    # Restart app
sudo systemctl restart nginx  # Restart web server
git pull && npm run build && pm2 restart yiwuexpress  # Update
```

---

## 🎉 CONGRATULATIONS!

Your YIWUEXPRESS e-commerce platform is now live on your own server!

**You have:**
- ✅ Professional hosting setup
- ✅ Your own domain with HTTPS
- ✅ Full database control
- ✅ Automatic SSL renewal
- ✅ Daily backups configured
- ✅ Production-ready deployment

**This is a PROFESSIONAL setup!** 🚀

---

**Need help?** Check the troubleshooting section above or review your server logs!
