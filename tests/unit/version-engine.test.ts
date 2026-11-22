import { 
  GeoGebraVersionDetector, 
  GeoGebraCompatibilityEngine 
} from '../../src/utils/version';
import { MockGeoGebraInstance } from '../../src/utils/geogebra-mock';
import { toolRegistry } from '../../src/tools';

describe('GeoGebra Version Detection and Compatibility Engine', () => {
  describe('GeoGebraVersionDetector.parseVersion', () => {
    it('should correctly parse standard 4-part GeoGebra versions', () => {
      const v = GeoGebraVersionDetector.parseVersion('6.0.866.0');
      expect(v.major).toBe(6);
      expect(v.minor).toBe(0);
      expect(v.patch).toBe(866);
      expect(v.build).toBe(0);
      expect(v.versionString).toBe('6.0.866.0');
    });

    it('should parse Classic 5 version string', () => {
      const v = GeoGebraVersionDetector.parseVersion('5.0.700.0');
      expect(v.major).toBe(5);
      expect(v.minor).toBe(0);
      expect(v.patch).toBe(700);
      expect(v.versionString).toBe('5.0.700.0');
    });

    it('should handle version strings with suffixes', () => {
      const v = GeoGebraVersionDetector.parseVersion('6.0.750.0-offline');
      expect(v.major).toBe(6);
      expect(v.minor).toBe(0);
      expect(v.patch).toBe(750);
      expect(v.build).toBe(0);
    });

    it('should handle partial version strings', () => {
      const v = GeoGebraVersionDetector.parseVersion('5.2');
      expect(v.major).toBe(5);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(0);
    });

    it('should fallback gracefully for empty or invalid version strings', () => {
      const v = GeoGebraVersionDetector.parseVersion('');
      expect(v.major).toBe(6);
      expect(v.versionString).toBe('6.0.800.0');
    });
  });

  describe('GeoGebraVersionDetector.determineGeneration', () => {
    it('should identify Classic 4 for major version <= 4', () => {
      const v = GeoGebraVersionDetector.parseVersion('4.4.0.0');
      const gen = GeoGebraVersionDetector.determineGeneration(v, 'classic');
      expect(gen).toBe('classic_4');
    });

    it('should identify Classic 5 for major version 5', () => {
      const v = GeoGebraVersionDetector.parseVersion('5.0.680.0');
      const gen = GeoGebraVersionDetector.determineGeneration(v, 'classic');
      expect(gen).toBe('classic_5');
    });

    it('should identify Classic 6 for early 6.0 versions without modern exports', () => {
      const v = GeoGebraVersionDetector.parseVersion('6.0.500.0');
      const gen = GeoGebraVersionDetector.determineGeneration(v, 'classic', { hasExportImage: false });
      expect(gen).toBe('classic_6');
    });

    it('should identify Modern Suite for 6.0 versions >= 700 or suite flavor', () => {
      const v1 = GeoGebraVersionDetector.parseVersion('6.0.750.0');
      const gen1 = GeoGebraVersionDetector.determineGeneration(v1, 'classic');
      expect(gen1).toBe('modern_suite');

      const v2 = GeoGebraVersionDetector.parseVersion('6.0.600.0');
      const gen2 = GeoGebraVersionDetector.determineGeneration(v2, 'suite');
      expect(gen2).toBe('modern_suite');
    });

    it('should identify Latest for v6.0.850+ or v7+', () => {
      const v1 = GeoGebraVersionDetector.parseVersion('6.0.866.0');
      const gen1 = GeoGebraVersionDetector.determineGeneration(v1, 'classic');
      expect(gen1).toBe('latest');

      const v2 = GeoGebraVersionDetector.parseVersion('7.0.0.0');
      const gen2 = GeoGebraVersionDetector.determineGeneration(v2, 'suite');
      expect(gen2).toBe('latest');
    });
  });

  describe('GeoGebraVersionDetector.normalizeAppFlavor', () => {
    it('should normalize standard app flavors', () => {
      expect(GeoGebraVersionDetector.normalizeAppFlavor('classic')).toBe('classic');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('Calculator Suite')).toBe('suite');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('graphing')).toBe('graphing');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('websimple')).toBe('graphing');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('geometry')).toBe('geometry');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('3d')).toBe('3d');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('web3d')).toBe('3d');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('cas')).toBe('cas');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('scientific')).toBe('scientific');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('notes')).toBe('notes');
      expect(GeoGebraVersionDetector.normalizeAppFlavor('evaluator')).toBe('evaluator');
    });
  });

  describe('GeoGebraCompatibilityEngine.normalizeCommand', () => {
    it('should normalize perspectives for classic vs suite', () => {
      const classicProfile = GeoGebraVersionDetector.createSimulatedProfile('5.0.700.0', 'classic');
      const suiteProfile = GeoGebraVersionDetector.createSimulatedProfile('6.0.866.0', 'suite');

      const cmd1 = 'SetPerspective("algebra")';
      expect(GeoGebraCompatibilityEngine.normalizeCommand(cmd1, classicProfile)).toBe('SetPerspective("1")');

      const cmd2 = 'SetPerspective("1")';
      expect(GeoGebraCompatibilityEngine.normalizeCommand(cmd2, suiteProfile)).toBe('SetPerspective("graphing")');
    });

    it('should normalize 2D coordinate bounds in 3D environment', () => {
      const profile3D = GeoGebraVersionDetector.createSimulatedProfile('6.0.800.0', '3d');
      const cmd = 'SetCoordSystem(-5, 5, -5, 5)';
      const normalized = GeoGebraCompatibilityEngine.normalizeCommand(cmd, profile3D);
      expect(normalized).toBe('SetCoordSystem(-5, 5, -5, 5, -5, 5)');
    });

    it('should normalize multi-root syntax', () => {
      const profile = GeoGebraVersionDetector.createSimulatedProfile('6.0.800.0', 'classic');
      const cmd = 'roots = {Roots(f, -2), Roots(f, 2)}';
      const normalized = GeoGebraCompatibilityEngine.normalizeCommand(cmd, profile);
      expect(normalized).toBe('roots = {Root(f, -2), Root(f, 2)}');
    });
  });

  describe('GeoGebraCompatibilityEngine.generateReport', () => {
    it('should generate a full compatibility report with active adapters and recommendations', () => {
      const profile = GeoGebraVersionDetector.createSimulatedProfile('6.0.866.0', 'suite');
      const report = GeoGebraCompatibilityEngine.generateReport(profile);

      expect(report.profile.version.versionString).toBe('6.0.866.0');
      expect(report.profile.generation).toBe('latest');
      expect(report.compatibleGenerations.classic_4).toBe(true);
      expect(report.compatibleGenerations.classic_5).toBe(true);
      expect(report.compatibleGenerations.classic_6).toBe(true);
      expect(report.compatibleGenerations.modern_suite).toBe(true);
      expect(report.compatibleGenerations.latest).toBe(true);
      expect(report.activeAdapters.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('MockGeoGebraInstance with Version Engine Integration', () => {
    it('should initialize with default version profile', async () => {
      const instance = new MockGeoGebraInstance();
      await instance.initialize();

      const profile = instance.getVersionProfile();
      expect(profile).toBeDefined();
      expect(profile.version.versionString).toBe('6.0.800.0');
      expect(profile.generation).toBe('modern_suite');

      const state = instance.getState();
      expect(state.versionProfile).toBeDefined();
      expect(state.isReady).toBe(true);
      expect(state.initialized).toBe(true);
    });

    it('should simulate Classic 5 environment and normalize commands', async () => {
      const instance = new MockGeoGebraInstance();
      await instance.initialize();

      instance.setSimulatedVersion('5.0.700.0', 'classic');
      const profile = instance.getVersionProfile();
      expect(profile.version.major).toBe(5);
      expect(profile.generation).toBe('classic_5');
      expect(profile.compatibility.casPreloadRequired).toBe(true);
      expect(profile.compatibility.perspectiveMapping).toBe('numeric');

      const result = await instance.evalCommand('A = (2, 3)');
      expect(result.success).toBe(true);
    });

    it('should simulate Calculator Suite environment', async () => {
      const instance = new MockGeoGebraInstance({ appName: 'suite' });
      await instance.initialize();

      instance.setSimulatedVersion('6.0.866.0', 'suite');
      const profile = instance.getVersionProfile();
      expect(profile.generation).toBe('latest');
      expect(profile.appFlavor).toBe('suite');
      expect(profile.capabilities.hasSubApps).toBe(true);
      expect(profile.capabilities.hasExportImage).toBe(true);
    });
  });

  describe('MCP Tool: geogebra_detect_version', () => {
    it('should be registered in the tool registry', () => {
      const toolDef = toolRegistry.getTool('geogebra_detect_version');
      expect(toolDef).toBeDefined();
      expect(toolDef?.tool.name).toBe('geogebra_detect_version');
      expect(toolDef?.tool.inputSchema.type).toBe('object');
    });

    it('should execute geogebra_detect_version successfully', async () => {
      const result = await toolRegistry.executeTool('geogebra_detect_version', {});
      expect(result.content[0]?.type).toBe('text');
      const parsed = JSON.parse(result.content[0]?.text || '{}');
      expect(parsed.success).toBe(true);
      expect(parsed.versionReport).toBeDefined();
      expect(parsed.versionReport.profile).toBeDefined();
      expect(parsed.versionReport.compatibleGenerations).toBeDefined();
      expect(parsed.versionReport.compatibleGenerations.classic_5).toBe(true);
      expect(parsed.versionReport.compatibleGenerations.latest).toBe(true);
    });
  });
});
