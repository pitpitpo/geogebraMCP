#!/usr/bin/env bash

# ==============================================================================
# GeoGebra MCP Tool - Universal Setup Script (macOS & Linux)
# ==============================================================================
# Sets up dependencies, builds the server, installs Chrome headless shell,
# auto-detects and configures Claude Desktop, Cursor, Windsurf, VS Code, etc.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================"
echo "   🚀 GeoGebra MCP Tool Setup (macOS / Linux)"
echo "======================================================"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js (v18 or higher) from https://nodejs.org or via your package manager:"
    echo "   - macOS: brew install node"
    echo "   - Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm"
    exit 1
fi

NODE_VERSION=$(node -v | tr -d 'v' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18.0.0 or higher is required. Found: $(node -v)"
    exit 1
fi

echo "✓ Found Node.js $(node -v)"

# 2. Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✓ Found npm $(npm -v)"

# 3. Make scripts executable
chmod +x scripts/*.js 2>/dev/null || true

# 4. Delegate to universal setup runner
node scripts/setup.js "$@"
