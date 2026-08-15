#!/bin/bash

# Test script for public routes middleware fix
# Tests that public routes are accessible without login redirect

echo "======================================"
echo "Testing Public Routes Middleware Fix"
echo "======================================"
echo ""

BASE_URL="${1:-http://localhost:3001}"
FAIL_COUNT=0

test_route() {
  local url="$1"
  local description="$2"
  
  echo -n "Testing: $description ... "
  
  # Use curl to follow redirects and check final URL
  response=$(curl -s -L -o /dev/null -w "%{http_code}|%{url_effective}" "$url")
  status_code=$(echo "$response" | cut -d'|' -f1)
  final_url=$(echo "$response" | cut -d'|' -f2)
  
  # Check if redirected to login
  if [[ "$final_url" == *"/login"* ]]; then
    echo "❌ FAIL - Redirected to login"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    return 1
  elif [[ "$status_code" == "200" ]]; then
    echo "✅ PASS - Status $status_code"
    return 0
  else
    echo "⚠️  WARNING - Status $status_code"
    return 0
  fi
}

echo "Testing English Routes:"
echo "----------------------"
test_route "$BASE_URL/" "Homepage (root)"
test_route "$BASE_URL/en" "Homepage (EN)"
test_route "$BASE_URL/en/products" "Products (EN)"
test_route "$BASE_URL/en/about" "About (EN)"
test_route "$BASE_URL/en/contact" "Contact (EN)"
test_route "$BASE_URL/en/services" "Services (EN)"
test_route "$BASE_URL/en/wholesale" "Wholesale (EN)"
echo ""

echo "Testing Russian Routes:"
echo "----------------------"
test_route "$BASE_URL/ru" "Homepage (RU)"
test_route "$BASE_URL/ru/products" "Products (RU)"
test_route "$BASE_URL/ru/about" "About (RU)"
test_route "$BASE_URL/ru/contact" "Contact (RU)"
echo ""

echo "Testing Chinese Routes:"
echo "----------------------"
test_route "$BASE_URL/zh" "Homepage (ZH)"
test_route "$BASE_URL/zh/products" "Products (ZH)"
test_route "$BASE_URL/zh/about" "About (ZH)"
test_route "$BASE_URL/zh/contact" "Contact (ZH)"
echo ""

echo "Testing Static Assets:"
echo "----------------------"
# Note: These will 404 if not built, but should NOT redirect to login
test_route "$BASE_URL/_next/static/css/test.css" "CSS file (should not redirect to login)"
test_route "$BASE_URL/favicon.ico" "Favicon"
echo ""

echo "Testing Protected Routes (Should Redirect to Login):"
echo "---------------------------------------------------"
response=$(curl -s -L -o /dev/null -w "%{url_effective}" "$BASE_URL/dashboard")
if [[ "$response" == *"/login"* ]]; then
  echo "✅ PASS - Dashboard redirects to login"
else
  echo "❌ FAIL - Dashboard should redirect to login"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

response=$(curl -s -L -o /dev/null -w "%{url_effective}" "$BASE_URL/admin")
if [[ "$response" == *"/login"* ]]; then
  echo "✅ PASS - Admin redirects to login"
else
  echo "❌ FAIL - Admin should redirect to login"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "======================================"
if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ $FAIL_COUNT test(s) failed"
  exit 1
fi
