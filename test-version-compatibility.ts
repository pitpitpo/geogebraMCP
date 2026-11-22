/**
 * Comprehensive GeoGebra Version Compatibility Test Suite
 * 
 * Tests auto-detection and cross-version compatibility across:
 * - GeoGebra Classic 4 (v4.x)
 * - GeoGebra Classic 5 (v5.0.x / v5.2.x)
 * - GeoGebra Classic 6 (v6.0.0 - v6.0.699)
 * - GeoGebra Calculator Suite (v6.0.700+)
 * - GeoGebra Latest (v6.0.850+ / v7+)
 */

import { 
  GeoGebraVersionDetector, 
  GeoGebraCompatibilityEngine, 
  GeoGebraGeneration, 
  GeoGebraAppFlavor 
} from './src/utils/version';
import { MockGeoGebraInstance } from './src/utils/geogebra-mock';
import { toolRegistry } from './src/tools';

async function runVersionCompatibilityTests() {
  console.log('='.repeat(70));
  console.log('🧪 GeoGebra Version Auto-Detection & Compatibility Engine Verification');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Version String Parsing Matrix
  console.log('\n[1] Testing Version String Parser Across Generations...');
  const testVersions = [
    { input: '4.4.70.0', expectedMajor: 4, expectedGen: 'classic_4' as GeoGebraGeneration },
    { input: '5.0.680.0-offline', expectedMajor: 5, expectedGen: 'classic_5' as GeoGebraGeneration },
    { input: '5.2.0', expectedMajor: 5, expectedGen: 'classic_5' as GeoGebraGeneration },
    { input: '6.0.520.0', expectedMajor: 6, expectedGen: 'classic_6' as GeoGebraGeneration },
    { input: '6.0.750.0', expectedMajor: 6, expectedGen: 'modern_suite' as GeoGebraGeneration },
    { input: '6.0.866.0', expectedMajor: 6, expectedGen: 'latest' as GeoGebraGeneration },
    { input: '7.0.12.0', expectedMajor: 7, expectedGen: 'latest' as GeoGebraGeneration }
  ];

  for (const item of testVersions) {
    const parsed = GeoGebraVersionDetector.parseVersion(item.input);
    const gen = GeoGebraVersionDetector.determineGeneration(parsed, 'classic');
    assert(parsed.major === item.expectedMajor, `Parsed major version for ${item.input} -> ${parsed.major}`);
    assert(gen === item.expectedGen, `Mapped generation for ${item.input} -> ${gen} (expected ${item.expectedGen})`);
  }

  // 2. App Flavor Normalization Matrix
  console.log('\n[2] Testing App Flavor Normalization...');
  const testFlavors: Array<{ input: string, expected: GeoGebraAppFlavor }> = [
    { input: 'classic', expected: 'classic' },
    { input: 'Classic 6', expected: 'classic' },
    { input: 'Calculator Suite', expected: 'suite' },
    { input: 'suite', expected: 'suite' },
    { input: 'graphing', expected: 'graphing' },
    { input: 'websimple', expected: 'graphing' },
    { input: 'geometry', expected: 'geometry' },
    { input: '3d', expected: '3d' },
    { input: 'web3d', expected: '3d' },
    { input: 'cas', expected: 'cas' },
    { input: 'notes', expected: 'notes' },
    { input: 'scientific', expected: 'scientific' },
    { input: 'evaluator', expected: 'evaluator' }
  ];

  for (const item of testFlavors) {
    const norm = GeoGebraVersionDetector.normalizeAppFlavor(item.input);
    assert(norm === item.expected, `Normalized flavor "${item.input}" -> ${norm}`);
  }

  // 3. Command Normalization Across Generations
  console.log('\n[3] Testing Cross-Version Command Normalization...');
  const classicProfile = GeoGebraVersionDetector.createSimulatedProfile('5.0.700.0', 'classic');
  const suiteProfile = GeoGebraVersionDetector.createSimulatedProfile('6.0.866.0', 'suite');
  const profile3D = GeoGebraVersionDetector.createSimulatedProfile('6.0.800.0', '3d');

  // Perspective mapping
  const cmdPers1 = GeoGebraCompatibilityEngine.normalizeCommand('SetPerspective("algebra")', classicProfile);
  assert(cmdPers1 === 'SetPerspective("1")', `Classic perspective normalization: "algebra" -> "1"`);

  const cmdPers2 = GeoGebraCompatibilityEngine.normalizeCommand('SetPerspective("1")', suiteProfile);
  assert(cmdPers2 === 'SetPerspective("graphing")', `Suite perspective normalization: "1" -> "graphing"`);

  // 3D coordinate system expansion
  const cmdCoord = GeoGebraCompatibilityEngine.normalizeCommand('SetCoordSystem(-6, 6, -4, 4)', profile3D);
  assert(cmdCoord.includes('-5, 5'), `3D coordinate system bounds auto-expanded: ${cmdCoord}`);

  // Multi-root syntax normalization
  const cmdRoot = GeoGebraCompatibilityEngine.normalizeCommand('roots = {Roots(f, -3), Roots(f, 3)}', classicProfile);
  assert(cmdRoot === 'roots = {Root(f, -3), Root(f, 3)}', `Root command alias normalized: ${cmdRoot}`);

  // 4. Mock Instance Version Simulation & Interoperability
  console.log('\n[4] Testing Mock Instance with Simulated GeoGebra Generations...');
  const mockInstance = new MockGeoGebraInstance();
  await mockInstance.initialize();

  // Test Classic 5 simulation
  mockInstance.setSimulatedVersion('5.0.700.0', 'classic');
  const c5Profile = mockInstance.getVersionProfile();
  assert(c5Profile.generation === 'classic_5', 'Mock configured to Classic 5 generation');
  assert(c5Profile.compatibility.casPreloadRequired === true, 'Classic 5 requires CAS preload hook');
  assert(c5Profile.compatibility.preferredPngMethod === 'getPNGBase64', 'Classic 5 uses getPNGBase64');

  const c5Exec = await mockInstance.evalCommand('f(x) = 3*x^2 - 1');
  assert(c5Exec.success === true, 'Executed polynomial function in Classic 5 mock');

  // Test Calculator Suite simulation
  mockInstance.setSimulatedVersion('6.0.866.0', 'suite');
  const suiteProf = mockInstance.getVersionProfile();
  assert(suiteProf.generation === 'latest', 'Mock configured to Latest/Suite generation');
  assert(suiteProf.capabilities.hasSubApps === true, 'Suite has subApp switching enabled');
  assert(suiteProf.capabilities.hasExportImage === true, 'Suite uses modern exportImage');
  assert(suiteProf.compatibility.preferredPngMethod === 'exportImage', 'Suite prefers modern exportImage');

  const suiteExec = await mockInstance.evalCommand('T = Polygon((0,0), (4,0), (2,3))');
  assert(suiteExec.success === true, 'Executed polygon in Calculator Suite mock');

  // 5. Tool Registry geogebra_detect_version Execution
  console.log('\n[5] Testing MCP Tool "geogebra_detect_version"...');
  const detectTool = toolRegistry.getTool('geogebra_detect_version');
  assert(detectTool !== undefined, 'geogebra_detect_version is registered in toolRegistry');

  const toolOutput = await toolRegistry.executeTool('geogebra_detect_version', {});
  assert(toolOutput.content && toolOutput.content.length > 0, 'Tool returned content array');
  const parsedOutput = JSON.parse(toolOutput.content[0]?.text || '{}');
  assert(parsedOutput.success === true, 'Tool returned success: true');
  assert(parsedOutput.versionReport !== undefined, 'Tool returned comprehensive versionReport');
  assert(parsedOutput.versionReport.compatibleGenerations.classic_5 === true, 'Report confirms Classic 5 compatibility');
  assert(parsedOutput.versionReport.compatibleGenerations.modern_suite === true, 'Report confirms Modern Suite compatibility');
  assert(parsedOutput.versionReport.compatibleGenerations.latest === true, 'Report confirms Latest 7+ compatibility');

  // 6. geogebra_instance_status Version Profile Inclusion
  console.log('\n[6] Testing geogebra_instance_status Version Profile Output...');
  const statusOutput = await toolRegistry.executeTool('geogebra_instance_status', {});
  const parsedStatus = JSON.parse(statusOutput.content[0]?.text || '{}');
  assert(parsedStatus.success === true, 'geogebra_instance_status returned success');
  assert(parsedStatus.status.versionProfile !== undefined, 'geogebra_instance_status includes versionProfile');

  console.log('\n' + '='.repeat(70));
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL GEOGEBRA VERSION COMPATIBILITY TESTS PASSED!');
    process.exit(0);
  }
}

runVersionCompatibilityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
