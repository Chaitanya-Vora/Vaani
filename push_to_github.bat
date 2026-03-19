@echo off
REM ─────────────────────────────────────────────
REM Vaani — one-click GitHub push (Windows)
REM Just double-click this file
REM ─────────────────────────────────────────────

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Vaani → GitHub Push Script
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Check git
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo X  Git not found. Download from: https://git-scm.com
    pause
    exit /b 1
)

echo Step 1: Go to github.com - New repository - name it "vaani" - Create
echo.
set /p REPO_URL="Paste your GitHub repo URL (e.g. https://github.com/yourname/vaani.git): "

IF "%REPO_URL%"=="" (
    echo X  No URL entered.
    pause
    exit /b 1
)

echo.
echo Setting up git...

IF NOT EXIST ".git" (
    git init
    echo [OK] Git initialized
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
echo [OK] Remote set

git add .
echo [OK] All files staged

git commit -m "Initial commit - Vaani v1.0"

git branch -M main

echo.
echo Pushing to GitHub...
echo NOTE: When asked for password, use your Personal Access Token
echo Get it: github.com - Settings - Developer Settings - Personal Access Tokens
echo.

git push -u origin main

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [DONE] Code is on GitHub!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause
