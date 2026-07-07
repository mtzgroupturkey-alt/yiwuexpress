# 🔧 AUTOMATIC ENVIRONMENT DETECTION - SETUP GUIDE

## ✅ SYSTEM CREATED - AUTO-DETECTS LOCAL VS PRODUCTION!

Your application now **automatically detects** whether it's running locally or on dromkok.com and uses the correct database credentials!

---

## 🎯 HOW IT WORKS

### Automatic Detection Methods:

1. **Checks NODE_ENV** (production vs development)
2. **Checks domain name** (dromkok.com = production)
3. **Checks API URL** (contains dromkok.com = production)
4. **Checks hostname** (server hostname detection)

### Automatic Configuration:

**🏠 LOCAL (Development):**
- Database: `postgresql://postgres:balkhi123@localhost:5432/ecommerce`
- Environment: `development`
- Debug logs: Enabled
- CORS: Localhost allowed

**🌐 PRODUCTION (dromkok.com):**
- Database: `postgresql://root:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce`
- Environment: `production`
- Debug logs: Disabled
- CORS: dromkok.com only

---

## 📁 FILES CREATED

### 1. Environment Files

```
web/
├── .env.example          # Template (commit to Git)
├── .env.local           # Local development (DO NOT COMMIT)
└── .env.production      # Production settings (DO NOT COMMIT)
```

### 2. Configuration Files

```
web/lib/
├── config.ts            # Main configuration system
├── db-detector.ts       # Database auto-detection
└── db.ts                # Updated Prisma client (auto-detects environment)
```

### 3. Test Endpoint

```
web/app/api/test-db/route.ts    # Test database connection
```

---

## 🚀 SETUP INSTRUCTIONS

### FOR LOCAL DEVELOPMENT:

**1. The .env.local file is already created with your local settings!**

Just verify it exists:
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
type .env.local
```

You should see:
```env
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"
NODE_ENV="development"
...
```

**2. Start your local server:**
```bash
npm run dev
```

**3. Test the connection:**
Visit: http://localhost:3001/api/test-db

You should see:
```json
{
  "success": true,
  "environment": "development",
  "database": {
    "host": "localhost",
    "database": "ecommerce"
  }
}
```

✅ **Local setup complete!**

---

### FOR PRODUCTION (dromkok.com):

**1. Upload .env.production to your server**

Use FTP/cPanel and upload `.env.production` to:
```
/var/www/dromkok.com/web/.env.production
```

Or create it directly on the server:
```bash
nano /var/www/dromkok.com/web/.env.production
```

Paste this content:
```env
DATABASE_URL="postgresql://root:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
JWT_SECRET="[GENERATE_SECURE_RANDOM_STRING_64_CHARS]"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=3001
HOSTNAME="0.0.0.0"
NEXT_PUBLIC_API_URL=https://dromkok.com
ALLOWED_ORIGINS=https://dromkok.com,https://www.dromkok.com
```

**2. Generate secure JWT_SECRET:**

On your server, run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and replace `JWT_SECRET` in `.env.production`

**3. Rename to .env:**

Next.js loads `.env.production` automatically in production, but to be safe:
```bash
cp .env.production .env
```

**4. Build and start:**
```bash
npm install
npx prisma generate
npm run build
npm start
```

**5. Test production connection:**

Visit: https://dromkok.com/api/test-db

You should see:
```json
{
  "success": true,
  "environment": "production",
  "database": {
    "host": "localhost",
    "database": "ecommerce"
  }
}
```

✅ **Production setup complete!**

---

## 🔍 VERIFY ENVIRONMENT DETECTION

### Test 1: Check Logs

When you start the application, you'll see:

**Local:**
```
🗄️  Database [DEVELOPMENT]: postgresql://postgres:****@localhost:5432/ecommerce
```

**Production:**
```
🗄️  Database [PRODUCTION]: postgresql://root:****@localhost:5432/ecommerce
```

### Test 2: API Test Endpoint

**Local:** http://localhost:3001/api/test-db  
**Production:** https://dromkok.com/api/test-db

### Test 3: Manual Check

Add this to any API route:
```typescript
import { config } from '@/lib/config';

console.log('Environment:', config.environment.name);
console.log('Database:', config.database.database);
```

---

## 🔒 SECURITY FEATURES

### ✅ What's Protected:

1. **Never commits credentials to Git**
   - `.env.local` and `.env.production` in .gitignore
   - Only `.env.example` is committed

2. **Passwords hidden in logs**
   - Database URL masks password: `postgresql://user:****@host...`

3. **Environment validation**
   - Checks for required variables on startup
   - Warns if using weak/default secrets in production

4. **CORS protection**
   - Only allows requests from configured domains
   - Different settings for local vs production

5. **JWT secrets**
   - Separate secrets for dev and production
   - Validates minimum length (64 characters)

---

## 🧪 TESTING

### Test Database Connection

```bash
# Local
curl http://localhost:3001/api/test-db

# Production
curl https://dromkok.com/api/test-db
```

### Test Environment Detection

Create a test page: `web/app/api/env-info/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    environment: config.environment.name,
    apiUrl: config.api.baseUrl,
    databaseHost: config.database.host,
  });
}
```

Visit:
- Local: http://localhost:3001/api/env-info
- Production: https://dromkok.com/api/env-info

---

## 📊 CONFIGURATION SYSTEM

### Available Config Objects

