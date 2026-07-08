#!/bin/bash
# ==========================================
# SSL Certificate Verification Script
# ==========================================
# Usage: bash verify_certificate.sh
# This script verifies your SSL certificates are properly configured

set -e

echo "🔍 SSL Certificate Verification Tool"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️ INFO${NC}: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️ WARNING${NC}: $1"
}

# Paths
CERT_DIR="/etc/nginx/ssl/dromkok.com"
CERT_FILE="$CERT_DIR/dromkok.com_bundle.crt"
KEY_FILE="$CERT_DIR/dromkok.com.key"
PEM_FILE="$CERT_DIR/dromkok.com_bundle.pem"

echo "📂 Certificate Directory: $CERT_DIR"
echo ""

# ==========================================
# Check 1: Files exist
# ==========================================
echo "🔎 Check 1: Certificate files exist"
echo "---"

[ -f "$CERT_FILE" ] && print_status 0 "Certificate bundle found" || print_status 1 "Certificate bundle NOT found"
[ -f "$KEY_FILE" ] && print_status 0 "Private key found" || print_status 1 "Private key NOT found"
[ -f "$PEM_FILE" ] && print_status 0 "PEM format found" || print_status 1 "PEM format NOT found"
echo ""

# ==========================================
# Check 2: File permissions
# ==========================================
echo "🔎 Check 2: File permissions"
echo "---"

CERT_PERM=$(stat -f %OLp "$CERT_FILE" 2>/dev/null || stat -c %a "$CERT_FILE" 2>/dev/null)
KEY_PERM=$(stat -f %OLp "$KEY_FILE" 2>/dev/null || stat -c %a "$KEY_FILE" 2>/dev/null)

if [ "$KEY_PERM" = "0600" ] || [ "$KEY_PERM" = "600" ]; then
    print_status 0 "Private key permissions are secure (600)"
else
    print_status 1 "Private key permissions are NOT secure: $KEY_PERM"
fi

if [ "$CERT_PERM" = "0644" ] || [ "$CERT_PERM" = "644" ]; then
    print_status 0 "Certificate permissions are correct (644)"
else
    print_warning "Certificate permissions: $CERT_PERM"
fi
echo ""

# ==========================================
# Check 3: Certificate validity
# ==========================================
echo "🔎 Check 3: Certificate validity"
echo "---"

if openssl x509 -in "$CERT_FILE" -noout -checkend 0 >/dev/null 2>&1; then
    print_status 0 "Certificate is valid (not expired)"
else
    print_status 1 "Certificate is EXPIRED or invalid"
fi

