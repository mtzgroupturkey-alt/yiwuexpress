@echo off
echo ========================================
echo  ATTRIBUTE SYSTEM - VERIFICATION
echo ========================================
echo.

echo [1/6] Checking migration status...
echo.
npx prisma migrate status
echo.

echo [2/6] Validating Prisma schema...
echo.
npx prisma validate
echo.

echo [3/6] Checking if files exist...
echo.

set "files_ok=1"

if exist "app\admin\attributes\page.tsx" (
    echo [OK] Admin page exists
) else (
    echo [MISSING] app\admin\attributes\page.tsx
    set "files_ok=0"
)

if exist "components\admin\AttributeForm.tsx" (
    echo [OK] AttributeForm component exists
) else (
    echo [MISSING] components\admin\AttributeForm.tsx
    set "files_ok=0"
)

if exist "app\api\admin\attributes\route.ts" (
    echo [OK] Attributes API route exists
) else (
    echo [MISSING] app\api\admin\attributes\route.ts
    set "files_ok=0"
)

if exist "app\api\admin\attributes\[id]\route.ts" (
    echo [OK] Single attribute API route exists
) else (
    echo [MISSING] app\api\admin\attributes\[id]\route.ts
    set "files_ok=0"
)

if exist "app\api\admin\attributes\[id]\visibility\route.ts" (
    echo [OK] Visibility API route exists
) else (
    echo [MISSING] app\api\admin\attributes\[id]\visibility\route.ts
    set "files_ok=0"
)

if exist "app\api\admin\categories\[id]\attributes\route.ts" (
    echo [OK] Category attributes API route exists
) else (
    echo [MISSING] app\api\admin\categories\[id]\attributes\route.ts
    set "files_ok=0"
)

if exist "prisma\seed-attributes.ts" (
    echo [OK] Seed script exists
) else (
    echo [MISSING] prisma\seed-attributes.ts
    set "files_ok=0"
)

echo.
echo [4/6] Checking documentation files...
echo.

if exist "DYNAMIC_ATTRIBUTE_SYSTEM_COMPLETE.md" (
    echo [OK] Complete documentation exists
) else (
    echo [MISSING] DYNAMIC_ATTRIBUTE_SYSTEM_COMPLETE.md
    set "files_ok=0"
)

if exist "ATTRIBUTE_SYSTEM_QUICK_START.md" (
    echo [OK] Quick start guide exists
) else (
    echo [MISSING] ATTRIBUTE_SYSTEM_QUICK_START.md
    set "files_ok=0"
)

if exist "ATTRIBUTE_SYSTEM_API_REFERENCE.md" (
    echo [OK] API reference exists
) else (
    echo [MISSING] ATTRIBUTE_SYSTEM_API_REFERENCE.md
    set "files_ok=0"
)

if exist "ATTRIBUTE_SYSTEM_ARCHITECTURE.md" (
    echo [OK] Architecture doc exists
) else (
    echo [MISSING] ATTRIBUTE_SYSTEM_ARCHITECTURE.md
    set "files_ok=0"
)

if exist "ATTRIBUTE_SYSTEM_TESTING_GUIDE.md" (
    echo [OK] Testing guide exists
) else (
    echo [MISSING] ATTRIBUTE_SYSTEM_TESTING_GUIDE.md
    set "files_ok=0"
)

if exist "ATTRIBUTE_SYSTEM_VISUAL_GUIDE.md" (
    echo [OK] Visual guide exists
) else (
    echo [MISSING] ATTRIBUTE_SYSTEM_VISUAL_GUIDE.md
    set "files_ok=0"
)

echo.
echo [5/6] Checking database connection...
echo.
npx prisma db execute --stdin < NUL 2>NUL
if %errorlevel% equ 0 (
    echo [OK] Database connection successful
) else (
    echo [WARNING] Could not verify database connection
)

echo.
echo [6/6] Summary
echo.
echo ========================================

if "%files_ok%"=="1" (
    echo  STATUS: ALL FILES PRESENT
    echo ========================================
    echo.
    echo  Your Attribute System is ready!
    echo.
    echo  Next steps:
    echo  1. Run: npm run dev
    echo  2. Navigate to: http://localhost:3000/admin/attributes
    echo  3. Optional: Run SEED-ATTRIBUTES.bat to add sample data
    echo.
) else (
    echo  STATUS: SOME FILES MISSING
    echo ========================================
    echo.
    echo  Please check the missing files above.
    echo.
)

echo ========================================
echo.
pause
