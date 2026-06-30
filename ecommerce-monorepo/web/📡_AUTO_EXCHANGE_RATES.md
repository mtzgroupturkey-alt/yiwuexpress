# 📡 AUTOMATIC EXCHANGE RATE UPDATES - COMPLETE GUIDE

## ✅ STATUS: READY TO USE

**Integration:** exchangerate-api.com  
**Features:** Manual sync + Daily auto-update  
**Cost:** FREE (1,500 requests/month)  

---

## 🚀 QUICK SETUP (5 Minutes)

### Step 1: Get FREE API Key

1. Visit: https://www.exchangerate-api.com/
2. Click **"Get Free Key"** or **"Sign Up"**
3. Enter your email address
4. Verify your email
5. Copy your API key (looks like: `abc123def456ghi789jkl012`)

**Free Plan Includes:**
- ✅ 1,500 API requests per month (~50 per day)
- ✅ Updates every hour
- ✅ 161 currencies supported
- ✅ No credit card required
- ✅ Commercial use allowed

---

### Step 2: Add API Key to Environment

1. Open `.env.local` file in the `web` folder
2. Add this line:

```env
EXCHANGE_RATE_API_KEY="your-api-key-here"
```

**Example:**
```env
EXCHANGE_RATE_API_KEY="abc123def456ghi789jkl012"
```

3. Save the file
4. Restart your development server:

```cmd
# Stop server (Ctrl+C)
npm run dev
```

---

### Step 3: Test the Integration

1. Go to: http://localhost:3005/admin/currencies
2. You should see a green **"Sync Rates"** button
3. Click **"Sync Rates"**
4. Wait a few seconds
5. ✅ Success! Rates updated from API

---

## 🎯 FEATURES

### 1. Manual Sync Button (✅ Ready)

**Location:** `/admin/currencies` page  
**Button:** Green "Sync Rates" button with ⚡ icon  

**What it does:**
- Fetches latest rates from exchangerate-api.com
- Updates all 6 currencies (CNY, EUR, GBP, JPY, RUB)
- Logs changes to history
- Shows success/error notification

**When to use:**
- Check rates before creating purchase orders
- Update after major economic events
- Verify rates before pricing decisions
- Manual override when needed

---

### 2. Automatic Daily Updates (⚡ Available)

**Endpoint:** `/api/cron/update-exchange-rates`  
**Method:** GET or POST  
**Frequency:** Once daily (recommended)  

**Setup Options:**

#### Option A: External Cron Service (Recommended)

**Free Services:**
- cron-job.org (free, reliable)
- EasyCron.com (free tier)
- GitHub Actions (free for public repos)

**Setup with cron-job.org:**

1. Visit: https://cron-job.org/
2. Create free account
3. Click "Create Cronjob"
4. Configure:
   - **Title:** "Update YIWU EXPRESS Currency Rates"
   - **URL:** `https://your-domain.com/api/cron/update-exchange-rates`
   - **Schedule:** Daily at 8:00 AM
   - **Method:** GET
   - **Headers:** `Authorization: Bearer your-cron-secret` (optional)
5. Save and enable

#### Option B: Vercel Cron Jobs

**For Vercel deployments:**

1. Create `vercel.json` in web folder:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-exchange-rates",
      "schedule": "0 8 * * *"
    }
  ]
}
```

2. Deploy to Vercel
3. Cron runs automatically every day at 8:00 AM UTC

#### Option C: GitHub Actions

**For GitHub-hosted projects:**

1. Create `.github/workflows/update-rates.yml`:

```yaml
name: Update Exchange Rates

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8:00 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  update-rates:
    runs-on: ubuntu-latest
    steps:
      - name: Call Update Endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/update-exchange-rates
```

2. Add `CRON_SECRET` to GitHub Secrets
3. Push to GitHub

---

## 🔧 API ENDPOINTS

### 1. Manual Sync
```
POST /api/admin/currencies/sync

Response:
{
  "success": true,
  "message": "Successfully updated 5 currency rates",
  "updated": 5
}
```

### 2. Test Connection
```
GET /api/admin/currencies/sync

Response:
{
  "success": true,
  "message": "Connected successfully. Last update: Sun, 29 Jun 2026 08:00:00 GMT",
  "configured": true
}
```

### 3. Automatic Update (Cron)
```
GET /api/cron/update-exchange-rates
Authorization: Bearer your-cron-secret (optional)

Response:
{
  "success": true,
  "message": "Successfully updated 5 currency rates",
  "updated": 5,
  "timestamp": "2026-06-29T08:00:00.000Z"
}
```

---

## 🔒 SECURITY

### Protecting Cron Endpoint

**Add CRON_SECRET to .env.local:**

```env
CRON_SECRET="your-random-long-secret-key-12345"
```

**Call endpoint with authorization:**

```bash
curl -X GET \
  -H "Authorization: Bearer your-random-long-secret-key-12345" \
  https://your-domain.com/api/cron/update-exchange-rates
