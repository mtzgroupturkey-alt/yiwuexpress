# Restart Next.js Server and Regenerate Prisma Client
# Run this script to fix 500 errors after database schema changes

Write-Host "=== Restarting Next.js Server ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and stop Next.js processes
Write-Host "Step 1: Stopping Next.js processes..." -ForegroundColor Yellow
$nextProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node.exe*"
}

if ($nextProcesses) {
    Write-Host "Found $($nextProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    Write-Host "Stopping processes..." -ForegroundColor Gray
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ Processes stopped" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Navigate to web directory
Write-Host "Step 2: Navigating to web directory..." -ForegroundColor Yellow
Set-Location "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web"
Write-Host "✓ In directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 3: Regenerate Prisma Client
Write-Host "Step 3: Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "Please check for errors above" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Start dev server
Write-Host "Step 4: Starting development server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server when needed" -ForegroundColor Gray
Write-Host ""

npm run dev
