# ==============================================================================
# GeoGebra MCP Tool - Universal Setup Script (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   🚀 GeoGebra MCP Tool Setup (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js 18+ from https://nodejs.org"
    exit 1
}

# 2. Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH."
    exit 1
}

$NodeVer = (node -v)
Write-Host "✓ Found Node.js $NodeVer" -ForegroundColor Green

# 3. Run Node setup script
node scripts\setup.js $args
if ($LASTEXITCODE -ne 0) {
    Write-Error "Setup failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
