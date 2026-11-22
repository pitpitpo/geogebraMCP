#!/usr/bin/env node

/**
 * End-to-end verification script for GeoGebra MCP server.
 * Connects over stdio JSON-RPC, verifies MCP handshake, tool registry, and ping.
 */

const { spawn } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(REPO_ROOT, 'dist', 'index.js');

async function verify() {
  console.log('🧪 Verifying GeoGebra MCP server over stdio...');
  console.log(`   Server entry: ${SERVER_PATH}`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER_PATH], {
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'inherit'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        LOG_LEVEL: 'error'
      }
    });

    let buffer = '';
    let msgId = 0;
    const pending = new Map();

    const send = (method, params = {}) => {
      const id = ++msgId;
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        const req = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
        child.stdin.write(req);
      });
    };

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const res = JSON.parse(line);
          if (res.id && pending.has(res.id)) {
            const { resolve: resResolve, reject: resReject } = pending.get(res.id);
            pending.delete(res.id);
            if (res.error) {
              resReject(new Error(res.error.message || JSON.stringify(res.error)));
            } else {
              resResolve(res.result);
            }
          }
        } catch (e) {
          // Ignore non-json lines
        }
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start server process: ${err.message}`));
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited unexpectedly with code ${code}`));
      }
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout during MCP verification'));
    }, 15000);

    (async () => {
      try {
        // 1. MCP Handshake: initialize
        const initResult = await send('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'verify-client', version: '1.0.0' }
        });
        console.log(`   ✓ Handshake successful: ${initResult.serverInfo ? initResult.serverInfo.name : 'MCP Server'} (v${initResult.serverInfo ? initResult.serverInfo.version : '?'})`);

        // 2. tools/list
        const listResult = await send('tools/list', {});
        const toolCount = listResult.tools ? listResult.tools.length : 0;
        console.log(`   ✓ Received tools/list: ${toolCount} tools registered`);
        if (toolCount < 30) {
          throw new Error(`Expected at least 30 tools, got ${toolCount}`);
        }

        // 3. ping tool call
        const pingResult = await send('tools/call', { name: 'ping', arguments: {} });
        const pongText = pingResult && pingResult.content && pingResult.content[0] ? pingResult.content[0].text : '';
        console.log(`   ✓ ping tool response: "${pongText}"`);
        if (pongText !== 'pong') {
          throw new Error(`Expected "pong", got "${pongText}"`);
        }

        clearTimeout(timeout);
        child.kill();
        console.log('✅ GeoGebra MCP server verified successfully!\n');
        resolve(true);
      } catch (err) {
        clearTimeout(timeout);
        child.kill();
        reject(err);
      }
    })();
  });
}

if (require.main === module) {
  verify().catch((err) => {
    console.error(`❌ Verification failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { verify };
