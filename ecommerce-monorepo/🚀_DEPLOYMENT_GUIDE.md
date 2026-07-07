# 🚀 DEPLOYMENT GUIDE - YIWU EXPRESS

## Complete Step-by-Step Guide to Deploy Your E-Commerce Platform Online

**Last Updated:** January 2025  
**Project:** YIWU EXPRESS - Global Trade & Logistics Platform  
**Tech Stack:** Next.js 14, PostgreSQL, Prisma, TypeScript

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Choose Your Hosting Platform](#choose-hosting-platform)
3. [Option 1: Vercel (Recommended - Easiest)](#option-1-vercel)
4. [Option 2: Netlify](#option-2-netlify)
5. [Option 3: Railway (Includes Database)](#option-3-railway)
6. [Option 4: DigitalOcean/AWS/VPS](#option-4-vps)
7. [Database Deployment](#database-deployment)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [Troubleshooting](#troubleshooting)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Before You Start

- [ ] Project builds successfully locally (`npm run build`)
- [ ] All environment variables documented
- [ ] Database schema is finalized
- [ ] Payment APIs configured (if using)
- [ ] Email service configured (if using)
- [ ] Domain name purchased (optional but recommended)

### Test Locally First

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Build the project
npm run build

# Start production server
npm run start
# Test at http://localhost:3001
```

✅ If everything works locally, you're ready to deploy!

---

## 🌐 CHOOSE YOUR HOSTING PLATFORM

### Quick Comparison

| Platform | Difficulty | Cost | Database | Best For |
|----------|-----------|------|----------|----------|
| **Vercel** | ⭐ Easy | Free/$20/mo | External needed | Next.js projects |
| **Netlify** | ⭐⭐ Easy | Free/$19/mo | External needed | Static + functions |
| **Railway** | ⭐⭐ Medium | Pay-as-go (~$10/mo) | Included ✅ | Full-stack apps |
| **DigitalOcean** | ⭐⭐⭐⭐ Hard | $12-50/mo | Self-managed | Full control |
| **AWS** | ⭐⭐⭐⭐⭐ Very Hard | Variable | Self-managed | Enterprise |

### 💡 Recommendation

**For Beginners:** Use **Vercel** + **Supabase** (PostgreSQL)  
**For Intermediate:** Use **Railway** (all-in-one)  
**For Advanced:** Use **DigitalOcean** or **AWS**

---

## 🎯 OPTION 1: VERCEL (RECOMMENDED - EASIEST)

### Why Vercel?
- ✅ Built specifically for Next.js
- ✅ Automatic deployments from GitHub
- ✅ Free tier (generous limits)
- ✅ Global CDN included
- ✅ Zero configuration needed
- ✅ Best performance for Next.js


### Step 1: Prepare Your Code

```bash
# Navigate to web folder
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Create .gitignore (if not exists)
# Add these lines:
node_modules
.next
.env
.env.local
*.log
.DS_Store
```

### Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - YIWU EXPRESS"

# Create repository on GitHub.com then:
git remote add origin https://github.com/YOUR_USERNAME/yiwuexpress.git
git branch -M main
git push -u origin main
```

### Step 3: Setup Database (Supabase - Free PostgreSQL)

1. **Go to:** https://supabase.com
2. **Sign up** with GitHub account
3. **Create new project:**
   - Name: `yiwuexpress-db`
   - Password: (Generate strong password)
   - Region: Choose closest to your users
4. **Wait 2-3 minutes** for database creation

5. **Get connection string:**
   - Go to Project Settings → Database
   - Look for "Connection string" → "URI"
   - Copy the connection string (looks like):
   ```
   postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

6. **Enable Prisma connection pooling:**
   - In same page, find "Connection pooling"
   - Copy the pooler connection string (with `:6543` port)


### Step 4: Deploy to Vercel

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub account
3. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Select the `web` folder as root directory

4. **Configure Build Settings:**
   ```
   Framework Preset: Next.js
   Root Directory: web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

5. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```env
   DATABASE_URL=your_supabase_connection_string_here
   JWT_SECRET=generate_a_very_long_random_string_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-project.vercel.app
   ```

   **How to generate JWT_SECRET:**
   ```bash
   # Run in terminal:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes
   - Your site will be live at: `https://your-project.vercel.app`

### Step 5: Setup Database Schema

After first deployment:

```bash
# On your local machine
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Update .env with production database
DATABASE_URL="your_supabase_connection_string"

# Push schema to production
npx prisma db push

# Seed with initial data
npm run db:seed
```

✅ **Your site is now live!**


---

## 🚂 OPTION 2: RAILWAY (ALL-IN-ONE SOLUTION)

### Why Railway?
- ✅ Includes PostgreSQL database
- ✅ Simple deployment
- ✅ Automatic HTTPS
- ✅ Environment management
- ✅ Pay only for what you use (~$5-10/month)

### Step 1: Prepare Your Project

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Create railway.json
```

Create file `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy to Railway

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `web` as root directory

4. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create database automatically

5. **Configure Environment Variables:**
   
   Railway auto-creates `DATABASE_URL`. Add these:

   ```env
   JWT_SECRET=generate_random_string_64_chars
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=3001
   ```

6. **Link Database to App:**
   - Click on your web service
   - Go to "Variables"
   - Reference PostgreSQL: `${{Postgres.DATABASE_URL}}`


7. **Deploy:**
   - Click "Deploy"
   - Wait 3-5 minutes
   - Access via: `https://your-project.up.railway.app`

8. **Run Migrations:**
   - Go to your service settings
   - Open "Deployments" tab
   - Find latest deployment → click "View Logs"
   - Or run locally against production DB

```bash
# Locally with production DB URL
DATABASE_URL="railway_postgres_url" npx prisma db push
DATABASE_URL="railway_postgres_url" npm run db:seed
```

✅ **Done! Your app is live with database included!**

---

## 🔷 OPTION 3: NETLIFY

### Why Netlify?
- ✅ Good for static sites
- ✅ Free SSL
- ✅ Forms & Functions
- ⚠️ Limited Next.js API routes support

**Note:** Netlify works better for static sites. For full Next.js with API routes, use Vercel or Railway.

### Quick Steps:

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Build:**
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run build
```

3. **Deploy:**
```bash
netlify deploy --prod
```

4. **Configure:**
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify dashboard

**⚠️ Important:** Netlify may not support all Next.js 14 features. Test thoroughly.


---

## 🖥️ OPTION 4: VPS (DIGITALOCEAN / AWS / LINODE)

### Why VPS?
- ✅ Complete control
- ✅ Better for complex apps
- ✅ Custom configurations
- ⚠️ Requires server management skills

### Step 1: Create VPS

**DigitalOcean Droplet (Recommended for beginners):**

1. **Sign up:** https://digitalocean.com
2. **Create Droplet:**
   - Distribution: Ubuntu 22.04 LTS
   - Plan: Basic ($12/month minimum)
   - Datacenter: Choose closest to users
   - Authentication: SSH Key (recommended)

3. **Note your IP address:** `123.456.789.0`

### Step 2: Connect to Server

```bash
# Windows (use PowerShell or Git Bash)
ssh root@your_server_ip

# Or use PuTTY on Windows
```

### Step 3: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install nginx -y
```


### Step 4: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE ecommerce;
CREATE USER yiwu WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO yiwu;
\q

# Allow remote connections (optional)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Find: listen_addresses = 'localhost'
# Change to: listen_addresses = '*'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 5: Deploy Your Application

```bash
# Create app directory
sudo mkdir -p /var/www/yiwuexpress
cd /var/www/yiwuexpress

# Clone from GitHub
sudo git clone https://github.com/YOUR_USERNAME/yiwuexpress.git .
cd web

# Install dependencies
sudo npm install

# Create .env file
sudo nano .env
```

Add to `.env`:
```env
DATABASE_URL="postgresql://yiwu:your_secure_password@localhost:5432/ecommerce"
JWT_SECRET="your_64_character_random_string"
JWT_EXPIRES_IN="7d"
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
```

```bash
# Generate Prisma client
sudo npx prisma generate

# Push schema to database
sudo npx prisma db push

# Seed database
sudo npm run db:seed

# Build application
sudo npm run build

# Start with PM2
sudo pm2 start npm --name "yiwuexpress" -- start
sudo pm2 save
sudo pm2 startup
```


### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/yiwuexpress
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

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
# Enable site
sudo ln -s /etc/nginx/sites-available/yiwuexpress /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your_domain.com -d www.your_domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

✅ **Your site is now live at https://your_domain.com!**

### Step 8: Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```


---

## 🗄️ DATABASE DEPLOYMENT OPTIONS

### Option A: Supabase (Recommended for Vercel)

**Pros:** Free tier, easy setup, good performance  
**Cost:** Free (500MB) → $25/month (8GB)

1. Sign up: https://supabase.com
2. Create project
3. Copy connection string
4. Use in your app

### Option B: Railway PostgreSQL

**Pros:** Integrated with app hosting  
**Cost:** Pay-as-you-go (~$5-10/month)

- Automatically provisioned with Railway deployment
- No separate setup needed

### Option C: Neon (Serverless Postgres)

**Pros:** Serverless, auto-scaling  
**Cost:** Free tier available

1. Sign up: https://neon.tech
2. Create project
3. Copy connection string
4. Use in your app

### Option D: Amazon RDS

**Pros:** Enterprise-grade, scalable  
**Cost:** Starts at $15/month

1. AWS Console → RDS
2. Create PostgreSQL database
3. Configure security groups
4. Use connection string

### Option E: Self-hosted on VPS

**Pros:** Full control, cost-effective for large scale  
**Cost:** Included in VPS cost

- Already covered in Option 4 above
- Requires database management skills


---

## ✅ POST-DEPLOYMENT TASKS

### 1. Update Environment Variables

Make sure all production URLs are set:

```env
# Frontend URL
NEXT_PUBLIC_API_URL=https://your-domain.com

# Database
DATABASE_URL=your_production_database_url

# JWT
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment (if using)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx

# Other
NODE_ENV=production
```

### 2. Setup Custom Domain

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records at your domain registrar

**For Railway:**
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS with provided CNAME

**For VPS:**
1. Point A record to server IP
2. Update Nginx configuration
3. Get SSL certificate with Certbot

### 3. Configure DNS

At your domain registrar (GoDaddy, Namecheap, etc.):

```
Type    Name    Value                    TTL
A       @       your_server_ip           3600
A       www     your_server_ip           3600
```

Or for Vercel/Railway:
```
Type    Name    Value                    TTL
CNAME   @       cname.vercel-dns.com     3600
CNAME   www     cname.vercel-dns.com     3600
```


### 4. Test Production Site

**Critical Tests:**

```bash
# Homepage
✓ Visit https://your-domain.com

# API Health Check
✓ https://your-domain.com/api/health

# Database Connection
✓ Check products page loads

# Authentication
✓ Login/Register functionality
✓ JWT token generation

# Shopping Cart
✓ Add to cart
✓ Update quantities
✓ Checkout process

# Admin Panel
✓ Login as admin
✓ Product management
✓ Order management
```

### 5. Setup Monitoring

**Free Options:**

1. **Vercel Analytics** (if using Vercel)
   - Automatically enabled
   - View in Vercel dashboard

2. **Uptime Robot** (Free)
   - Monitor site uptime
   - https://uptimerobot.com

3. **Sentry** (Error tracking)
   ```bash
   npm install @sentry/nextjs
   ```

4. **Google Analytics**
   - Add tracking code to your site

### 6. Backup Strategy

**Database Backups:**

```bash
# For Supabase: Automatic daily backups (paid plans)

# For VPS:
# Create backup script
sudo nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U yiwu ecommerce > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /root/backup-db.sh
```


### 7. Performance Optimization

```bash
# Enable compression in next.config.js
module.exports = {
  compress: true,
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp'],
  },
  // Enable SWC minification
  swcMinify: true,
}
```

### 8. Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Environment variables secured
- [ ] Database credentials not in code
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled
- [ ] Change default admin password
- [ ] Regular security updates

---

## 🔧 TROUBLESHOOTING

### Issue: Build Fails

**Error:** `Module not found` or `Cannot find package`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
1. Check DATABASE_URL is correct
2. Ensure database allows connections from your host IP
3. Check firewall rules
4. Verify database is running

```bash
# Test connection locally
npx prisma db pull
```

### Issue: 500 Internal Server Error

**Solutions:**
1. Check server logs:
   ```bash
   # Vercel: View in dashboard
   # Railway: Check deployment logs
   # VPS: pm2 logs yiwuexpress
   ```

2. Check environment variables are set
3. Verify database migrations ran
4. Check API route syntax


### Issue: Images Not Loading

**Solutions:**
1. Check `next.config.js` image domains
2. Verify image paths are correct
3. Use absolute URLs for images
4. Check image hosting service CORS

### Issue: API Routes Not Working

**Solutions:**
1. Verify routes are in `app/api` folder
2. Check route.ts file exports properly
3. Ensure middleware isn't blocking requests
4. Check CORS configuration

### Issue: Slow Performance

**Solutions:**
1. Enable caching headers
2. Optimize images (use WebP)
3. Enable compression
4. Use CDN for static assets
5. Database query optimization
6. Add Redis for caching

### Issue: "Application Error" on Vercel

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Check Node version compatibility
4. Review function timeout limits (10s on hobby plan)

---

## 💰 COST ESTIMATES

### Small Traffic (< 10,000 visitors/month)

| Option | Monthly Cost |
|--------|--------------|
| Vercel Free + Supabase Free | **$0** |
| Vercel Pro + Supabase Starter | **$45** |
| Railway | **$5-10** |
| DigitalOcean Droplet | **$12** |
| Netlify | **$0-19** |

### Medium Traffic (10,000 - 100,000 visitors/month)

| Option | Monthly Cost |
|--------|--------------|
| Vercel Pro + Supabase Pro | **$45** |
| Railway | **$20-50** |
| DigitalOcean | **$24-48** |

### High Traffic (> 100,000 visitors/month)

| Option | Monthly Cost |
|--------|--------------|
| Vercel Enterprise | **$Custom** |
| AWS/GCP | **$100-500+** |
| Dedicated Server | **$50-200** |


---

## 🎯 RECOMMENDED DEPLOYMENT PATH

### For Most Users (EASIEST)

```
1. Push code to GitHub                    → 5 minutes
2. Sign up for Vercel                     → 2 minutes
3. Import repository                      → 3 minutes
4. Sign up for Supabase                   → 3 minutes
5. Create database                        → 2 minutes
6. Add environment variables to Vercel    → 3 minutes
7. Deploy on Vercel                       → 5 minutes
8. Run database migrations                → 2 minutes
9. Test production site                   → 5 minutes

Total time: ~30 minutes
Total cost: $0 (free tier)
```

### Steps in Detail:

```bash
# 1. GITHUB
git init
git add .
git commit -m "Deploy YIWU EXPRESS"
git remote add origin https://github.com/YOUR_USERNAME/yiwuexpress.git
git push -u origin main

# 2. SUPABASE
# - Visit https://supabase.com
# - Create project
# - Copy DATABASE_URL

# 3. VERCEL
# - Visit https://vercel.com
# - Import from GitHub
# - Add environment variables:
#   DATABASE_URL=your_supabase_url
#   JWT_SECRET=random_64_chars
#   NODE_ENV=production
# - Deploy

# 4. SETUP DATABASE
DATABASE_URL="your_supabase_url" npx prisma db push
DATABASE_URL="your_supabase_url" npm run db:seed

# 5. DONE!
# Visit: https://your-project.vercel.app
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)

### Video Tutorials
- [Deploy Next.js to Vercel](https://www.youtube.com/results?search_query=deploy+nextjs+to+vercel)
- [PostgreSQL with Supabase](https://www.youtube.com/results?search_query=supabase+postgresql+setup)


### Community Support
- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

---

## 🚨 IMPORTANT NOTES

### Before Going Live:

1. **Change Default Credentials:**
   ```sql
   -- In your production database
   UPDATE "User" 
   SET password = 'new_hashed_password' 
   WHERE email = 'admin@yiwuexpress.com';
   ```

2. **Review Security:**
   - All API routes protected
   - CORS properly configured
   - Rate limiting enabled
   - Input validation on all forms

3. **Legal Requirements:**
   - Privacy Policy page
   - Terms of Service
   - Cookie consent (GDPR if EU users)
   - Refund/Return policy

4. **Payment Processing:**
   - Use live API keys (not test keys)
   - Test payment flows thoroughly
   - Setup webhooks for payment confirmations

5. **Email Configuration:**
   - Configure SMTP for transactional emails
   - Order confirmations
   - Password reset emails
   - Welcome emails

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Local build successful
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API routes tested
- [ ] Security review complete

### Deployment
- [ ] Code pushed to GitHub
- [ ] Hosting platform configured
- [ ] Database provisioned
- [ ] Environment variables set
- [ ] DNS configured
- [ ] SSL certificate installed


### Post-Deployment
- [ ] Production site accessible
- [ ] Database migrations successful
- [ ] Sample data seeded
- [ ] Admin login working
- [ ] User registration working
- [ ] Shopping cart functional
- [ ] Checkout process working
- [ ] Order management working
- [ ] Email notifications working
- [ ] Payment processing (if configured)
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Performance optimized
- [ ] Security hardened

### Launch
- [ ] Default credentials changed
- [ ] Legal pages added
- [ ] Analytics configured
- [ ] SEO optimized
- [ ] Social media links added
- [ ] Contact information updated
- [ ] Documentation updated
- [ ] Team trained on admin panel

---

## 🎉 CONGRATULATIONS!

Your YIWU EXPRESS e-commerce platform is now live and accessible to the world!

### What's Next?

1. **Monitor Performance:**
   - Check error logs daily
   - Monitor response times
   - Track user behavior

2. **Gather Feedback:**
   - Beta test with real users
   - Fix reported issues
   - Iterate on features

3. **Marketing:**
   - SEO optimization
   - Social media presence
   - Email marketing
   - Content marketing

4. **Scale:**
   - Optimize database queries
   - Add caching layer
   - CDN for static assets
   - Load balancing (if needed)

---

## 📞 SUPPORT

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review deployment logs
3. Search GitHub issues
4. Ask on Stack Overflow
5. Contact platform support:
   - Vercel: support@vercel.com
   - Railway: support@railway.app
   - Supabase: support@supabase.io

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** YIWU EXPRESS Team

🚀 **Happy Deploying!**
