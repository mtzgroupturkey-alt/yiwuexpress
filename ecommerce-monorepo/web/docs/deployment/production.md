# Auto-Pilot Production Deployment Guide

## 1. System Requirements & Production Dependencies
- **OS:** Ubuntu 24.04 LTS (Linux, 64-bit, case-sensitive filesystem, LF line endings)
- **CPU / RAM:** Minimum 2 vCPU, 4GB RAM (8GB recommended for production under traffic)
- **Node.js:** v24.x LTS (target: v24.21.0+) + npm 10+
- **Database:** PostgreSQL >= 15 (configured with native Prisma connection pool or PgBouncer)
- **In-Memory Cache & Bus:** Redis >= 7.0 (required for distributed rate limiting & event bus; falls back to memory)
- **Process Manager:** PM2 (latest, cluster mode with max CPU instances)
- **Reverse Proxy:** Nginx (latest stable with HTTP/2 and TLS 1.3)
- **Anti-Gravity CLI:** Linux 64-bit binary (`agy` / `antigravity-cli` v1.0+) for autonomous background workers and cron orchestration

---

## 2. Server Setup & Dependencies

```bash
# 1. Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Node.js 24 and essential tools
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx redis-server postgresql-client build-essential

# 3. Verify installed versions
node -v              # v24.x.x (required >= 24)
npm -v               # 10.x.x
redis-server -v      # Redis server v=7.x or higher
redis-cli ping       # PONG
psql --version       # psql (PostgreSQL) 15.x or 16.x

# 4. Install Anti-Gravity CLI (Linux binary)
sudo curl -sSL https://antigravity.dev/install.sh | bash
agy --version        # antigravity-cli v1.x

# 5. Install PM2 globally
sudo npm install -g pm2
pm2 -v
```

---

## 3. Application Deployment Checklist

```bash
# 1. Clone repository & enter web directory
cd /var/www/yiwuexpress/ecommerce-monorepo/web

# 2. Install production dependencies
npm ci

# 3. Apply database migrations & generate Prisma client
npx prisma db push
npx prisma generate

# 4. Build Next.js application
npm run build

# 5. Start with PM2 Process Manager
sudo npm install -g pm2
pm2 start server.js --name "yiwuexpress-web" -i max
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/dromkok.com`:

```nginx
server {
    listen 80;
    server_name dromkok.com www.dromkok.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dromkok.com www.dromkok.com;

    ssl_certificate /etc/letsencrypt/live/dromkok.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dromkok.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE Event Streaming (War Room and Live Event Feed)
    location /api/autopilot/cycles/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```

---

## 5. Zero-Downtime Update Routine

```bash
#!/bin/bash
set -e
cd /var/www/yiwuexpress/ecommerce-monorepo/web
git pull origin main
npm ci
npx prisma db push
npm run build
pm2 reload yiwuexpress-web
echo "✅ Auto-Pilot updated with zero downtime."
```
