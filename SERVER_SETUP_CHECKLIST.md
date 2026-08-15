# ✅ Server Setup Checklist for dromkok.com

Complete this checklist to ensure your server is ready for deployment.

## 📋 Server Information

- **Server IP:** 39.175.57.2
- **Domain:** www.dromkok.com
- **Server Path:** /www/wwwroot/www.dromkok.com/web
- **Server User:** root
- **Web Server:** Nginx (with SSL)
- **Application:** Next.js on port 3000

---

## 1️⃣ SSH Access Setup

### Check SSH Connection

```bash
# Test connection
ssh root@39.175.57.2

# If successful, continue. If not, check server access.
```

### Setup SSH Key (Recommended)

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy key to server
ssh-copy-id root@39.175.57.2

# Test passwordless login
ssh root@39.175.57.2 "echo 'SSH key works!'"
```

✅ **Verification:** You can SSH without password

---

## 2️⃣ Server Directory Structure

### Create Project Directory

```bash
# SSH to server
ssh root@39.175.57.2

# Create directory (if not exists)
mkdir -p /www/wwwroot/www.dromkok.com

# Set permissions
chmod -R 755 /www/wwwroot/www.dromkok.com
chown -R www:www /www/wwwroot/www.dromkok.com

# Verify
ls -la /www/wwwroot/
```

✅ **Verification:** Directory exists with correct permissions

---

## 3️⃣ Node.js & NPM

### Check Node.js Installation

```bash
ssh root@39.175.57.2 "node --version"
ssh root@39.175.57.2 "npm --version"
```

### Install Node.js (if needed)

```bash
# For Ubuntu/Debian
ssh root@39.175.57.2 "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
ssh root@39.175.57.2 "apt-get install -y nodejs"

# For CentOS/AlmaLinux
ssh root@39.175.57.2 "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -"
ssh root@39.175.57.2 "yum install -y nodejs"

# Verify
ssh root@39.175.57.2 "node --version"
```

✅ **Verification:** Node.js v16+ and NPM v8+ installed

---

## 4️⃣ PostgreSQL Database

### Check Database

```bash
ssh root@39.175.57.2 "psql --version"
```

### Create Database

```bash
ssh root@39.175.57.2

# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE yiwuexpress;

# Create user (if needed)
CREATE USER yiwuuser WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE yiwuexpress TO yiwuuser;

# Exit
\q
```

✅ **Verification:** Database exists and accessible

---

## 5️⃣ Environment Variables

### Create .env.production on Server

```bash
ssh root@39.175.57.2

cd /www/wwwroot/www.dromkok.com

# Create .env.production
cat > .env.production << 'EOF'
# Database
DATABASE_URL="postgresql://yiwuuser:your_password@localhost:5432/yiwuexpress"

# App
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://www.dromkok.com

# JWT Secret (generate a strong secret)
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-64-characters-long"

# Payment Gateways
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# Set permissions
chmod 600 .env.production
```

✅ **Verification:** .env.production exists with correct values

---

## 6️⃣ Nginx Configuration

### Check Current Nginx Config

```bash
ssh root@39.175.57.2 "cat /etc/nginx/sites-available/dromkok.com"
```

### Update Nginx Config (if needed)

```bash
ssh root@39.175.57.2

