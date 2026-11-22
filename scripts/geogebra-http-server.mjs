#!/usr/bin/env node

/**
 * GeoGebra MCP HTTP/SSE Server (v1.2.0)
 * Exposes the full 94-tool GeoGebra MCP server over HTTP and SSE on port 3500.
 * Compatible with Claude Desktop, Cursor IDE, Windsurf, T3 Code, and the Central MCP Gateway.
 */

import http from 'node:http';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

// Ensure Puppeteer Chrome binary path is resolved in all service environments
const KNOWN_CHROME_PATH = '/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome';
if (!process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(KNOWN_CHROME_PATH)) {
  process.env.PUPPETEER_EXECUTABLE_PATH = KNOWN_CHROME_PATH;
}
if (!process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = '/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home/.cache/puppeteer';
}
if (!process.env.HOME || process.env.HOME === '/home/dev') {
  process.env.HOME = '/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home';
}

const require = createRequire(import.meta.url);
const GEBRAI_DIST_PATH = '/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home/.t3/scratch/2026-11-22-test-this-in-geogebra-https-00683002/gebrai/dist/server.js';
const { McpServer } = require(GEBRAI_DIST_PATH);

const PORT = parseInt(process.env.PORT || '3500', 10);
const HOST = process.env.HOST || '127.0.0.1';

// Initialize the GeoGebra MCP Server instance
const mcpConfig = {
  name: 'GeoGebra MCP Tool',
  version: '1.2.0',
  description: 'Model Context Protocol server for GeoGebra mathematical visualization (94 tools, cross-version compatibility)',
  logLevel: (process.env.LOG_LEVEL || 'info')
};

const mcpServer = new McpServer(mcpConfig);
// Ensure initialized by default so stateless HTTP callers can directly call tools/list & tools/call
mcpServer.isInitialized = true;

// Active SSE clients map: sessionId -> Set of response objects
const sseClients = new Map();

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Proxy-Auth, mcp-session-id, Accept, Cache-Control');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id, Content-Type');
}

const server = http.createServer(async (req, res) => {
  sendCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = urlObj.pathname;
  const acceptHeader = req.headers.accept || '';

  // 1. Health & Discovery Endpoints
  if (req.method === 'GET' && (pathname === '/' || pathname === '/health' || (pathname === '/mcp' && !acceptHeader.includes('text/event-stream')))) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'GeoGebra MCP Server',
      version: '1.2.0',
      totalTools: 94,
      supportedGenerations: ['classic_4', 'classic_5', 'classic_6', 'modern_suite', 'v7_latest'],
      endpoints: {
        mcp: '/mcp',
        sse: '/sse',
        health: '/health'
      }
    }, null, 2));
    return;
  }

  // 2. Server-Sent Events (SSE) Stream
  if (req.method === 'GET' && (pathname === '/sse' || (pathname === '/mcp' && acceptHeader.includes('text/event-stream')))) {
    const sessionId = req.headers['mcp-session-id'] || urlObj.searchParams.get('sessionId') || randomUUID();
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'mcp-session-id': sessionId
    });

    if (!sseClients.has(sessionId)) {
      sseClients.set(sessionId, new Set());
    }
    sseClients.get(sessionId).add(res);

    // Send initial endpoint event per MCP 2024-11-05 SSE specification
    res.write(`event: endpoint\ndata: /mcp?sessionId=${sessionId}\n\n`);

    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepalive);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepalive);
      const set = sseClients.get(sessionId);
      if (set) {
        set.delete(res);
        if (set.size === 0) sseClients.delete(sessionId);
      }
    });
    return;
  }

  // 3. DELETE /mcp - Graceful session termination without tearing down the app
  if (req.method === 'DELETE') {
    const sessionId = req.headers['mcp-session-id'] || urlObj.searchParams.get('sessionId');
    if (sessionId && sseClients.has(sessionId)) {
      const set = sseClients.get(sessionId);
      for (const clientRes of set) {
        try { clientRes.end(); } catch {}
      }
      sseClients.delete(sessionId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', result: null }));
    return;
  }

  // 4. POST /mcp or POST / or POST /messages
  if (req.method === 'POST') {
    const sessionId = req.headers['mcp-session-id'] || urlObj.searchParams.get('sessionId') || randomUUID();
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      let jsonRpcRequest = null;
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8').trim();
        if (rawBody) {
          jsonRpcRequest = JSON.parse(rawBody);
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }));
        return;
      }

      if (!jsonRpcRequest || typeof jsonRpcRequest !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid Request: expected JSON-RPC object' }
        }));
        return;
      }

      try {
        // Guarantee initialized state
        mcpServer.isInitialized = true;

        const response = await mcpServer.processRequest(jsonRpcRequest);

        // If client is listening on SSE for this session, also broadcast
        if (sseClients.has(sessionId)) {
          const sseMsg = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
          for (const clientRes of sseClients.get(sessionId)) {
            try { clientRes.write(sseMsg); } catch {}
          }
        }

        // Return direct HTTP response
        if (response !== null) {
          const respBody = JSON.stringify(response);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(respBody),
            'mcp-session-id': sessionId
          });
          res.end(respBody);
        } else {
          // Notification acknowledged
          res.writeHead(202, { 'mcp-session-id': sessionId });
          res.end();
        }
      } catch (procErr) {
        console.error('[GeoGebra HTTP Server] Error processing request:', procErr);
        const errResp = JSON.stringify({
          jsonrpc: '2.0',
          id: jsonRpcRequest.id ?? null,
          error: { code: -32603, message: procErr.message || 'Internal server error' }
        });
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(errResp),
          'mcp-session-id': sessionId
        });
        res.end(errResp);
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found', path: pathname }));
});

server.listen(PORT, HOST, () => {
  console.log(`[GeoGebra MCP Server v1.2.0] Listening on http://${HOST}:${PORT}`);
  console.log(`  - MCP Endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`  - SSE Endpoint: http://${HOST}:${PORT}/sse`);
  console.log(`  - Health Check: http://${HOST}:${PORT}/health`);
});
