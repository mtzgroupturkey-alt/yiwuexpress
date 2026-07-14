@echo off
echo Setting up gstack in team mode...
echo.
echo This will:
echo 1. Switch gstack to team mode (auto-updates)
echo 2. Initialize this repo for gstack
echo 3. Commit the changes
echo.

cd %USERPROFILE%\.claude\skills\gstack
bash -c "./setup --team"

cd /d c:\wamp64\www\yiwuexpress
bash -c "%USERPROFILE%/.claude/skills/gstack/bin/gstack-team-init required"

echo.
echo Adding gstack files to git...
git add .claude/ CLAUDE.md

echo.
echo Committing changes...
git commit -m "require gstack for AI-assisted work"

echo.
echo Done! gstack is now set up in team mode.
echo Your teammates will get gstack automatically.
echo.
pause
