@echo off
REM CRIMEMAP one-click web preview. Double-click this file.
REM Requires Node.js 18+. Uses goto-labels, no parenthesised blocks.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node
if not exist "node_modules" goto :install
goto :havedeps

:no_node
echo [ERROR] Node.js was not found. Install Node.js 18 or newer from https://nodejs.org/ and double-click again.
pause
exit /b 1

:install
echo Installing dependencies, first run only, please wait...
call npm install
if errorlevel 1 goto :npm_fail

:havedeps
if not exist "public\data\crimemap-data.json" call npm run generate:data

echo Building CRIMEMAP, please wait...
call npm run build
if errorlevel 1 goto :build_fail

echo.
echo Starting preview server and opening your browser...
echo Site URL: http://localhost:4173/
echo Keep this window open. Press Ctrl+C to stop the server.
call npm run preview -- --port 4173 --strictPort --open
pause
exit /b 0

:npm_fail
echo [ERROR] npm install failed. Check your internet connection and try again.
pause
exit /b 1

:build_fail
echo [ERROR] Build failed. See the messages above.
pause
exit /b 1
