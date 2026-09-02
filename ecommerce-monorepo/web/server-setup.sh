#!/bin/bash
# server-setup.sh - One-time setup script for production server
# Run this ONCE on the production server after pulling deployment files

set -e

echo "====================================="
echo "🔧 Production Server Setup"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_PATH="/www/wwwroot/www.dromkok.com/web"
BACKUP_DIR="/home/djdn/backups"

echo -e "${BLUE}Current directory: $(pwd)${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    echo -e "${YELLOW}⚠️ Warning: deploy.sh not found in current directory${NC}"
    echo "Please run this script from: $PROJECT_PATH"
    exit 1
fi

echo -e "${GREEN}✅ Running from correct directory${NC}"
echo ""

# Step 1: Make scripts executable & fix directory permissions
echo -e "${BLUE}[1/6] Making scripts executable and fixing file permissions...${NC}"
chmod -R u+rwX "$PROJECT_PATH" 2>/dev/null || true
chmod +x deploy.sh
chmod +x prisma/migrations/backup.sh
chmod +x scripts/rollback.sh
chmod +x test-deployment.sh
chmod +x server-setup.sh
echo -e "${GREEN}✅ Scripts are now executable and permissions set${NC}"
echo ""

# Step 2: Create backup directory
echo -e "${BLUE}[2/6] Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup directory created: $BACKUP_DIR${NC}"
echo ""

# Step 3: Test database connection
echo -e "${BLUE}[3/6] Testing database connection...${NC}"
export PGPASSWORD="LzZH5p5SnRtNKfMy"
if /www/server/pgsql/bin/psql -U ecommerce -d ecommerce -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️ Warning: Could not connect to database${NC}"
    echo "  Please verify database credentials in .env file"
fi
echo ""

# Step 4: Install dependencies (if needed)
echo -e "${BLUE}[4/6] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 5: Setup PM2
echo -e "${BLUE}[5/6] Setting up PM2...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Check if app is already running
if pm2 describe dromkok-web > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PM2 process 'dromkok-web' already exists${NC}"
    echo "To restart with new config, run:"
    echo "  pm2 delete dromkok-web"
    echo "  pm2 start ecosystem.config.js"
else
    echo "Starting app with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ PM2 configured and app started${NC}"
fi

# Setup PM2 startup
if ! pm2 startup | grep -q "already configured"; then
    echo "Configuring PM2 to start on boot..."
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
fi

echo ""

# Step 6: Create initial backup
echo -e "${BLUE}[6/6] Creating initial database backup...${NC}"
if ./prisma/migrations/backup.sh; then
    echo -e "${GREEN}✅ Initial backup created${NC}"
else
    echo -e "${YELLOW}⚠️ Backup failed, but setup can continue${NC}"
fi
echo ""

# Final summary
echo "====================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "====================================="
echo ""
echo "📁 Files configured:"
echo "  ✅ deploy.sh"
echo "  ✅ ecosystem.config.js"
echo "  ✅ backup.sh"
echo "  ✅ rollback.sh"
echo ""
echo "📍 Directories created:"
echo "  ✅ $BACKUP_DIR"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. Test deployment: ./test-deployment.sh"
echo "  2. Run first deployment: ./deploy.sh"
echo "  3. Check status: pm2 status"
echo "  4. View logs: pm2 logs dromkok-web"
echo ""
echo "Documentation:"
echo "  - Setup Guide: cat DEPLOYMENT_SETUP.md"
echo "  - Quick Reference: cat QUICK_REFERENCE.md"
echo "  - Main README: cat README_DEPLOYMENT.md"
echo ""
