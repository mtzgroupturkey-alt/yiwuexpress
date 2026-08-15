#!/bin/bash
# ==========================================
# Sync Local to Server - Yiwu Express
# ==========================================
# This script syncs your localhost to dromkok.com server
# Usage: ./sync-to-server.sh [option]
# Options:
#   --full      Full sync (all files)
#   --quick     Quick sync (only changed files)
#   --db        Database sync only
#   --env       Sync environment files

set -e

# ==========================================
# Configuration
# ==========================================
SERVER_IP="39.175.57.2"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/www.dromkok.com/web"
LOCAL_PATH="$(pwd)/ecommerce-monorepo/web"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==========================================
# Helper Functions
# ==========================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==========================================
# Pre-flight Checks
# ==========================================
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check SSH connection
    log_info "Testing SSH connection to $SERVER_IP..."
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'Connection successful'" 2>/dev/null; then
        log_error "Cannot connect to server via SSH. Please check:"
        echo "  1. SSH key is configured: ssh-copy-id $SERVER_USER@$SERVER_IP"
        echo "  2. Server is accessible: ping $SERVER_IP"
        echo "  3. SSH service is running on server"
        exit 1
    fi
    log_info "SSH connection OK"
    
    # Check if local path exists
    if [ ! -d "$LOCAL_PATH" ]; then
        log_error "Local path not found: $LOCAL_PATH"
        exit 1
    fi
    log_info "Local path exists: $LOCAL_PATH"
    
    # Check if git is clean (optional)
    if [ -d ".git" ]; then
        if ! git diff-index --quiet HEAD --; then
            log_warn "You have uncommitted changes!"
            read -p "Continue anyway? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

# ==========================================
# Sync Functions
# ==========================================

# Full sync - all files
sync_full() {
    log_info "Starting FULL sync to server..."
    
    # Build Next.js app first
    log_info "Building Next.js application..."
    cd "$LOCAL_PATH"
    npm run build
    
    # Sync all files
    log_info "Syncing files..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next/cache' \
        --exclude '.env.local' \
        --exclude '.env.development' \
        --exclude 'coverage' \
        --exclude '.git' \
        --exclude 'logs' \
        --exclude '*.log' \
        "$LOCAL_PATH/" \
        $SERVER_USER@$SERVER_IP:$SERVER_PATH/
    
    # Install dependencies on server
    log_info "Installing dependencies on server..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npm install --production"
    
    # Restart application
    restart_app
    
    log_info "Full sync completed!"
}

# Quick sync - only changed files
sync_quick() {
    log_info "Starting QUICK sync..."
    
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.env.local' \
        --exclude '.env.development' \
        --exclude '.git' \
        --exclude 'logs' \
        --exclude '*.log' \
        "$LOCAL_PATH/app/" \
        $SERVER_USER@$SERVER_IP:$SERVER_PATH/app/
    
    rsync -avz --progress \
        --exclude 'node_modules' \
        "$LOCAL_PATH/components/" \
        $SERVER_USER@$SERVER_IP:$SERVER_PATH/components/
    
    rsync -avz --progress \
        --exclude 'node_modules' \
        "$LOCAL_PATH/lib/" \
        $SERVER_USER@$SERVER_IP:$SERVER_PATH/lib/
    
    # Restart application
    restart_app
    
    log_info "Quick sync completed!"
}

# Database sync
sync_database() {
    log_info "Starting DATABASE sync..."
    
    # Export local database
    log_info "Exporting local database..."
    cd "$LOCAL_PATH"
    npx prisma migrate diff \
        --from-schema-datasource prisma/schema.prisma \
        --to-schema-datamodel prisma/schema.prisma \
        --script > /tmp/db_sync.sql
    
    # Copy to server
    log_info "Copying database to server..."
    scp /tmp/db_sync.sql $SERVER_USER@$SERVER_IP:/tmp/
    
    # Apply on server
    log_info "Applying database changes on server..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npx prisma db push --accept-data-loss"
    
    log_info "Database sync completed!"
}

# Environment files sync
sync_env() {
    log_warn "Syncing environment files..."
    log_warn "This will overwrite production .env files!"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_info "Aborted"
        exit 0
    fi
    
    # Sync .env.production
    if [ -f "$LOCAL_PATH/.env.production" ]; then
        log_info "Syncing .env.production..."
        rsync -avz "$LOCAL_PATH/.env.production" \
            $SERVER_USER@$SERVER_IP:$SERVER_PATH/.env.production
    fi
    
    log_info "Environment files synced!"
}

# Restart application
restart_app() {
    log_info "Restarting application on server..."
    
    # Try PM2 first (if installed)
    ssh $SERVER_USER@$SERVER_IP "
        if command -v pm2 &> /dev/null; then
            pm2 restart all
        elif systemctl is-active --quiet nginx; then
            systemctl restart nginx
        else
            echo 'No process manager found. Manual restart may be needed.'
        fi
    "
    
    log_info "Application restarted!"
}

# ==========================================
# Main Menu
# ==========================================
show_menu() {
    echo ""
    echo "========================================"
    echo "  YIWU EXPRESS - Sync to Server"
    echo "========================================"
    echo "Server: $SERVER_IP"
    echo "Path:   $SERVER_PATH"
    echo ""
    echo "Options:"
    echo "  1) Full sync     - Build & sync everything"
    echo "  2) Quick sync    - Only changed files"
    echo "  3) Database sync - Sync database schema"
    echo "  4) Env sync      - Sync environment files"
    echo "  5) Restart app   - Restart application only"
    echo "  6) SSH to server - Open SSH connection"
    echo "  7) Exit"
    echo ""
}

# ==========================================
# Main Execution
# ==========================================
main() {
    # If argument provided, run that option directly
    if [ $# -gt 0 ]; then
        case $1 in
            --full)
                preflight_checks
                sync_full
                ;;
            --quick)
                preflight_checks
                sync_quick
                ;;
            --db)
                preflight_checks
                sync_database
                ;;
            --env)
                preflight_checks
                sync_env
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Usage: $0 [--full|--quick|--db|--env]"
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Interactive menu
    preflight_checks
    
    while true; do
        show_menu
        read -p "Select option (1-7): " choice
        
        case $choice in
            1)
                sync_full
                ;;
            2)
                sync_quick
                ;;
            3)
                sync_database
                ;;
            4)
                sync_env
                ;;
            5)
                restart_app
                ;;
            6)
                log_info "Opening SSH connection..."
                ssh $SERVER_USER@$SERVER_IP
                ;;
            7)
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac
        
        read -p "Press Enter to continue..."
    done
}

# Run main
main "$@"
