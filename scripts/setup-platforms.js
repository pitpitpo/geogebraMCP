#!/usr/bin/env node

/**
 * Universal Platform Setup CLI for GeoGebra MCP Tool (`gebrai`).
 * Automates detection, generation, and installation of MCP configurations
 * for Claude Desktop, Cursor, Windsurf, VS Code (Cline/Roo Code/Copilot),
 * Continue.dev, JetBrains, LibreChat, and Docker.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(REPO_ROOT, 'dist', 'index.js');
const HOME = os.homedir();
const PLATFORM = os.platform(); // 'darwin', 'win32', 'linux'

// Platform configuration registry
const PLATFORMS = {
  claude: {
    name: 'Claude Desktop',
    paths: {
      darwin: path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      win32: path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json'),
      linux: path.join(HOME, '.config', 'Claude', 'claude_desktop_config.json')
    },
    format: 'json-mcpServers',
    configKey: 'geogebra'
  },
  cursor: {
    name: 'Cursor IDE (Global)',
    paths: {
      darwin: path.join(HOME, '.cursor', 'mcp.json'),
      win32: path.join(HOME, '.cursor', 'mcp.json'),
      linux: path.join(HOME, '.cursor', 'mcp.json')
    },
    workspacePath: path.join(REPO_ROOT, '.cursor', 'mcp.json'),
    format: 'json-mcpServers',
    configKey: 'geogebra'
  },
  windsurf: {
    name: 'Windsurf (Codeium)',
    paths: {
      darwin: path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json'),
      win32: path.join(process.env.USERPROFILE || HOME, '.codeium', 'windsurf', 'mcp_config.json'),
      linux: path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json')
    },
    format: 'json-mcpServers',
    configKey: 'geogebra'
  },
  cline: {
    name: 'VS Code (Cline)',
    paths: {
      darwin: path.join(HOME, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      win32: path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      linux: path.join(HOME, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
    },
    format: 'json-mcpServers',
    configKey: 'geogebra'
  },
  roocode: {
    name: 'VS Code (Roo Code)',
    paths: {
      darwin: path.join(HOME, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
      win32: path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'),
      linux: path.join(HOME, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json')
    },
    format: 'json-mcpServers',
    configKey: 'geogebra'
  },
  continue: {
    name: 'Continue.dev',
    paths: {
      darwin: path.join(HOME, '.continue', 'config.json'),
      win32: path.join(HOME, '.continue', 'config.json'),
      linux: path.join(HOME, '.continue', 'config.json')
    },
    format: 'continue',
    configKey: 'geogebra'
  },
  jetbrains: {
    name: 'JetBrains IDEs',
    paths: {
      darwin: path.join(HOME, '.config', 'JetBrains', 'mcp.json'),
      win32: path.join(process.env.APPDATA || HOME, 'JetBrains', 'mcp.json'),
      linux: path.join(HOME, '.config', 'JetBrains', 'mcp.json')
    },
    format: 'json-mcpServers',
    configKey: 'geogebra'
  }
};

function generateServerEntry(useNpx = false) {
  if (useNpx) {
    return {
      command: 'npx',
      args: ['-y', '@gebrai/gebrai'],
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      }
    };
  }

  return {
    command: 'node',
    args: [DIST_INDEX],
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  };
}

function getConfigPath(platformKey) {
  const plat = PLATFORMS[platformKey];
  if (!plat) return null;
  return plat.paths[PLATFORM] || plat.paths.linux;
}

function generateSnippet(platformKey, useNpx = false) {
  const entry = generateServerEntry(useNpx);

  if (platformKey === 'continue') {
    return {
      experimental: {
        modelContextProtocolServers: [
          {
            transport: {
              type: 'stdio',
              ...entry
            }
          }
        ]
      }
    };
  }

  return {
    mcpServers: {
      geogebra: entry
    }
  };
}

function installToPlatform(platformKey, useNpx = false) {
  const targetPath = getConfigPath(platformKey);
  const plat = PLATFORMS[platformKey];
  if (!targetPath) {
    console.error(`[ERROR] Unknown platform: ${platformKey}`);
    return false;
  }

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let existing = {};
  if (fs.existsSync(targetPath)) {
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      existing = JSON.parse(content);
      // Backup original file
      fs.writeFileSync(`${targetPath}.backup-${Date.now()}`, content, 'utf8');
    } catch (e) {
      console.warn(`[WARN] Existing config file at ${targetPath} could not be parsed as JSON. Creating backup.`);
      fs.writeFileSync(`${targetPath}.corrupt-${Date.now()}`, fs.readFileSync(targetPath));
    }
  }

  const entry = generateServerEntry(useNpx);

  if (platformKey === 'continue') {
    existing.experimental = existing.experimental || {};
    existing.experimental.modelContextProtocolServers = existing.experimental.modelContextProtocolServers || [];
    // Remove previous geogebra entries if any
    existing.experimental.modelContextProtocolServers = existing.experimental.modelContextProtocolServers.filter(
      s => !JSON.stringify(s).includes('gebrai') && !JSON.stringify(s).includes('geogebra')
    );
    existing.experimental.modelContextProtocolServers.push({
      transport: {
        type: 'stdio',
        ...entry
      }
    });
  } else {
    existing.mcpServers = existing.mcpServers || {};
    existing.mcpServers[plat.configKey || 'geogebra'] = entry;
  }

  fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`✅ [INSTALLED] Configured ${plat.name} at:\n   ${targetPath}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const useNpx = args.includes('--use-npx');

  if (args.includes('--help') || args.length === 0) {
    console.log(`
GeoGebra MCP Platform Setup Utility
===================================
Usage:
  node scripts/setup-platforms.js [options]

Commands:
  --list                 List all supported platforms and their configuration paths
  --status               Check which platform configuration files currently exist
  --print <platform>     Print JSON snippet for a specific platform (e.g. claude, cursor)
  --print-all            Print JSON snippets for all platforms
  --install <platform>   Merge GeoGebra configuration into target platform file
  --install-all          Auto-install to all detected/supported platform configs

Options:
  --use-npx              Use 'npx @gebrai/gebrai' instead of absolute node path
  --help                 Show this help message

Available Platforms:
  ${Object.keys(PLATFORMS).join(', ')}
`);
    return;
  }

  if (args.includes('--list')) {
    console.log('\nSupported Platforms & Configuration Paths:');
    console.log('='.repeat(50));
    for (const [key, plat] of Object.entries(PLATFORMS)) {
      console.log(`\n• ${plat.name} [${key}]`);
      console.log(`  Config: ${getConfigPath(key)}`);
    }
    return;
  }

  if (args.includes('--status')) {
    console.log('\nPlatform Detection Status on Current Machine:');
    console.log('='.repeat(50));
    for (const [key, plat] of Object.entries(PLATFORMS)) {
      const p = getConfigPath(key);
      const exists = fs.existsSync(p);
      console.log(`[${exists ? 'DETECTED ' : 'NOT FOUND'}] ${plat.name.padEnd(24)} -> ${p}`);
    }
    return;
  }

  const printIdx = args.indexOf('--print');
  if (printIdx !== -1 && args[printIdx + 1]) {
    const key = args[printIdx + 1].toLowerCase();
    const snippet = generateSnippet(key, useNpx);
    console.log(JSON.stringify(snippet, null, 2));
    return;
  }

  if (args.includes('--print-all')) {
    for (const key of Object.keys(PLATFORMS)) {
      console.log(`\n=== ${PLATFORMS[key].name} (${getConfigPath(key)}) ===`);
      console.log(JSON.stringify(generateSnippet(key, useNpx), null, 2));
    }
    return;
  }

  const installIdx = args.indexOf('--install');
  if (installIdx !== -1 && args[installIdx + 1]) {
    const key = args[installIdx + 1].toLowerCase();
    installToPlatform(key, useNpx);
    return;
  }

  if (args.includes('--install-all')) {
    console.log('\nInstalling GeoGebra MCP into all detected platforms...');
    let count = 0;
    for (const key of Object.keys(PLATFORMS)) {
      const p = getConfigPath(key);
      const parentDir = path.dirname(p);
      if (fs.existsSync(parentDir)) {
        installToPlatform(key, useNpx);
        count++;
      }
    }
    console.log(`\nCompleted: ${count} platform(s) configured.`);
    return;
  }
}

main();
