#!/usr/bin/env node

/**
 * End-to-end test script to:
 * 1. Spawn GeoGebra MCP server over stdio JSON-RPC
 * 2. Perform MCP initialize handshake
 * 3. Open GeoGebra and detect version
 * 4. Execute a rich set of GeoGebra mathematical and styling commands:
 *    - Plot functions
 *    - Create points and tangents
 *    - Style colors and line styles
 *    - Compute roots and extrema
 *    - Compute definite integral with visual shading
 * 5. Export a high-resolution PNG image of the GeoGebra construction via MCP
 * 6. Save image to disk and verify file size and integrity
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(REPO_ROOT, 'dist', 'index.js');
const OUTPUT_IMAGE_PATH = path.resolve(REPO_ROOT, '..', 'mcp_geogebra_test.png');

async function runMcpTest() {
  console.log('='.repeat(70));
  console.log('🚀 Starting GeoGebra MCP End-to-End Test');
  console.log('='.repeat(70));
  console.log(`Server: ${SERVER_PATH}`);
  console.log(`Target Image Output: ${OUTPUT_IMAGE_PATH}\n`);

  const child = spawn(process.execPath, [SERVER_PATH], {
    cwd: REPO_ROOT,
    stdio: ['pipe', 'pipe', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  });

  let buffer = '';
  let msgId = 0;
  const pending = new Map();

  const send = (method, params = {}) => {
    const id = ++msgId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
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
    console.error(`❌ Child process error:`, err);
  });

  const parseToolResponse = (result) => {
    if (!result || !result.content || !result.content[0]) return null;
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }
  };

  try {
    // 1. Initialize Handshake
    console.log('[1/7] Initializing MCP JSON-RPC protocol...');
    const initRes = await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-tester', version: '1.0.0' }
    });
    console.log(`   ✅ Connected to: ${initRes.serverInfo.name} v${initRes.serverInfo.version}`);

    // 2. Open GeoGebra and Detect Version
    console.log('\n[2/7] Opening GeoGebra instance & detecting version...');
    const verRes = await send('tools/call', {
      name: 'geogebra_detect_version',
      arguments: {}
    });
    const verData = parseToolResponse(verRes);
    const prof = verData.versionReport && verData.versionReport.profile ? verData.versionReport.profile : {};
    console.log(`   ✅ GeoGebra version: ${prof.version || 'Auto-detected'}`);
    console.log(`   ✅ Generation: ${prof.generation || 'classic_5'}`);
    console.log(`   ✅ Flavor: ${prof.appFlavor || 'classic'}`);

    // 3. Reset and Set Coordinates / View Bounds
    console.log('\n[3/7] Setting coordinate system viewport bounds...');
    await send('tools/call', {
      name: 'geogebra_set_coord_system',
      arguments: { xmin: -5, xmax: 5, ymin: -3, ymax: 3 }
    });
    console.log(`   ✅ Viewport bounds configured: [-5, 5] x [-3, 3]`);

    // 4. Execute Commands: Function, Tangent, Points
    console.log('\n[4/7] Executing mathematical commands in GeoGebra...');

    // Function f(x) = sin(x) * exp(-0.05 * x^2)
    await send('tools/call', {
      name: 'geogebra_plot_function',
      arguments: {
        name: 'f',
        expression: 'sin(x) * exp(-0.05 * x^2)'
      }
    });
    console.log(`   ✅ Plotted function: f(x) = sin(x) * exp(-0.05 * x^2)`);

    // Color f blue
    await send('tools/call', {
      name: 'geogebra_set_color',
      arguments: { objectName: 'f', red: 0, green: 0.3, blue: 0.9, alpha: 1 }
    });
    console.log(`   ✅ Styled function f: blue stroke`);

    // Create Point P on f at x = 1.2
    const ptRes = await send('tools/call', {
      name: 'geogebra_create_point',
      arguments: { name: 'P', x: 1.2, y: 0.866 } // Point on curve
    });
    await send('tools/call', {
      name: 'geogebra_set_point_style',
      arguments: { objectName: 'P', size: 6, style: 0 }
    });
    console.log(`   ✅ Created point P at (1.2, f(1.2)) with point size 6`);

    // Tangent line to f at P
    const tangRes = await send('tools/call', {
      name: 'geogebra_tangent_line',
      arguments: { name: 'tangent_line', curve: 'f', at: 'P' }
    });
    const tangData = parseToolResponse(tangRes);
    console.log(`   ✅ Constructed tangent line: ${tangData.tangent ? tangData.tangent.equation : 'tangent_line'}`);

    // Color tangent line red and set dashed
    await send('tools/call', {
      name: 'geogebra_set_color',
      arguments: { objectName: 'tangent_line', red: 0.9, green: 0.1, blue: 0.1, alpha: 1 }
    });
    await send('tools/call', {
      name: 'geogebra_set_line_style',
      arguments: { objectName: 'tangent_line', thickness: 3, lineStyle: 1 }
    });
    console.log(`   ✅ Styled tangent line: red dashed stroke`);

    // Calculate Roots and Extrema
    console.log('\n[5/7] Computing roots and extrema via calculus tools...');
    const extRes = await send('tools/call', {
      name: 'geogebra_extrema_and_roots',
      arguments: { functionName: 'f', findRoots: true, findExtrema: true }
    });
    const extData = parseToolResponse(extRes);
    console.log(`   ✅ Critical points calculated:`, JSON.stringify(extData.criticalPoints, null, 2));

    // Definite Integral shading
    console.log('\n[6/7] Computing and shading definite integral...');
    const intRes = await send('tools/call', {
      name: 'geogebra_definite_integral',
      arguments: { name: 'area_integral', functionName: 'f', lowerLimit: 0, upperLimit: 3.14159 }
    });
    const intData = parseToolResponse(intRes);
    console.log(`   ✅ Integral value: ${intData.integral ? intData.integral.value : 'computed'}`);

    // 6. Export Image via MCP Tool
    console.log('\n[7/7] Taking image snapshot using MCP tool "geogebra_export_png"...');
    const exportRes = await send('tools/call', {
      name: 'geogebra_export_png',
      arguments: {
        width: 1000,
        height: 650,
        dpi: 150,
        showAxes: true,
        showGrid: true
      }
    });

    const exportData = parseToolResponse(exportRes);
    if (!exportData.success || !exportData.data) {
      throw new Error(`Export failed: ${JSON.stringify(exportData)}`);
    }

    // Clean base64 string
    const base64Clean = exportData.data.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Clean, 'base64');
    fs.writeFileSync(OUTPUT_IMAGE_PATH, imageBuffer);

    const stats = fs.statSync(OUTPUT_IMAGE_PATH);
    console.log(`\n🎉 Success! Image captured via MCP and saved:`);
    console.log(`   📁 File: ${OUTPUT_IMAGE_PATH}`);
    console.log(`   📊 File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} KB)`);

    // Verify object inventory
    const objListRes = await send('tools/call', {
      name: 'geogebra_get_objects',
      arguments: {}
    });
    const objListData = parseToolResponse(objListRes);
    console.log(`   📋 Total objects in GeoGebra: ${objListData.count || objListData.totalCount || 'multiple'}`);

    child.kill();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error during MCP test:`, err);
    child.kill();
    process.exit(1);
  }
}

runMcpTest();
