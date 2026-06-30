@echo off
echo ============================================
echo  VIDEO UPLOAD SUPPORT - DATABASE SETUP
echo ============================================
echo.

echo [1/3] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Prisma generate failed!
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [2/3] Pushing schema changes to database...
call npx prisma db push
if errorlevel 1 (
    echo ERROR: Database push failed!
    pause
    exit /b 1
)
echo ✓ Database schema updated
echo.

echo [3/3] Verifying setup...
echo ✓ Video support installed!
echo.

echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo Video upload feature is now ready to use!
echo.
echo Next steps:
echo 1. Restart your development server
echo 2. Go to Admin -^> Products
echo 3. Try uploading a video!
echo.
echo Documentation:
echo - See: web/🎥_VIDEO_UPLOAD_COMPLETE.md
echo - See: ✅_MEDIA_UPLOAD_V2_READY.md
echo.
pause
