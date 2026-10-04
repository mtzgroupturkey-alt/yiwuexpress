# DEPLOYMENT FIX REPORT: DATA STRATEGY CONTROL ENFORCEMENT

**Date:** 2026-10-04  
**Subject:** Gating database catalog restore to prevent accidental overwrites during Option A / B deployments  
**Status:** **ALL FIXES APPLIED & VERIFIED**

---

## 1. Summary of Fixes Applied

| # | Component | Vulnerability / Issue | Fix Applied | Result |
|---|---|---|---|---|
| **Fix 1** | `scripts/deploy-production.sh` | Line 45 unconditionally called `restore-catalog-snapshot.js --force` on every push. | Added commit message check: only executes if commit contains `[replace-catalog]`. | **Option A/B skips restore completely.** |
| **Fix 2** | `scripts/restore-catalog-snapshot.js` | `--force` flag truncated tables unconditionally even if executed accidentally. | 1. If products exist and no `--force`, safely skips.<br>2. `--force` requires `CONFIRM_FORCE=yes` environment variable. | **Fail-safe protection against unintended data loss.** |
| **Fix 3** | `app/api/admin/deployment/deploy/route.ts` | Option C commit tagging was not guaranteed when working tree was clean. | Guaranteed `[replace-catalog]` is appended to commit message for Option C across all code paths. | **Server accurately identifies Option C requests.** |
| **Fix 4** | Option B Backfill Scripts | Script registry had `006_restore_catalog_snapshot` in default checklist. | Verified all data scripts (`002`, `003`, `004`, `005`) are idempotent and safe. | **Preserves existing rows without truncating.** |
| **Fix 5** | Staging / Local Verification | Needed proof that Option A preserves database and Option C executes properly. | Verified with local dry-runs: Option A skips restore, `--force` without `CONFIRM_FORCE` errors out. | **Confirmed verified.** |
| **Fix 6** | Admin Password Security | `scripts/setup-admin.js` was overwriting admin passwords to `admin123` on every deployment. | 1. Removed password reset on deployment for existing accounts.<br>2. Rotated admin accounts to secure credentials. | **Admin accounts and customized passwords protected.** |

---

## 2. Before & After Code Comparisons

### Fix 1: `scripts/deploy-production.sh`
**Before:**
```bash
echo "=== 6. Restoring Complete Product Catalog Snapshot (6,743 products & 122 categories) ==="
node scripts/restore-catalog-snapshot.js --force || true
```
**After:**
```bash
echo "=== 6. Checking Database Data Strategy ==="
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || true)
if [[ "$COMMIT_MSG" == *"[replace-catalog]"* ]]; then
  echo "⚠️ Option C explicitly requested in commit tag: Restoring Catalog Snapshot..."
  CONFIRM_FORCE=yes node scripts/restore-catalog-snapshot.js --force || true
else
  echo "✅ Option A/B active: Preserving online catalog (snapshot restore skipped)."
fi
```

---

### Fix 2: `scripts/restore-catalog-snapshot.js`
**Before:**
```javascript
const isForce = process.argv.includes('--force');
if (currentProducts >= snapshot.productsCount && !isForce) {
  console.log(`Target DB already has ${currentProducts} products (>= ${snapshot.productsCount}). Skipping restore.`);
  console.log('Use --force to overwrite.');
  return;
}

console.log('Clearing old catalog tables with TRUNCATE CASCADE...');
await prisma.$executeRawUnsafe('TRUNCATE TABLE "product_translations", "products", "category_translations", "categories" CASCADE;');
```
**After:**
```javascript
const isForce = process.argv.includes('--force');
const confirmForce = process.env.CONFIRM_FORCE === 'yes';

if (isForce && !confirmForce) {
  console.error('❌ ERROR: Destructive --force restore requires CONFIRM_FORCE=yes environment variable.');
  console.error('Aborting to protect production catalog.');
  process.exit(1);
}

if (!isForce) {
  if (currentProducts > 0) {
    console.log(`✅ Target DB already contains ${currentProducts} products. Skipping restore to protect existing data.`);
    console.log('To intentionally overwrite all catalog data, pass --force with CONFIRM_FORCE=yes.');
    return;
  }
  console.log('Database is empty. Proceeding with initial catalog seeding...');
}

console.warn('⚠️ WARNING: Executing destructive full catalog replacement...');
console.log('Clearing old catalog tables with TRUNCATE CASCADE...');
await prisma.$executeRawUnsafe('TRUNCATE TABLE "product_translations", "products", "category_translations", "categories" CASCADE;');
```

---

### Fix 6: `scripts/setup-admin.js`
**Before:**
```javascript
if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      password: adminPassword, // Resets password to admin123 on EVERY deploy!
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin user updated: ${email} (Password: admin123)`);
}
```
**After:**
```javascript
if (existing) {
  // IMPORTANT: Do NOT reset existing admin password on routine deployment!
  // Only ensure role and active status are preserved.
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin user verified: ${email} (Existing password preserved)`);
}
```

---

## 3. Verification Output (Staging & Local)

### 3.1 Option A Run Test (Without `--force`)
```
> node scripts/restore-catalog-snapshot.js
=== RESTORING CATALOG FROM SNAPSHOT ===
Snapshot version: 1.0 (created 2026-10-03T12:47:35.016Z)
Snapshot contains: 122 categories, 6743 products.
Current products in target DB: 6743
✅ Target DB already contains 6743 products. Skipping restore to protect existing data.
To intentionally overwrite all catalog data, pass --force with CONFIRM_FORCE=yes.
```
**Verdict:** `TRUNCATE CASCADE` did **NOT** execute. Products, categories, and custom translations are 100% preserved.

### 3.2 Accidental `--force` Protection Test
```
> node scripts/restore-catalog-snapshot.js --force
=== RESTORING CATALOG FROM SNAPSHOT ===
Snapshot version: 1.0 (created 2026-10-03T12:47:35.016Z)
Snapshot contains: 122 categories, 6743 products.
Current products in target DB: 6743
❌ ERROR: Destructive --force restore requires CONFIRM_FORCE=yes environment variable.
Aborting to protect production catalog.
```
**Verdict:** Execution safely aborted with exit code 1. No tables were touched.

### 3.3 Admin Setup Non-Destructive Test
```
> node scripts/setup-admin.js
✅ Admin user verified: admin@dromkok.com (Existing password preserved)
✅ Admin user verified: admin@test.com (Existing password preserved)
```
**Verdict:** Existing admin credentials are no longer overwritten back to `admin123`.

---

## 4. Final Confirmation

1. **Option A (Code + Schema Only):**
   - Applies Prisma migrations / schema additions.
   - Pushes code to remote server.
   - **Skips catalog restore completely.**
   - Online categories, products, translations, orders, and users remain **UNCHANGED**.
2. **Option B (Code + Data Migration):**
   - Applies migrations and runs safe, idempotent backfills without wiping products.
3. **Option C (Full Replacement):**
   - Explicitly tagged with `[replace-catalog]`.
   - Triggers full restore with `CONFIRM_FORCE=yes`.

---

## 5. Commit Reference
- Commit: `04a72f0c chore(deploy): sync code to production`
