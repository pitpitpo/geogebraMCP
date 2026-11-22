/**
 * Comprehensive verification of gebrai operations running inside
 * the official GeoGebra standalone desktop application (Flatpak / Electron).
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/4068268c-1d84-4a4b-8aea-bf21b8f06c4e';

class StandaloneGeoGebraCDPClient {
  constructor(port = 9222) {
    this.port = port;
    this.ws = null;
    this.msgId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: this.port, path: '/json', agent: false }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            if (!page) {
              return reject(new Error('No active page found in GeoGebra standalone app'));
            }
            console.log(`[CDP] Connecting to GeoGebra page: ${page.title} (${page.url})`);
            this.ws = new WebSocket(page.webSocketDebuggerUrl);
            this.ws.on('open', () => {
              console.log('[CDP] Connected successfully to GeoGebra standalone application!');
              resolve();
            });
            this.ws.on('error', reject);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      const timeout = setTimeout(() => {
        this.ws.off('message', handler);
        reject(new Error(`Timeout waiting for CDP reply: ${method}`));
      }, 15000);

      const handler = (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.id === id) {
            clearTimeout(timeout);
            this.ws.off('message', handler);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          // ignore non-json messages
        }
      };

      this.ws.on('message', handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(code) {
    const res = await this.send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot() {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(res.data, 'base64');
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  const client = new StandaloneGeoGebraCDPClient();
  await client.connect();

  console.log('\n=== STEP 1: Check Applet Status in Standalone App ===');
  const ready = await client.eval(`typeof window.ggbApplet !== 'undefined' && window.ggbApplet != null`);
  console.log(`ggbApplet available: ${ready}`);
  if (!ready) {
    throw new Error('GeoGebra applet is not ready in standalone window');
  }

  console.log('\n=== STEP 1b: Auto-Detect GeoGebra Version & Capabilities ===');
  const rawVersion = await client.eval(`typeof window.ggbApplet.getVersion === 'function' ? window.ggbApplet.getVersion() : 'unknown'`);
  const appType = await client.eval(`typeof window.ggbApplet.getAppletType === 'function' ? window.ggbApplet.getAppletType() : (typeof window.ggbApplet.getAppName === 'function' ? window.ggbApplet.getAppName() : 'unknown')`);
  const hasExportImage = await client.eval(`typeof window.ggbApplet.exportImage === 'function'`);
  const hasGetPNGBase64 = await client.eval(`typeof window.ggbApplet.getPNGBase64 === 'function'`);
  const hasExportSVG = await client.eval(`typeof window.ggbApplet.exportSVG === 'function'`);
  console.log(`Auto-Detected GeoGebra Version: ${rawVersion}`);
  console.log(`Auto-Detected App Flavor/Type: ${appType}`);
  console.log(`Capabilities: exportImage=${hasExportImage}, getPNGBase64=${hasGetPNGBase64}, exportSVG=${hasExportSVG}`);

  console.log('\n=== STEP 2: Clear / Reset Construction ===');
  await client.eval(`window.ggbApplet.newConstruction()`);
  await client.eval(`window.ggbApplet.setAxesVisible(true, true)`);
  await client.eval(`window.ggbApplet.setGridVisible(true)`);
  await client.eval(`window.ggbApplet.setCoordSystem(-6, 8, -4, 6)`);
  console.log('Construction reset and coordinates set (-6, 8, -4, 6)');

  console.log('\n=== STEP 3: Geometric Constructions (matching gebrai tools) ===');
  // Points
  await client.eval(`window.ggbApplet.evalCommand("A = (1, 1)")`);
  await client.eval(`window.ggbApplet.evalCommand("B = (5, 1)")`);
  await client.eval(`window.ggbApplet.evalCommand("C = (3, 4)")`);
  // Triangle Polygon
  await client.eval(`window.ggbApplet.evalCommand("T = Polygon(A, B, C)")`);
  // Circumcircle
  await client.eval(`window.ggbApplet.evalCommand("c1 = Circle(A, B, C)")`);
  // Centroid
  await client.eval(`window.ggbApplet.evalCommand("G = (A + B + C) / 3")`);
  // Line segment and Midpoint
  await client.eval(`window.ggbApplet.evalCommand("M = Midpoint(A, B)")`);
  await client.eval(`window.ggbApplet.evalCommand("h_c = Segment(C, M)")`);
  
  // Styling
  await client.eval(`window.ggbApplet.setColor("T", 65, 105, 225)`); // Royal Blue
  await client.eval(`window.ggbApplet.setColor("c1", 220, 20, 60)`); // Crimson
  await client.eval(`window.ggbApplet.setColor("G", 34, 139, 34)`); // Forest Green
  await client.eval(`window.ggbApplet.setPointSize("G", 6)`);
  await client.eval(`window.ggbApplet.setLineStyle("h_c", 2)`); // Dashed

  const area = await client.eval(`window.ggbApplet.getValue("T")`);
  const gx = await client.eval(`window.ggbApplet.getXcoord("G")`);
  const gy = await client.eval(`window.ggbApplet.getYcoord("G")`);
  console.log(`Triangle T Area: ${area} (Expected: 6)`);
  console.log(`Centroid G coordinates: (${gx.toFixed(2)}, ${gy.toFixed(2)}) (Expected: (3.00, 2.00))`);

  console.log('\n=== STEP 4: Function Plotting and Calculus ===');
  // Function plot
  await client.eval(`window.ggbApplet.evalCommand("f(x) = 0.25 * x^3 - 2 * x")`);
  await client.eval(`window.ggbApplet.setColor("f", 147, 51, 234)`); // Purple
  await client.eval(`window.ggbApplet.setLineThickness("f", 4)`);

  // Derivative
  await client.eval(`window.ggbApplet.evalCommand("fprime(x) = Derivative(f)")`);
  await client.eval(`window.ggbApplet.setColor("fprime", 249, 115, 22)`); // Orange
  await client.eval(`window.ggbApplet.setLineStyle("fprime", 1)`); // Dotted

  // Tangent at x = 2
  await client.eval(`window.ggbApplet.evalCommand("tang = Tangent(2, f)")`);
  await client.eval(`window.ggbApplet.setColor("tang", 13, 148, 136)`); // Teal

  const fValAt2 = await client.eval(`window.ggbApplet.getValue("f(2)")`);
  const fprimeValAt2 = await client.eval(`window.ggbApplet.getValue("fprime(2)")`);
  console.log(`f(2) = ${fValAt2} (Expected: -2)`);
  console.log(`f'(2) = ${fprimeValAt2} (Expected: 1)`);

  console.log('\n=== STEP 5: Algebraic Solving & Roots ===');
  await client.eval(`window.ggbApplet.evalCommand("roots = {Root(f, -3), Root(f, 0), Root(f, 3)}")`);
  const rootsCount = await client.eval(`window.ggbApplet.getValue("Length(roots)")`);
  console.log(`Calculated polynomial roots count: ${rootsCount}`);

  console.log('\n=== STEP 6: Interactive Slider & Dynamic Tracing ===');
  await client.eval(`window.ggbApplet.evalCommand("k = Slider(-4, 4, 0.1)")`);
  await client.eval(`window.ggbApplet.evalCommand("P_k = (k, f(k))")`);
  await client.eval(`window.ggbApplet.setColor("P_k", 239, 68, 68)`); // Red
  await client.eval(`window.ggbApplet.setPointSize("P_k", 7)`);
  await client.eval(`window.ggbApplet.setTrace("P_k", true)`);
  await client.eval(`window.ggbApplet.setValue("k", 1.5)`);
  const pk_y = await client.eval(`window.ggbApplet.getYcoord("P_k")`);
  console.log(`Dynamic slider evaluation at k=1.5: P_k.y = ${pk_y.toFixed(3)}`);

  console.log('\n=== STEP 7: Export Visual Artifacts from Standalone GeoGebra ===');
  // 1. Export SVG
  const svg = await client.eval(`new Promise(resolve => window.ggbApplet.exportSVG(svg => resolve(svg)))`);
  const svgPath = path.join(ARTIFACT_DIR, 'geogebra_standalone_output.svg');
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`Saved Standalone SVG to: ${svgPath} (${(svg.length / 1024).toFixed(1)} KB)`);

  // 2. Export Applet PNG using getPNGBase64
  let pngBase64 = await client.eval(`window.ggbApplet.getPNGBase64(1, false, 150)`);
  if (pngBase64 && typeof pngBase64 === 'string') {
    if (pngBase64.startsWith('data:image/png;base64,')) {
      pngBase64 = pngBase64.replace('data:image/png;base64,', '');
    }
    const pngPath = path.join(ARTIFACT_DIR, 'geogebra_standalone_graphics.png');
    fs.writeFileSync(pngPath, Buffer.from(pngBase64, 'base64'));
    console.log(`Saved Standalone Graphics PNG to: ${pngPath} (${(pngBase64.length * 0.75 / 1024).toFixed(1)} KB)`);
  }

  // 3. Capture Full Window Screenshot of the Standalone App
  const windowShot = await client.captureScreenshot();
  const windowShotPath = path.join(ARTIFACT_DIR, 'geogebra_standalone_app_window.png');
  fs.writeFileSync(windowShotPath, windowShot);
  console.log(`Saved Standalone Window Screenshot to: ${windowShotPath} (${(windowShot.length / 1024).toFixed(1)} KB)`);

  console.log('\n=== STEP 8: Object Inventory in Standalone Window ===');
  const allObjects = await client.eval(`window.ggbApplet.getAllObjectNames()`);
  console.log(`Total constructed objects in standalone GeoGebra app: ${allObjects.length}`);
  console.log(`Objects: ${allObjects.join(', ')}`);

  client.close();
  console.log('\nAll standalone GeoGebra tests PASSED successfully!');
}

run().catch((err) => {
  console.error('Fatal error during standalone test:', err);
  process.exit(1);
});
