# Testing Company Settings Translations

## Quick Test Steps

### 1. Start Dev Server

```bash
cd ecommerce-monorepo/web
npm run dev
```

### 2. Login to Admin

Navigate to: `http://localhost:3001/admin/login`

### 3. Go to Company Settings

Navigate to: `http://localhost:3001/admin/settings/company`

### 4. Fill English Fields (Required)

**English (EN) tab (in the Localized section):**
- Company Name: `Global Trade`
- Company Description: `Leading logistics and trade services provider`
- Company Address: `123 Trade Street, Yiwu, Zhejiang, China`

**Note:** You should fill BOTH:
1. The main fields at the top of the form (Company Name, Description, Address)
2. The English tab in the "Localized Name / Description / Address" section

### 5. Fill Russian Translations

**Click "Русский" (RU) tab:**
- Company Name: `Глобальная торговля`
- Company Description: `Ведущий провайдер логистических и торговых услуг`
- Company Address: `ул. Торговая 123, Иу, Чжэцзян, Китай`

### 6. Fill Chinese Translations

**Click "中文" (ZH) tab:**
- Company Name: `全球贸易`
- Company Description: `领先的物流和贸易服务提供商`
- Company Address: `中国浙江省义乌市贸易街123号`

### 7. Save

Click **"Save Company Information"** button at the bottom

**Expected:**
- ✅ Green success message: "Company information updated successfully!"
- ✅ No errors in console

### 8. Reload Page

Press **Ctrl + R** or **F5** to reload the page

### 9. Verify Translations Saved

**Check English tab:**
- Click "English" (🇬🇧 EN) tab in the Localized section
- **VERIFY:** English translations are still there
- **VERIFY:** Text matches what you entered

**Check Russian tab:**
- Click "Русский" tab
- **VERIFY:** Russian translations are still there
- **VERIFY:** Text matches what you entered

**Check Chinese tab:**
- Click "中文" tab
- **VERIFY:** Chinese translations are still there
- **VERIFY:** Text matches what you entered

## Alternative: Use Auto-Translate

### 1. Fill English Fields Only

Fill in:
- Company Name: `Global Trade`
- Company Description: `Leading logistics provider`
- Company Address: `China`

### 2. Click Auto-Translate

Click the **"✨ Auto-Translate"** button at the top of the translation section

**Expected:**
- Button shows "Translating…" while processing
- After 2-3 seconds, Russian and Chinese tabs show generated translations
- Green toast message: "Auto-translation applied. Review and save."

### 3. Review Translations

- Click "Русский" tab → Check Russian translations look correct
- Click "中文" tab → Check Chinese translations look correct

### 4. Save

Click **"Save Company Information"**

### 5. Reload and Verify

- Reload page (Ctrl + R)
- Check both RU and ZH tabs
- **VERIFY:** Auto-generated translations are saved ✅

## Expected Results

### ✅ Success:
- Russian translations save and reload correctly
- Chinese translations save and reload correctly
- English fields save correctly
- Auto-translate generates and saves translations
- No console errors
- Success message appears after saving

### ❌ Failure (if these happen, report the bug):
- Translations disappear after reload
- Error message appears
- Console errors
- Auto-translate doesn't work
- Save button doesn't respond

## Database Verification (Optional)

If you want to verify translations in the database:

```sql
-- Check if SystemSettings exists
SELECT * FROM "SystemSettings" LIMIT 1;

-- Check all translations
SELECT * FROM "SystemSettingTranslation"
WHERE "systemSettingId" = (SELECT id FROM "SystemSettings" LIMIT 1)
ORDER BY locale, key;
```

**Expected rows:**

| locale | key | value |
|--------|-----|-------|
| en | companyName | Global Trade |
| en | companyDescription | Leading logistics... |
| en | companyAddress | 123 Trade Street... |
| ru | companyName | Глобальная торговля |
| ru | companyDescription | Ведущий провайдер... |
| ru | companyAddress | ул. Торговая 123... |
| zh | companyName | 全球贸易 |
| zh | companyDescription | 领先的物流... |
| zh | companyAddress | 中国浙江省义乌市... |

## Frontend Verification

After saving company settings, check if translations appear on the website:

### 1. Visit Russian Website

Navigate to: `http://localhost:3001/ru/`

**Check footer:**
- Company name should show Russian text: "Глобальная торговля"

### 2. Visit Chinese Website

Navigate to: `http://localhost:3001/zh/`

**Check footer:**
- Company name should show Chinese text: "全球贸易"

### 3. Visit English Website

Navigate to: `http://localhost:3001/en/`

**Check footer:**
- Company name should show English text: "Global Trade"

## Troubleshooting

### Problem: Translations don't save

**Solution 1:** Check browser console for errors

**Solution 2:** Restart dev server:
```bash
cd ecommerce-monorepo/web
npm run dev
```

**Solution 3:** Clear browser cache (Ctrl + Shift + Del)

### Problem: Auto-translate button is disabled

**Cause:** English fields must be filled first

**Solution:** Fill in all English (EN) fields, then try auto-translate

### Problem: Translations save but don't appear on website

**Cause:** Website may be using cached settings

**Solution:** 
1. Hard refresh website (Ctrl + Shift + R)
2. Check if company name component is using `useSettings()` or `useCompanyName()` hook
3. Verify API endpoint `/api/settings/public` returns translations

---

**Status:** Ready for Testing  
**Time Required:** 5-10 minutes  
**Difficulty:** Easy

Follow the steps above and report any issues!