```

**Without CRON_SECRET:** Endpoint is public (fine for read-only operations)  
**With CRON_SECRET:** Only requests with correct token are accepted

---

## 📊 HOW IT WORKS

### Exchange Rate API Call

```
GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD

Response:
{
  "result": "success",
  "base_code": "USD",
  "conversion_rates": {
    "USD": 1.0,
    "CNY": 7.2456,
    "EUR": 0.9234,
    "GBP": 0.7912,
    "JPY": 149.82,
    "RUB": 92.67,
    ...
  },
  "time_last_update_utc": "Sun, 29 Jun 2026 08:00:01 +0000"
}
```

### Update Process

```
1. Fetch rates from API (base: USD)
2. For each currency in database:
   - Extract rate from API response
   - Update currency.exchangeRate
   - Set currency.exchangeRateUpdatedAt = now
   - Create history record with source="api"
3. Return updated count
```

### Database Updates

```sql
-- Update Currency
UPDATE currencies 
SET exchange_rate = 7.2456, 
    exchange_rate_updated_at = NOW() 
WHERE code = 'CNY';

-- Log to History
INSERT INTO exchange_rate_history 
  (from_currency, to_currency, rate, source, notes)
VALUES 
  ('CNY', 'USD', 7.2456, 'api', 'Auto-updated from exchangerate-api.com');
```

---

## 🎯 USE CASES

### Use Case 1: Daily Auto-Update

**Setup:** cron-job.org configured to run daily at 8:00 AM

**Flow:**
```
1. 8:00 AM - Cron triggers endpoint
2. System fetches latest rates from API
3. All 5 currencies updated (CNY, EUR, GBP, JPY, RUB)
4. History records created
5. Email notification sent (optional)
```

**Result:**
- Rates always up-to-date
- No manual intervention needed
- Complete audit trail

---

### Use Case 2: Manual Refresh Before Orders

**Scenario:** Creating a large purchase order from China

**Flow:**
```
1. Admin opens /admin/currencies
2. Clicks "Sync Rates" button
3. Latest CNY rate fetched: 7.2456
4. Creates purchase order with current rate
5. Accurate cost calculation
```

**Result:**
- Real-time rate at moment of order
- Minimizes currency risk
- Accurate profit calculations

---

### Use Case 3: Emergency Rate Update

**Scenario:** Major currency fluctuation (e.g., Brexit vote)

**Flow:**
```
1. Admin receives alert about GBP drop
2. Opens /admin/currencies
3. Clicks "Sync Rates" immediately
4. New GBP rate: 0.7234 (was 0.7912)
5. All UK orders now priced correctly
```

**Result:**
- Instant response to market changes
- Protects profit margins
- Accurate customer pricing

---

## 📈 MONITORING

### Check Sync Status

**In Admin Panel:**
1. Go to `/admin/currencies`
2. Click "Exchange Rate History" tab
3. Look for `source="api"` entries
4. Check timestamps

**In Database:**
```sql
SELECT * FROM exchange_rate_history 
WHERE source = 'api' 
ORDER BY date DESC 
LIMIT 10;
```

### Verify Last Update

**In Admin Panel:**
1. Go to `/admin/currencies`
2. Check "Last Updated" column
3. Should be recent (today's date)

**Via API:**
```bash
curl http://localhost:3005/api/currencies
```

---

## 🧪 TESTING

### Test Manual Sync

```bash
# 1. Check current rates
curl http://localhost:3005/api/currencies

# 2. Trigger sync
curl -X POST http://localhost:3005/api/admin/currencies/sync

# 3. Verify update
curl http://localhost:3005/api/currencies
```

### Test Cron Endpoint

```bash
# Without secret
curl http://localhost:3005/api/cron/update-exchange-rates

# With secret
curl -H "Authorization: Bearer your-secret" \
  http://localhost:3005/api/cron/update-exchange-rates
