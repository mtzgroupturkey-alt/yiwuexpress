# DEPLOYMENT VERIFICATION REPORT: DATA STRATEGY & BYPASS ANALYSIS

**Date:** 2026-10-04  
**Target:** `/admin/deployment` Data Strategy Controls (Option A, B, C)  
**Status:** **CRITICAL BYPASS CONFIRMED**

---

## Executive Summary

The `/admin/deployment` UI and its local API endpoints (`app/api/admin/deployment/deploy` and `app/api/admin/deployment/execute`) correctly define the 3 options (Option A = Code only, Option B = Migrations, Option C = Replace Catalog).

However, **there is a severe disconnect between the UI selection and what actually runs on the production server**. 

Whenever code is pushed to branch `production` (even under Option A), **GitHub Actions executes a remote bash script (`scripts/deploy-production.sh`) that unconditionally runs `node scripts/restore-catalog-snapshot.js --force`**.

Because of the hardcoded `--force` flag in the bash script:
- `TRUNCATE TABLE "product_translations", "products", "category_translations", "categories" CASCADE;` is executed on the live database.
- Any category edits, newly added products, or translations customized online on `dromkok.com` are completely erased and replaced by the bundled local snapshot file (`catalog-snapshot.json.gz`).
- **The UI selection (Option A vs Option C) currently has NO effect on preventing this wipe during remote pushes.**

---

## 1. Phase 1 — Code Path Trace & Raw Evidence

### 1.1 Deployment UI (`app/admin/deployment/page.tsx`)
- **Location:** `ecommerce-monorepo/web/app/admin/deployment/page.tsx`
- **State Definition:** Line 104 defines `const [dataMode, setDataMode] = useState<DataMode>('A');`
- **Options Rendered:**
  - `Option A`: Code + Schema Only (`RECOMMENDED`) — Expected: Production data UNCHANGED
  - `Option B`: Code + Schema + Data Migration (`SAFE TRANSFORM`)
  - `Option C`: Replace Online Database with Local Catalog (`⚠️ FULL REPLACEMENT`)
- **Submission:** Lines 315–327 send `dataMode: 'A' | 'B' | 'C'` in the JSON body of `POST /api/admin/deployment/deploy`.

### 1.2 Deployment API Endpoint (`app/api/admin/deployment/deploy/route.ts`)
- **Location:** `ecommerce-monorepo/web/app/api/admin/deployment/deploy/route.ts`
- **Receives:** `const dataMode = body.dataMode || 'A';`
- **Action for non-production (local admin UI):**
  - Line 74: If `dataMode === 'C'`, adds `[replace-catalog]` to commit message. If `dataMode === 'B'`, adds `[migrate-data]`. If `dataMode === 'A'`, leaves message clean.
  - Line 100: Executes `git push origin HEAD:production`.
  - Line 116: Executes `git push dromkok HEAD:production`.
  - Line 135: Logs that GitHub Actions has been triggered.
- **Problem:** The endpoint only pushes git commits. It does **not** pass `dataMode` into the remote server execution environment or GitHub Actions pipeline.

### 1.3 The Remote Execution Trigger (`.github/workflows/deploy.yml`)
- **Location:** `.github/workflows/deploy.yml`
- **Trigger:** Automatic upon `git push` to branch `production` or `main`.
- **Workflow Steps:**
  1. Syncs source code to `/www/wwwroot/www.dromkok.com/web` via `rsync`.
  2. Executes remote SSH command (Line 104):
     ```bash
     bash /www/wwwroot/www.dromkok.com/web/scripts/deploy-production.sh
     ```
- **Finding:** The workflow runs `deploy-production.sh` with **zero arguments** and **zero environment variables** indicating the data mode. It completely ignores whether Option A, B, or C was selected.

### 1.4 The Hardcoded TRUNCATE Script (`scripts/deploy-production.sh`)
- **Location:** `ecommerce-monorepo/web/scripts/deploy-production.sh`
- **Lines 44–45:**
  ```bash
  echo "=== 6. Restoring Complete Product Catalog Snapshot (6,743 products & 122 categories) ==="
  node scripts/restore-catalog-snapshot.js --force || true
  ```
- **Inside `scripts/restore-catalog-snapshot.js` (Lines 27–36):**
  ```javascript
  const isForce = process.argv.includes('--force');
  if (currentProducts >= snapshot.productsCount && !isForce) {
    console.log(`Target DB already has ${currentProducts} products... Skipping restore.`);
    return;
  }

  console.log('Clearing old catalog tables with TRUNCATE CASCADE...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "product_translations", "products", "category_translations", "categories" CASCADE;');
  ```
- **Finding:** Because `deploy-production.sh` passes `--force` on every single run, `TRUNCATE CASCADE` executes unconditionally every time a deployment is triggered.

---

## 2. Phase 2 — Option Simulation Analysis

| Selected UI Mode | Promised UI Behavior | Actual Server Behavior (Bypass) |
|---|---|---|
| **Option A (Code + Schema Only)** | Push code, apply migrations, **leave all production data UNCHANGED**. | ❌ **WIPES CATALOG.** `deploy-production.sh` runs `restore-catalog-snapshot.js --force`, truncating products, categories, and translations. |
| **Option B (Code + Data Migration)** | Push code, run incremental backfill scripts, **all existing rows preserved**. | ❌ **WIPES CATALOG.** Overwritten by full snapshot restore before backfill scripts can complete. |
| **Option C (Replace Catalog)** | Create backup, wipe and replace online catalog with snapshot. | ✅ **Wipes Catalog.** (Behaves as expected, but runs identically to Option A and B). |

---

## 3. Root Cause: The Bypass Paths

1. **GitHub Actions Trigger Bypass:**
   `.github/workflows/deploy.yml` triggers on any git push to `production` and calls `bash scripts/deploy-production.sh` without reading git commit tags or workflow input variables.
2. **Hardcoded `--force` in Server Shell Script:**
   `scripts/deploy-production.sh` line 45 has `node scripts/restore-catalog-snapshot.js --force || true` hardcoded as Step 6, regardless of context.
3. **Local API vs Remote Server Decoupling:**
   `POST /api/admin/deployment/execute` has fine-grained `if (mode === 'C')` guards, but the standard deploy button calls `POST /api/admin/deployment/deploy`, which delegates remote execution to git push + `deploy-production.sh`.

---

## 4. Recommended Fix Architecture

To ensure the selected option is strictly respected:

1. **Make `deploy-production.sh` read the commit message or an environment flag:**
   Check the latest git commit for `[replace-catalog]` (which `deploy/route.ts` already tags for Option C) or check an environment variable:
   ```bash
   # In scripts/deploy-production.sh:
   COMMIT_MSG=$(git log -1 --pretty=%B)
   if [[ "$COMMIT_MSG" == *"[replace-catalog]"* ]] || [ "$RESTORE_CATALOG" = "true" ]; then
     echo "=== 6. Explicit Option C requested: Restoring Catalog Snapshot ==="
     node scripts/restore-catalog-snapshot.js --force
   else
     echo "=== 6. Option A/B active: Preserving online catalog data (snapshot restore skipped) ==="
   fi
   ```
2. **Remove the `--force` flag by default in `restore-catalog-snapshot.js`:**
   Ensure `restore-catalog-snapshot.js` never truncates existing tables if products are already present in the database, unless `--force` is passed under an intentional manual or Option C command.
3. **Pass Strategy to GitHub Actions / Remote Server:**
   Allow `deploy.yml` and `deploy-production.sh` to receive the data strategy parameter so Option A runs `prisma db push / migrate` without touching existing table rows.
