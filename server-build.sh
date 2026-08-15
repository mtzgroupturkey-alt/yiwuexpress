#!/bin/bash
# =============================================================================
# DROMKOK APK Build Script for Server (39.175.57.2)
# =============================================================================
# Upload this file to server and run: bash server-build.sh
# Or copy-paste commands one by one

set -e  # Exit on error

echo "=========================================="
echo "  DROMKOK Mobile APK Build (Server)"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Node.js version
echo -e "${YELLOW}[1/7] Checking Node.js version...${NC}"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node --version)"
    echo ""
    echo "To install Node 18:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  source ~/.bashrc"
    echo "  nvm install 18"
    echo "  nvm use 18"
    exit 1
else
    echo -e "${GREEN}✓ Node.js $(node --version) detected${NC}"
fi
echo ""

# Step 2: Navigate to mobile directory
echo -e "${YELLOW}[2/7] Navigating to mobile directory...${NC}"
MOBILE_DIR="/www/wwwroot/www.dromkok.com/mobile"

if [ ! -d "$MOBILE_DIR" ]; then
    echo -e "${RED}Error: Mobile directory not found at $MOBILE_DIR${NC}"
    echo ""
    echo "Please upload the mobile folder first:"
    echo "  scp -r \"C:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile\" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/"
    exit 1
fi

cd "$MOBILE_DIR"
echo -e "${GREEN}✓ Changed to $MOBILE_DIR${NC}"
echo ""

# Step 3: Check if dependencies are installed
echo -e "${YELLOW}[3/7] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Check EAS CLI
echo -e "${YELLOW}[4/7] Checking EAS CLI...${NC}"
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI globally..."
    npm install -g eas-cli
    echo -e "${GREEN}✓ EAS CLI installed${NC}"
else
    echo -e "${GREEN}✓ EAS CLI already installed ($(eas --version))${NC}"
fi
echo ""

# Step 5: Check login status
echo -e "${YELLOW}[5/7] Checking Expo login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${RED}You are not logged in to Expo.${NC}"
    echo "Please login:"
    eas login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Login failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Logged in as: $(eas whoami)${NC}"
fi
echo ""

# Step 6: Check project configuration
echo -e "${YELLOW}[6/7] Checking project configuration...${NC}"
if [ ! -f "eas.json" ]; then
    echo "Configuring project..."
    eas build:configure
    echo -e "${GREEN}✓ Project configured${NC}"
else
    echo -e "${GREEN}✓ Project already configured${NC}"
fi
echo ""

# Step 7: Start build
echo -e "${YELLOW}[7/7] Starting APK build...${NC}"
echo ""
echo "=========================================="
echo "  Build Configuration"
echo "=========================================="
echo "Platform:     Android"
echo "Profile:      preview"
echo "Build type:   APK"
echo "API URL:      https://www.dromkok.com"
echo "Build time:   ~10-15 minutes"
echo ""
echo "=========================================="
echo ""

read -p "Start build now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    eas build --platform android --profile preview
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo -e "${GREEN}✓ Build submitted successfully!${NC}"
        echo "=========================================="
        echo ""
        echo "Your build is now processing on Expo servers."
        echo ""
        echo "To check build status:"
        echo "  eas build:list"
        echo ""
        echo "To download when complete:"
        echo "  Visit: https://expo.dev"
        echo "  Or use the URL provided above"
        echo ""
    else
        echo ""
        echo "=========================================="
        echo -e "${RED}✗ Build submission failed${NC}"
        echo "=========================================="
        echo ""
        echo "Check logs above for details."
        echo ""
    fi
else
    echo "Build cancelled."
fi