# Edit config
nano /etc/nginx/sites-available/dromkok.com
```

**Ensure these settings:**

```nginx
server {
    listen 443 ssl http2;
    server_name www.dromkok.com dromkok.com;
    
    # SSL certificates
    ssl_certificate /etc/nginx/ssl/dromkok.com/dromkok.com_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/dromkok.com/dromkok.com.key;
    
    # Root directory
    root /www/wwwroot/www.dromkok.com;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Test and Reload Nginx

```bash
ssh root@39.175.57.2 "nginx -t"
ssh root@39.175.57.2 "systemctl reload nginx"
```

✅ **Verification:** Nginx config is valid and reloaded

---

## 7️⃣ PM2 Process Manager (Recommended)

### Install PM2

```bash
ssh root@39.175.57.2 "npm install -g pm2"
```

### Create PM2 Ecosystem File

```bash
ssh root@39.175.57.2

cd /www/wwwroot/www.dromkok.com

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'yiwuexpress',
    script: 'server.js',
    cwd: '/www/wwwroot/www.dromkok.com',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

✅ **Verification:** PM2 is managing the application

---

## 8️⃣ Firewall & Security

### Check Firewall

```bash
ssh root@39.175.57.2 "ufw status"
```

### Configure Firewall (if needed)

```bash
ssh root@39.175.57.2

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

✅ **Verification:** Ports 22, 80, 443 are open

---

## 9️⃣ First Deployment

### Initial Sync

```bash
# Run from your local machine
cd c:\wamp64\www\yiwuexpress

# Full sync
sync-to-server.bat --full
```

### Manual Steps (if script fails)

```bash
# 1. Build locally
cd ecommerce-monorepo\web
npm run build

# 2. Sync files
scp -r .next root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp -r app root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp -r components root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp -r lib root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp -r public root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp -r prisma root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp package.json root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp package-lock.json root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp next.config.js root@39.175.57.2:/www/wwwroot/www.dromkok.com/
scp server.js root@39.175.57.2:/www/wwwroot/www.dromkok.com/

# 3. Install dependencies on server
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npm install --production"

# 4. Setup database
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npx prisma generate"
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npx prisma db push"

# 5. Start application
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && pm2 start ecosystem.config.js"
```

✅ **Verification:** Application is running

---

## 🔟 Verify Deployment

### Check Website

```bash
# 1. Check if Next.js is running
ssh root@39.175.57.2 "curl http://localhost:3000"

# 2. Check via domain
curl https://www.dromkok.com

# 3. Visit in browser
# https://www.dromkok.com
```

### Check Logs

```bash
# PM2 logs
ssh root@39.175.57.2 "pm2 logs yiwuexpress"

# Nginx access logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_access.log"

# Nginx error logs
ssh root@39.175.57.2 "tail -f /var/log/nginx/www.dromkok.com_error.log"
```

✅ **Verification:** Website loads correctly

---

## 📊 Monitoring Commands

```bash
# Check PM2 status
ssh root@39.175.57.2 "pm2 status"

# Monitor resources
ssh root@39.175.57.2 "pm2 monit"

# Check Nginx status
ssh root@39.175.57.2 "systemctl status nginx"

# Check disk space
ssh root@39.175.57.2 "df -h"

# Check memory
ssh root@39.175.57.2 "free -m"
```

---

## 🔄 Regular Maintenance

### Daily
- ✅ Check application is running: `ssh root@39.175.57.2 "pm2 status"`
- ✅ Check error logs: `ssh root@39.175.57.2 "pm2 logs --err"`

### Weekly
- ✅ Update dependencies: `ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npm update"`
- ✅ Check disk space: `ssh root@39.175.57.2 "df -h"`
- ✅ Backup database

### Monthly
- ✅ Update Node.js
- ✅ Update system packages
- ✅ Review SSL certificate expiration

---

## 🆘 Troubleshooting

### Application Not Starting

```bash
# Check logs
ssh root@39.175.57.2 "pm2 logs yiwuexpress --lines 100"

# Restart
ssh root@39.175.57.2 "pm2 restart yiwuexpress"

# Full restart
ssh root@39.175.57.2 "pm2 delete yiwuexpress && pm2 start ecosystem.config.js"
```

### Database Connection Issues

```bash
# Test connection
ssh root@39.175.57.2 "cd /www/wwwroot/www.dromkok.com && npx prisma db pull"

# Check PostgreSQL
ssh root@39.175.57.2 "systemctl status postgresql"
```

### Nginx Issues

```bash
# Test config
ssh root@39.175.57.2 "nginx -t"

# Restart
ssh root@39.175.57.2 "systemctl restart nginx"
```

---

## ✅ Final Checklist

- [ ] SSH access works (passwordless with key)
- [ ] Directory `/www/wwwroot/www.dromkok.com` exists
- [ ] Node.js v16+ installed
- [ ] PostgreSQL database created
- [ ] .env.production configured
- [ ] Nginx configured and running
- [ ] PM2 installed and configured
- [ ] Firewall configured
- [ ] First deployment successful
- [ ] Website accessible at https://www.dromkok.com
- [ ] SSL certificate valid
- [ ] Application logs show no errors
- [ ] Database connection working

---

## 🎉 You're Ready!

Once all checkboxes are complete, your server is ready for continuous deployment using:

```bash
# Quick updates
quick-sync.bat

# Full deployment
sync-to-server.bat --full

# Database updates
sync-to-server.bat --db
```

**Happy Deploying! 🚀**
