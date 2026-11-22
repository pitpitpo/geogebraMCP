@echo off
REM ==============================================================================
REM GeoGebra MCP Tool - Universal Setup Script (Windows Command Prompt)
REM ==============================================================================
REM Sets up dependencies, builds the server, installs Chrome headless shell,
REM auto-detects and configures Claude Desktop, Cursor, Windsurf, VS Code, etc.
REM ==============================================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ======================================================
echo    GeoGebra MCP Tool Setup (Windows)
echo ======================================================

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js 18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM 2. Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH.
    pause
    exit /b 1
)

echo [OK] Node.js and npm found.

REM 3. Run Universal Setup
node scripts\setup.js %*

if %errorlevel% neq 0 (
    echo [ERROR] Setup encountered an issue.
    pause
    exit /b %errorlevel%
)

echo.
echo Setup completed successfully!
pause