```

### Test API Connection

```bash
curl http://localhost:3005/api/admin/currencies/sync
```

Expected response:
```json
{
  "success": true,
  "message": "Connected successfully. Last update: ...",
  "configured": true
}
```

---

## ⚠️ TROUBLESHOOTING

### Issue: "API key not configured"

**Solution:**
1. Check `.env.local` file exists
2. Verify `EXCHANGE_RATE_API_KEY="..."` line present
3. Ensure no spaces around `=`
4. Restart dev server: `npm run dev`

---

### Issue: "Sync Rates" button not visible

**Solution:**
1. API key not detected
2. Add API key to `.env.local`
3. Restart server
4. Refresh browser page

---

### Issue: Sync fails with 403 error

**Solution:**
1. API key invalid or expired
2. Get new key from exchangerate-api.com
3. Update `.env.local`
4. Try again

---

### Issue: Rates not updating automatically

**Solution:**
1. Check cron service is configured
2. Verify cron URL is correct
3. Check cron schedule is active
4. Review cron service logs
5. Test endpoint manually

---

### Issue: Wrong rates returned

**Solution:**
1. Check base currency is USD
2. Verify API response format
3. Clear cache: `npm run dev`
4. Check API status: https://status.exchangerate-api.com/

---

## 📊 RATE LIMITS

### Free Plan
- **Requests:** 1,500/month (~50/day)
- **Updates:** Hourly
- **Currencies:** 161
- **Support:** Email only

**Usage Tips:**
- Daily cron: 30 requests/month (well within limit)
- Manual syncs: ~20/month typical
- **Total:** ~50/month (3% of limit) ✅

### Paid Plans (Optional)

**Standard ($9/month):**
- 100,000 requests/month
- Updates: Every hour
- Email support

**Professional ($49/month):**
- 500,000 requests/month
- Updates: Every 10 minutes
- Priority support
- Historical data

---

## 🎯 BEST PRACTICES

### 1. Update Timing
- **Recommended:** Daily at 8:00 AM local time
- **Avoid:** Multiple updates per hour (wastes API calls)
- **Peak times:** Before business hours

### 2. Manual Syncs
- Before large purchase orders
- After major economic events
- When reviewing weekly reports
- Before setting new product prices

### 3. Monitoring
- Check history tab weekly
- Review update timestamps
- Verify all currencies updating
- Monitor for API errors

### 4. Security
- Never commit `.env.local` to git
- Use CRON_SECRET for production
- Rotate API keys annually
- Monitor API usage dashboard

---

## 📚 FILES CREATED

### Backend Services
- `lib/exchange-rate-service.ts` - API integration service
- `app/api/admin/currencies/sync/route.ts` - Manual sync endpoint
- `app/api/cron/update-exchange-rates/route.ts` - Cron endpoint

### Frontend Updates
- `app/admin/currencies/page.tsx` - Added "Sync Rates" button

### Configuration
- `.env.example` - Template with API key placeholder

### Documentation
- `📡_AUTO_EXCHANGE_RATES.md` - This file

---

## ✅ COMPLETION CHECKLIST

- [x] Exchange rate service created
- [x] API integration implemented
- [x] Manual sync endpoint added
- [x] Cron endpoint created
- [x] UI sync button added
- [x] API config detection
- [x] Success/error notifications
- [x] History logging
- [x] Security (optional CRON_SECRET)
- [x] Documentation complete
- [x] .env.example template

---

## 🎯 NEXT STEPS

### Immediate (Required)
1. ✅ Get API key from exchangerate-api.com
2. ✅ Add to `.env.local`
3. ✅ Restart server
4. ✅ Test "Sync Rates" button

### Optional (Recommended)
1. ⏰ Setup cron-job.org for daily updates
2. 🔒 Add CRON_SECRET for security
3. 📧 Add email notifications
4. 📊 Monitor usage dashboard

---

## 🎊 EXAMPLE WORKFLOW

### Daily Operations

**8:00 AM - Automatic Update:**
```
→ Cron triggers /api/cron/update-exchange-rates
→ API fetches latest rates
→ Database updated
→ History logged
→ Rates now current
```

**10:00 AM - Create Purchase Order:**
```
→ Admin goes to /admin/purchase-orders/new
→ Selects supplier (China)
→ Currency: CNY (rate: 7.2456 from morning update)
→ Cost ¥1000 = $138.01 USD
→ Order created with accurate rate
```

**2:00 PM - Urgent Rate Check:**
```
→ News: Yuan devalued
→ Admin opens /admin/currencies
→ Clicks "Sync Rates"
→ New CNY rate: 7.4123 (was 7.2456)
→ Updates existing orders if needed
```

---

## 📞 SUPPORT

### API Documentation
- **Website:** https://www.exchangerate-api.com/docs
- **Support:** support@exchangerate-api.com
- **Status:** https://status.exchangerate-api.com/

### Common Questions

**Q: How often are rates updated on the API?**  
A: Free plan: Hourly. Paid plans: Every 10-60 minutes.

**Q: What happens if API is down?**  
A: System continues using last known rates. Manual updates still work.

**Q: Can I use a different API?**  
A: Yes! Modify `lib/exchange-rate-service.ts` to use any API.

**Q: Do I need a paid plan?**  
A: No, free plan (1,500 req/month) is more than enough for daily updates.

**Q: Are rates real-time?**  
A: Near real-time (updated hourly on free plan). Good enough for most e-commerce.

---

## 🎉 SUCCESS!

**You now have automatic exchange rate updates! 🎊**

### What You Can Do:
✅ Click "Sync Rates" anytime for latest rates  
✅ Setup daily auto-updates via cron  
✅ Always have current exchange rates  
✅ Accurate multi-currency trading  
✅ Complete audit trail  

### Benefits:
💰 Accurate profit calculations  
🌍 Real-time global pricing  
📊 Historical rate tracking  
⚡ One-click rate updates  
🔄 Automatic daily sync  

---

**ENJOY AUTOMATIC EXCHANGE RATES! 📡💱✨**

**No more manual rate entry! 🎉**
