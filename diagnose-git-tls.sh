#!/bin/bash

echo "================================================="
echo "🔍 Git TLS Diagnostic Script"
echo "================================================="

# System info
echo ""
echo "📋 System Information:"
echo "   OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "   Kernel: $(uname -r)"

# Git version
echo ""
echo "🔧 Git Configuration:"
git --version
echo "   SSL Backend: $(git config --get http.sslBackend || echo 'default')"
echo "   SSL Verify: $(git config --get http.sslVerify || echo 'true')"
echo "   HTTP Version: $(git config --get http.version || echo 'default')"

# Check TLS libraries
echo ""
echo "🔐 TLS Libraries:"
if ldd $(which git) | grep -i gnutls > /dev/null; then
  echo "   ✅ GnuTLS detected"
  gnutls-cli --version 2>/dev/null | head -1 || echo "   gnutls-cli not installed"
fi

if ldd $(which git) | grep -i openssl > /dev/null; then
  echo "   ✅ OpenSSL detected"
  openssl version
fi

# Test connectivity
echo ""
echo "🌐 Network Connectivity Tests:"

# Test DNS
echo "   Testing DNS resolution for github.com..."
if host github.com > /dev/null 2>&1; then
  echo "   ✅ DNS resolution successful"
  host github.com | head -3
else
  echo "   ❌ DNS resolution failed"
fi

# Test ping
echo ""
echo "   Testing ping to github.com..."
if ping -c 2 github.com > /dev/null 2>&1; then
  echo "   ✅ Ping successful"
else
  echo "   ⚠️ Ping failed (may be blocked by firewall)"
fi

# Test HTTPS
echo ""
echo "   Testing HTTPS connection to github.com..."
if curl -I https://github.com 2>/dev/null | head -1; then
  echo "   ✅ HTTPS connection successful"
else
  echo "   ❌ HTTPS connection failed"
fi

# Test git protocol
echo ""
echo "   Testing git ls-remote..."
if timeout 15 git ls-remote https://github.com/mtzgroupturkey-alt/dromkok.git HEAD > /dev/null 2>&1; then
  echo "   ✅ Git repository accessible"
else
  echo "   ❌ Git repository not accessible"
  echo "   Detailed error:"
  GIT_TRACE=1 GIT_CURL_VERBOSE=1 timeout 15 git ls-remote https://github.com/mtzgroupturkey-alt/dromkok.git HEAD 2>&1 | tail -20
fi

# Check firewall
echo ""
echo "🔥 Firewall Status:"
if command -v ufw > /dev/null 2>&1; then
  ufw status | head -5
elif command -v firewall-cmd > /dev/null 2>&1; then
  firewall-cmd --state
else
  echo "   No common firewall detected"
fi

# Suggestions
echo ""
echo "================================================="
echo "💡 Recommended Fixes:"
echo "================================================="
echo ""
echo "1️⃣ Update Git and TLS libraries:"
echo "   sudo apt update && sudo apt install -y git libcurl4-openssl-dev"
echo ""
echo "2️⃣ Configure Git to use OpenSSL (if available):"
echo "   git config --global http.sslBackend openssl"
echo ""
echo "3️⃣ Increase buffer and use HTTP/1.1:"
echo "   git config --global http.postBuffer 524288000"
echo "   git config --global http.version HTTP/1.1"
echo ""
echo "4️⃣ Temporary workaround (NOT recommended for production):"
echo "   git config --global http.sslVerify false"
echo ""
echo "5️⃣ Use SSH instead of HTTPS:"
echo "   git remote set-url origin git@github.com:mtzgroupturkey-alt/dromkok.git"
echo ""
echo "================================================="