```typescript
import { config } from '@/lib/config';

// Environment info
config.environment.isProduction  // true/false
config.environment.isDevelopment // true/false
config.environment.name          // "PRODUCTION" or "DEVELOPMENT"

// Database
config.database.url              // Connection string
config.database.host             // Database host
config.database.database         // Database name

// Server
config.server.port               // Port number
config.server.hostname           // Server hostname
config.server.nodeEnv            // Node environment

// API
config.api.baseUrl               // API base URL
config.api.allowedOrigins        // Allowed CORS origins

// JWT
config.jwt.secret                // JWT secret key
config.jwt.expiresIn            // Token expiration

// Email
config.email.host                // SMTP host
config.email.port                // SMTP port

// Payment
config.payment.stripe.enabled    // Stripe enabled?
config.payment.paypal.enabled    // PayPal enabled?

// Security
config.security.bcryptRounds     // Password hash rounds
config.security.maxLoginAttempts // Max login attempts
```

---

## 🔧 USAGE IN YOUR CODE

### Example 1: Database Query

```typescript
import { prisma } from '@/lib/db';

// Automatically uses correct database!
export async function getProducts() {
  return await prisma.product.findMany();
}
```

### Example 2: API Routes

```typescript
import { config } from '@/lib/config';

export async function POST(request: Request) {
  if (config.environment.isProduction) {
    // Production-specific logic
  } else {
    // Development-specific logic
  }
}
```

### Example 3: Environment-Specific Features

```typescript
import { config } from '@/lib/config';

if (config.payment.stripe.enabled) {
  // Initialize Stripe
}

if (config.email.enabled) {
  // Send emails
}
```

---

## ⚠️ IMPORTANT SECURITY NOTES

### DO NOT:

❌ Commit `.env.local` or `.env.production` to Git  
❌ Share production credentials in chat/email  
❌ Use default JWT_SECRET in production  
❌ Expose API keys in client-side code  
❌ Use root database user (create limited user instead)

### DO:

✅ Keep `.env.example` updated (without real credentials)  
✅ Use strong, unique JWT_SECRET in production  
✅ Regularly rotate database passwords  
✅ Use environment variables for all secrets  
✅ Test database connection before deploying

---

## 🔄 UPDATING CONFIGURATION

### Add New Environment Variable:

1. **Add to `.env.example`** (with placeholder)
2. **Add to `.env.local`** (your local value)
3. **Add to `.env.production`** (production value)
4. **Add to `lib/config.ts`** (read the variable)
5. **Use in your code**

Example:
```typescript
// lib/config.ts
export const myNewConfig = {
  myValue: process.env.MY_NEW_VALUE || 'default',
};
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot connect to database"

**Check:**
1. Is PostgreSQL running?
2. Is the database created? (`ecommerce`)
3. Are credentials correct in `.env` file?
4. Can you connect manually? `psql -U postgres -d ecommerce`

**Test:**
```bash
# Local
curl http://localhost:3001/api/test-db

# Should return connection status
```

### Issue: "Using wrong database"

**Check:**
1. What does the log say when starting?
2. Visit `/api/test-db` to see detected environment
3. Check `NODE_ENV` variable
4. Check domain name detection

**Debug:**
```typescript
import { detectEnvironment, getDatabaseUrl } from '@/lib/db-detector';

console.log('Environment:', detectEnvironment());
console.log('Database URL:', getDatabaseUrl());
```

### Issue: "Environment variables not loading"

**Solutions:**
1. Restart dev server after changing `.env` files
2. Ensure `.env.local` exists in `web/` folder
3. Check for syntax errors in `.env` file
4. Verify no quotes around values (unless needed)

---

## 📚 FILE STRUCTURE SUMMARY

```
web/
├── .env.example              # ✅ Commit (template)
├── .env.local               # ❌ Never commit (local dev)
├── .env.production          # ❌ Never commit (production)
│
├── lib/
│   ├── config.ts            # Main configuration system
│   ├── db-detector.ts       # Auto-detection logic
│   └── db.ts                # Prisma client (auto-configured)
│
└── app/api/
    └── test-db/
        └── route.ts         # Test endpoint
```

---

## ✅ QUICK START CHECKLIST

### Local Development:
- [ ] `.env.local` file exists
- [ ] Local database running
- [ ] `npm run dev` starts successfully
- [ ] Can access http://localhost:3001
- [ ] `/api/test-db` shows "development"

### Production Deployment:
- [ ] `.env.production` uploaded to server
- [ ] JWT_SECRET changed from default
- [ ] Production database created
- [ ] `npm run build` successful
- [ ] `npm start` runs in production
- [ ] https://dromkok.com accessible
- [ ] `/api/test-db` shows "production"

---

## 🎉 YOU'RE ALL SET!

Your application now automatically:
- ✅ Detects environment (local vs production)
- ✅ Uses correct database credentials
- ✅ Applies appropriate security settings
- ✅ Logs environment information
- ✅ Validates configuration on startup

**No manual switching required!**

Just run:
- **Locally:** `npm run dev` → Uses local database
- **Production:** `npm start` → Uses production database

---

## 📞 NEED HELP?

If you encounter issues:
1. Check `/api/test-db` endpoint
2. Review server logs
3. Verify `.env` files exist
4. Test database connection manually
5. Check this guide's troubleshooting section

---

**Configuration System Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ Ready to Use

🚀 **Happy Coding!**
