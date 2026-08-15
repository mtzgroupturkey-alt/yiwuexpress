#!/bin/bash
# test-deployment.sh - Test deployment pipeline components

echo "====================================="
echo "🧪 Testing Deployment Pipeline"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_command() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing $test_name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test file existence
test_file() {
    local test_name="$1"
    local file_path="$2"
    
    echo -n "Checking $test_name... "
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ NOT FOUND${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "📁 File Structure Tests"
echo "----------------------"
test_file "deploy.sh" "./deploy.sh"
test_file "ecosystem.config.js" "./ecosystem.config.js"
test_file "backup.sh" "./prisma/migrations/backup.sh"
test_file "rollback.sh" "./scripts/rollback.sh"
echo ""

echo "🔑 File Permissions Tests"
echo "-------------------------"
if [ -x "./deploy.sh" ]; then
    echo -e "deploy.sh permissions: ${GREEN}✅ EXECUTABLE${NC}"
    ((TESTS_PASSED++))
else
    echo -e "deploy.sh permissions: ${RED}❌ NOT EXECUTABLE${NC}"
    echo "  Fix: chmod +x deploy.sh"
    ((TESTS_FAILED++))
fi

if [ -x "./prisma/migrations/backup.sh" ]; then
    echo -e "backup.sh permissions: ${GREEN}✅ EXECUTABLE${NC}"
    ((TESTS_PASSED++))
else
    echo -e "backup.sh permissions: ${RED}❌ NOT EXECUTABLE${NC}"
    echo "  Fix: chmod +x prisma/migrations/backup.sh"
    ((TESTS_FAILED++))
fi

if [ -x "./scripts/rollback.sh" ]; then
    echo -e "rollback.sh permissions: ${GREEN}✅ EXECUTABLE${NC}"
    ((TESTS_PASSED++))
else
    echo -e "rollback.sh permissions: ${RED}❌ NOT EXECUTABLE${NC}"
    echo "  Fix: chmod +x scripts/rollback.sh"
    ((TESTS_FAILED++))
fi
echo ""

echo "🛠️ System Requirements Tests"
echo "----------------------------"
test_command "Node.js" "node --version"
test_command "NPM" "npm --version"
test_command "Git" "git --version"
test_command "PM2" "pm2 --version"
test_command "PostgreSQL" "which psql"
test_command "Prisma CLI" "npx prisma --version"
echo ""

echo "📦 Dependencies Tests"
echo "--------------------"
if [ -d "node_modules" ]; then
    echo -e "node_modules: ${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "node_modules: ${YELLOW}⚠️ NOT FOUND${NC}"
    echo "  Run: npm install"
fi

if [ -f "package-lock.json" ]; then
    echo -e "package-lock.json: ${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "package-lock.json: ${RED}❌ NOT FOUND${NC}"
    ((TESTS_FAILED++))
fi
echo ""

echo "🗄️ Database Tests"
echo "-----------------"
if [ -f "prisma/schema.prisma" ]; then
    echo -e "Prisma schema: ${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Prisma schema: ${RED}❌ NOT FOUND${NC}"
    ((TESTS_FAILED++))
fi

if [ -d ".next" ]; then
    echo -e "Next.js build: ${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Next.js build: ${YELLOW}⚠️ NOT FOUND${NC}"
    echo "  Run: npm run build"
fi
echo ""

echo "📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
