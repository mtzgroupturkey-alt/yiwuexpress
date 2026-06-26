@echo off
echo ========================================
echo Installing Missing Shadcn/ui Components
echo ========================================
echo.

echo Installing Form component...
call npx shadcn-ui@latest add form -y

echo Installing Table component...
call npx shadcn-ui@latest add table -y

echo Installing Dialog component...
call npx shadcn-ui@latest add dialog -y

echo Installing Tabs component...
call npx shadcn-ui@latest add tabs -y

echo Installing Alert component...
call npx shadcn-ui@latest add alert -y

echo Installing Toast component...
call npx shadcn-ui@latest add toast -y

echo Installing Skeleton component...
call npx shadcn-ui@latest add skeleton -y

echo Installing Pagination component...
call npx shadcn-ui@latest add pagination -y

echo Installing Checkbox component...
call npx shadcn-ui@latest add checkbox -y

echo Installing Radio Group component...
call npx shadcn-ui@latest add radio-group -y

echo Installing Textarea component...
call npx shadcn-ui@latest add textarea -y

echo.
echo ========================================
echo All Shadcn/ui Components Installed!
echo ========================================
echo.
echo You can now use these components in your application.
echo.
pause
