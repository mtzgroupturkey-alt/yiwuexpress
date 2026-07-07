# 🖥️ SERVER TYPE DEPLOYMENT GUIDE

## Choose Your Path Based on Your Server Type

---

## 🎯 WHICH SERVER TYPE DO YOU HAVE?

### Option 1: cPanel Hosting (Most Common)
**Examples:** Bluehost, HostGator, GoDaddy, SiteGround  
**Access:** Web interface (cPanel)  
**Difficulty:** ⭐⭐ Easy  
**→ [Jump to cPanel Instructions](#cpanel-deployment)**

### Option 2: VPS with SSH Access
**Examples:** DigitalOcean, Linode, Vultr, AWS EC2  
**Access:** Command line (SSH)  
**Difficulty:** ⭐⭐⭐ Medium  
**→ [Jump to VPS Instructions](#vps-deployment)**

### Option 3: Plesk Panel
**Examples:** Some VPS providers, dedicated servers  
**Access:** Plesk web interface  
**Difficulty:** ⭐⭐ Easy  
**→ [Jump to Plesk Instructions](#plesk-deployment)**

### Option 4: DirectAdmin
**Examples:** Some shared hosting providers  
**Access:** DirectAdmin web interface  
**Difficulty:** ⭐⭐ Easy  
**→ [Jump to DirectAdmin Instructions](#directadmin-deployment)**

---

## 🔷 cPanel Deployment

### What You Have:
- cPanel web interface
- File Manager
- PostgreSQL database (you said you installed it)
- Domain already pointed

### Steps:

#### 1. Setup Database (cPanel → PostgreSQL)

1. Login to cPanel
2. Find **"PostgreSQL Databases"**
3. Create database: `yiwuexpress`
4. Create user: `yiwuadmin` with strong password
5. Add user to database with ALL PRIVILEGES
6. Note the connection details:
   ```
   Host: localhost
   Database: yiwuexpress
   User: yiwuadmin
   Password: [your password]
   ```

#### 2. Upload Your Files

**Method A: File Manager (Easy)**
1. cPanel → File Manager
2. Go to your domain folder (usually `public_html` or `domains/yourdomain.com`)
3. Upload your `web` folder contents
4. Right-click → Extract if you uploaded a zip

**Method B: FTP (Better for large files)**
1. cPanel → FTP Accounts → Create FTP account
2. Use FileZilla:
   - Host: your-domain.com
   - Username: your FTP username
   - Password: your FTP password
   - Port: 21
3. Upload `web` folder contents

#### 3. Setup Node.js App

1. cPanel → **"Setup Node.js App"** or **"Application Manager"**
2. Click **"Create Application"**
3. Configure:
   - Node.js version: 18.x
   - Application mode: Production
   - Application root: `web` (or your folder name)
   - Application URL: yourdomain.com
   - Application startup file: `server.js`
   - Port: Auto (cPanel assigns)

4. Click **"Create"**

#### 4. Setup Environment Variables

In the Node.js App interface:
1. Click your app
2. Find **"Environment Variables"** section
3. Add these:

```
DATABASE_URL = postgresql://yiwuadmin:YOUR_PASSWORD@localhost:5432/yiwuexpress
JWT_SECRET = [run node command to generate]
JWT_EXPIRES_IN = 7d
NODE_ENV = production
NEXT_PUBLIC_API_URL = https://yourdomain.com
```

#### 5. Install & Start

In cPanel Node.js App terminal or SSH:

```bash
cd ~/public_html/web  # or your path
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

Click **"Restart"** in cPanel Node.js App interface

#### 6. Configure .htaccess (if needed)

Create `.htaccess` in your domain root:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:YOUR_APP_PORT/$1 [P,L]
```

✅ **Your site should be live!**

---

## 🔷 VPS Deployment

### What You Have:
- Root or sudo access
- SSH terminal
- Full control

### This is the BEST option! Follow:
**→ See `✅_YOUR_SERVER_CHECKLIST.md` for complete steps**

**Quick version:**

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install software
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 3. Setup database
sudo -u postgres psql
CREATE DATABASE yiwuexpress;
CREATE USER yiwuadmin WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE yiwuexpress TO yiwuadmin;
\c yiwuexpress
GRANT ALL ON SCHEMA public TO yiwuadmin;
\q

# 4. Upload code (use Git or FTP)
cd /var/www
git clone YOUR_REPO .

# 5. Configure
cd web
nano .env  # Add environment variables

# 6. Build
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build

# 7. Start
pm2 start npm --name "yiwuexpress" -- start
pm2 save
pm2 startup

# 8. Configure Nginx
sudo nano /etc/nginx/sites-available/yourdomain
# Add proxy configuration
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

✅ **Professional setup complete!**

---

## 🔷 Plesk Deployment

### Steps:

#### 1. Create Database
1. Plesk → Databases → Add Database
2. Database name: `yiwuexpress`
3. User: `yiwuadmin`
4. Password: [strong password]
5. Grant all permissions

#### 2. Upload Files
1. Plesk → Files → File Manager
2. Navigate to `httpdocs` or your domain folder
3. Upload your `web` folder
4. Or use FTP (Plesk → FTP Access)

#### 3. Setup Node.js
1. Plesk → **"Node.js"** (under Development)
2. Enable Node.js
3. Select version: 18.x
4. Document root: `web`
5. Application startup file: `server.js`

#### 4. Environment Variables
In Node.js settings, add variables like cPanel above

#### 5. Install & Build
Use Plesk SSH terminal:
```bash
cd ~/httpdocs/web
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

Restart application from Plesk Node.js interface

✅ **Site is live!**

---

## 🔷 DirectAdmin Deployment

### Steps:

#### 1. Database Setup
1. DirectAdmin → PostgreSQL Management
2. Create database: `yiwuexpress`
3. Create user and assign to database

#### 2. File Upload
1. DirectAdmin → File Manager
2. Navigate to `public_html` or domain folder
3. Upload files

#### 3. Node.js Setup (if available)
- Check if DirectAdmin has Node.js support
- If not, you may need to use SSH

#### 4. SSH Commands
Same as VPS deployment above

---

## 🤔 NOT SURE WHICH YOU HAVE?

### Check Your Hosting:

**You have cPanel if:**
- You see orange/blue interface
- Login URL has `:2083` or `/cpanel`
- You see "cPanel" logo

**You have VPS/Root if:**
- You SSH with `ssh root@ip`
- You have full command line access
- No web interface (or minimal)

**You have Plesk if:**
- Modern blue interface
- Login URL has `:8443`
- You see "Plesk" branding

**You have DirectAdmin if:**
- Blue/green interface
- Login URL has `:2222`
- You see "DirectAdmin" text

---

## 💡 RECOMMENDED SETUP BY SERVER TYPE

### Shared Hosting (cPanel/Plesk/DirectAdmin)
```
Database: Use hosting PostgreSQL ✅
Files: Upload via File Manager
Node.js: Use hosting Node.js app manager
Web Server: Automatic (cPanel/Plesk handles)
SSL: Use hosting Let's Encrypt
```

### VPS/Dedicated
```
Database: PostgreSQL 18 (you have this!) ✅
Files: Git or FTP
Node.js: Install via apt, manage with PM2
Web Server: Nginx (you configure)
SSL: Certbot (you install)
```

---

## 📊 COMPARISON

| Feature | Shared Hosting | VPS |
|---------|----------------|-----|
| **Control** | Limited | Full |
| **Setup Difficulty** | ⭐⭐ Easy | ⭐⭐⭐ Medium |
| **Performance** | Good | Excellent |
| **Cost** | $5-15/mo | $5-50/mo |
| **Best For** | Small-Medium | Medium-Large |

---

## 🎯 QUICK DECISION GUIDE

**Choose cPanel method if:**
- You have cPanel interface ✅
- You want easiest setup
- Limited command line experience

**Choose VPS method if:**
- You have SSH root access ✅
- You want full control
- Better performance needed

**Not sure? Try this:**
```bash
# Can you run this command?
ssh root@your-server-ip

# If YES → You have VPS
# If NO → You probably have cPanel
```

---

## 📚 NEXT STEPS

1. **Identify your server type** (above)
2. **Follow the specific guide** for your type
3. **Or use the universal guide:** `🎯_YOUR_SERVER_DEPLOYMENT.md`
4. **Quick checklist:** `✅_YOUR_SERVER_CHECKLIST.md`

---

## 🆘 NEED HELP?

**For cPanel issues:**
- Contact your hosting support
- They can help with Node.js setup

**For VPS issues:**
- Check server logs: `pm2 logs`
- Verify services: `systemctl status nginx`
- Test connection: `curl localhost:3001`

---

**Choose your path above and let's get your site deployed!** 🚀