# Extract expiration date
EXPIRATION=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
EPOCH_EXPIRATION=$(date -d "$EXPIRATION" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRATION" +%s 2>/dev/null)
EPOCH_NOW=$(date +%s)
DAYS_REMAINING=$(( ($EPOCH_EXPIRATION - $EPOCH_NOW) / 86400 ))

print_info "Expires: $EXPIRATION"
if [ $DAYS_REMAINING -lt 30 ]; then
    print_warning "Certificate expires in $DAYS_REMAINING days - RENEW SOON!"
elif [ $DAYS_REMAINING -lt 90 ]; then
    print_warning "Certificate expires in $DAYS_REMAINING days - Plan renewal"
else
    print_info "Certificate valid for $DAYS_REMAINING days"
fi
echo ""

# ==========================================
# Check 4: Certificate subject
# ==========================================
echo "🔎 Check 4: Certificate subject information"
echo "---"

SUBJECT=$(openssl x509 -in "$CERT_FILE" -noout -subject)
CN=$(echo "$SUBJECT" | grep -oP 'CN=\K[^/,]+' || echo "Not found")
ISSUER=$(openssl x509 -in "$CERT_FILE" -noout -issuer | grep -oP 'issuer=.*CN=\K[^/,]+' || echo "Not found")

print_info "Subject: $SUBJECT"
print_info "Common Name (CN): $CN"
print_info "Issuer: $ISSUER"

if [[ "$CN" == *"dromkok.com"* ]]; then
    print_status 0 "Domain matches (contains dromkok.com)"
else
    print_status 1 "Domain mismatch: $CN"
fi
echo ""

# ==========================================
# Check 5: Certificate and key match
# ==========================================
echo "🔎 Check 5: Certificate and key match"
echo "---"

CERT_MODULUS=$(openssl x509 -noout -modulus -in "$CERT_FILE" | openssl md5 | cut -d= -f2 | tr -d ' ')
KEY_MODULUS=$(openssl rsa -noout -modulus -in "$KEY_FILE" 2>/dev/null | openssl md5 | cut -d= -f2 | tr -d ' ')

if [ "$CERT_MODULUS" = "$KEY_MODULUS" ]; then
    print_status 0 "Certificate and private key match"
else
    print_status 1 "Certificate and private key DO NOT match"
fi
echo ""

# ==========================================
# Check 6: Certificate chain
# ==========================================
echo "🔎 Check 6: Certificate chain"
echo "---"

CERT_COUNT=$(openssl crl2pkcs7 -nocrl -certfile "$CERT_FILE" 2>/dev/null | \
             openssl pkcs7 -print_certs -noout 2>/dev/null | grep -c "subject=" || echo "0")

if [ "$CERT_COUNT" -gt 0 ]; then
    print_status 0 "Certificate chain contains $CERT_COUNT certificate(s)"
    
    openssl crl2pkcs7 -nocrl -certfile "$CERT_FILE" 2>/dev/null | \
    openssl pkcs7 -print_certs -noout 2>/dev/null | grep "subject=" | nl
else
    print_warning "Could not parse certificate chain"
fi
echo ""

# ==========================================
# Check 7: Nginx configuration
# ==========================================
echo "🔎 Check 7: Nginx configuration"
echo "---"

NGINX_CONFIG="/etc/nginx/sites-available/dromkok.com"

if [ -f "$NGINX_CONFIG" ]; then
    print_status 0 "Nginx config file found: $NGINX_CONFIG"
    
    if grep -q "ssl_certificate.*$CERT_FILE" "$NGINX_CONFIG"; then
        print_status 0 "Certificate path correctly configured"
    else
        print_status 1 "Certificate path not found in config"
    fi
    
    if grep -q "ssl_certificate_key.*$KEY_FILE" "$NGINX_CONFIG"; then
        print_status 0 "Private key path correctly configured"
    else
        print_status 1 "Private key path not found in config"
    fi
else
    print_status 1 "Nginx config not found at $NGINX_CONFIG"
fi
echo ""

# ==========================================
# Check 8: Nginx status
# ==========================================
echo "🔎 Check 8: Nginx status"
echo "---"

if command -v nginx &> /dev/null; then
    if nginx -t >/dev/null 2>&1; then
        print_status 0 "Nginx configuration is valid"
    else
        print_status 1 "Nginx configuration has errors"
        nginx -t
    fi
    
    if systemctl is-active --quiet nginx; then
        print_status 0 "Nginx is running"
    else
        print_status 1 "Nginx is NOT running"
    fi
else
    print_warning "Nginx not found on system"
fi
echo ""

# ==========================================
# Check 9: Port accessibility
# ==========================================
echo "🔎 Check 9: Port accessibility"
echo "---"

if nc -z localhost 443 >/dev/null 2>&1; then
    print_status 0 "Port 443 (HTTPS) is open"
else
    print_warning "Port 443 not accessible (may be normal if behind proxy)"
fi

if nc -z localhost 80 >/dev/null 2>&1; then
    print_status 0 "Port 80 (HTTP) is open"
else
    print_warning "Port 80 not accessible"
fi
echo ""

# ==========================================
# Check 10: Certificate verification
# ==========================================
echo "🔎 Check 10: Certificate self-verification"
echo "---"

if openssl verify -CAfile "$CERT_FILE" "$CERT_FILE" >/dev/null 2>&1; then
    print_status 0 "Certificate chain verification passed"
else
    print_warning "Certificate chain verification warning (may be normal for self-signed)"
fi
echo ""

# ==========================================
# Summary
# ==========================================
echo "🎯 Summary"
echo "=========="
echo ""
print_info "Certificate Domain: $CN"
print_info "Issuer: $ISSUER"
print_info "Expiration: $EXPIRATION"
print_info "Days Remaining: $DAYS_REMAINING"
echo ""
echo "📊 For detailed information, check:"
echo "   - Access logs: /var/log/nginx/www.dromkok.com_access.log"
echo "   - Error logs: /var/log/nginx/www.dromkok.com_error.log"
echo ""
echo "🧪 Test online at:"
echo "   - SSL Labs: https://www.ssllabs.com/ssltest/?d=www.dromkok.com"
echo "   - SSL Checker: https://www.sslshopper.com/ssl-checker.html?domain=www.dromkok.com"
echo "   - Security Headers: https://securityheaders.com/?q=www.dromkok.com"
echo ""
echo "✨ Verification complete!"
