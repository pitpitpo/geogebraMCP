#!/usr/bin/env node

/**
 * Universal Zero-Friction Setup Script for GeoGebra MCP.
 * Works on macOS, Windows, and Linux.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');

function run(cmd, desc) {
  console.log(`\n⏳ ${desc}...`);
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log(`✓ ${desc} completed.`);
  } catch (err) {
    console.error(`❌ Failed during: ${desc}`);
    throw err;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   🚀 GeoGebra MCP Tool Universal Platform Setup');
  console.log('======================================================');
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`Node: ${process.version}`);
  console.log(`Directory: ${REPO_ROOT}\n`);

  // 1. Verify Node.js version >= 18
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 18) {
    console.error(`❌ Error: Node.js 18.0.0 or higher is required. Current version: ${process.version}`);
    process.exit(1);
  }

  // 2. Install dependencies
  if (!fs.existsSync(path.join(REPO_ROOT, 'node_modules'))) {
    run('npm install', 'Installing npm dependencies');
  } else {
    console.log('✓ Dependencies already installed.');
  }

  // 3. Ensure Puppeteer headless shell browser is downloaded
  try {
    run('npx puppeteer browsers install chrome-headless-shell', 'Ensuring Chrome Headless Shell is installed');
  } catch (e) {
    console.warn('⚠️  Could not install chrome-headless-shell via npx, will fallback to system Chrome if available.');
  }

  // 4. Build TypeScript
  run('npm run build', 'Building TypeScript project');

  // 5. Detect and auto-configure installed AI platforms
  run('node scripts/setup-platforms.js --install-all', 'Auto-configuring detected AI platforms');

  // 6. Verify server health
  run('node scripts/verify-setup.js', 'Running end-to-end MCP server verification');

  console.log('\n======================================================');
  console.log('   🎉 Setup Finished Successfully with Zero Friction!');
  console.log('======================================================');
  console.log('Your AI editors / clients (Claude Desktop, Cursor, Windsurf,');
  console.log('VS Code Cline, Continue, etc.) can now use the GeoGebra MCP server.');
  console.log('\nTry asking your AI model:');
  console.log('  "Plot f(x) = sin(x)*x from -10 to 10 and export as PNG."');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Setup encountered an error:', err.message);
  process.exit(1);
});
