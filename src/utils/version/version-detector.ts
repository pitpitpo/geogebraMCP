import { 
  GeoGebraVersionProfile, 
  GeoGebraVersionInfo, 
  GeoGebraGeneration, 
  GeoGebraAppFlavor, 
  GeoGebraRuntimeEnvironment, 
  GeoGebraCapabilities, 
  GeoGebraCompatibilityFlags,
  GeoGebraDetectionResult 
} from './types';

/**
 * GeoGebra Version Detector
 * 
 * Auto-detects GeoGebra runtime version, app flavor, environment,
 * and builds a comprehensive capability profile.
 */
export class GeoGebraVersionDetector {
  /**
   * Parse a raw version string into a structured GeoGebraVersionInfo
   */
  public static parseVersion(raw: string = ''): GeoGebraVersionInfo {
    const cleanRaw = (raw || '').trim();
    // Match major.minor.patch.build, e.g. "6.0.866.0" or "5.0.700" or "6.0.750.0-offline"
    const match = cleanRaw.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?/);
    
    if (match) {
      const major = parseInt(match[1] || '6', 10);
      const minor = parseInt(match[2] || '0', 10);
      const patch = parseInt(match[3] || '0', 10);
      const build = parseInt(match[4] || '0', 10);
      const versionString = `${major}.${minor}.${patch}.${build}`;
      return {
        versionString,
        major,
        minor,
        patch,
        build,
        raw: cleanRaw
      };
    }

    // Default fallback version
    return {
      versionString: '6.0.800.0',
      major: 6,
      minor: 0,
      patch: 800,
      build: 0,
      raw: cleanRaw || 'unknown'
    };
  }

  /**
   * Determine GeoGebra generation based on version and capabilities
   */
  public static determineGeneration(
    version: GeoGebraVersionInfo,
    flavor: GeoGebraAppFlavor,
    capabilities: Partial<GeoGebraCapabilities> = {}
  ): GeoGebraGeneration {
    if (version.major <= 4) {
      return 'classic_4';
    }

    if (version.major === 5) {
      return 'classic_5';
    }

    if (version.major >= 7) {
      return 'latest';
    }

    // Version 6.x
    if (version.major === 6) {
      if (version.patch >= 850) {
        return 'latest';
      }
      if (version.patch >= 700 || flavor === 'suite' || capabilities.hasSubApps || capabilities.hasExportImage) {
        return 'modern_suite';
      }
      return 'classic_6';
    }

    return 'classic_6';
  }

  /**
   * Normalize app flavor string
   */
  public static normalizeAppFlavor(rawFlavor: string = ''): GeoGebraAppFlavor {
    const lower = (rawFlavor || '').toLowerCase().trim();
    
    if (lower.includes('classic')) return 'classic';
    if (lower.includes('suite')) return 'suite';
    if (lower.includes('graphing') || lower.includes('websimple')) return 'graphing';
    if (lower.includes('geometry')) return 'geometry';
    if (lower.includes('3d') || lower.includes('web3d')) return '3d';
    if (lower.includes('cas')) return 'cas';
    if (lower.includes('scientific')) return 'scientific';
    if (lower.includes('note')) return 'notes';
    if (lower.includes('evaluator')) return 'evaluator';
    
    return 'classic'; // Default to classic for broadest functionality
  }

  /**
   * Compute compatibility flags from capabilities and generation
   */
  public static computeCompatibilityFlags(
    generation: GeoGebraGeneration,
    capabilities: GeoGebraCapabilities,
    flavor: GeoGebraAppFlavor
  ): GeoGebraCompatibilityFlags {
    // Determine preferred PNG method
    let preferredPngMethod: 'exportImage' | 'getPNGBase64' | 'canvasCapture' = 'getPNGBase64';
    if (capabilities.hasExportImage) {
      preferredPngMethod = 'exportImage';
    } else if (capabilities.hasGetPNGBase64) {
      preferredPngMethod = 'getPNGBase64';
    } else {
      preferredPngMethod = 'canvasCapture';
    }

    // Determine preferred SVG method
    let preferredSvgMethod: 'exportImage' | 'callback' | 'sync' | 'domSvgFallback' = 'domSvgFallback';
    if (capabilities.hasExportImage && capabilities.hasExportSVG) {
      preferredSvgMethod = 'exportImage';
    } else if (capabilities.hasExportSVGCallback) {
      preferredSvgMethod = 'callback';
    } else if (capabilities.hasExportSVGSync) {
      preferredSvgMethod = 'sync';
    } else {
      preferredSvgMethod = 'domSvgFallback';
    }

    // Determine preferred PDF method
    let preferredPdfMethod: 'exportImage' | 'appletPdf' | 'pagePdf' = 'pagePdf';
    if (capabilities.hasExportImage && capabilities.hasExportPDF) {
      preferredPdfMethod = 'exportImage';
    } else if (capabilities.hasExportPDF) {
      preferredPdfMethod = 'appletPdf';
    } else {
      preferredPdfMethod = 'pagePdf';
    }

    // Determine perspective mapping strategy
    let perspectiveMapping: 'numeric' | 'named' | 'subapp' = 'numeric';
    if (flavor === 'suite' || capabilities.hasSubApps) {
      perspectiveMapping = 'subapp';
    } else if (generation === 'classic_4' || generation === 'classic_5' || generation === 'classic_6') {
      perspectiveMapping = 'numeric';
    } else {
      perspectiveMapping = 'named';
    }

    return {
      preferredPngMethod,
      preferredSvgMethod,
      preferredPdfMethod,
      casPreloadRequired: generation === 'classic_5' || generation === 'classic_6',
      perspectiveMapping,
      coordinateDimensions: capabilities.has3D ? 3 : 2,
      supportsSliders: true,
      supportsStyling: true,
      supportsDynamicScripting: true
    };
  }

  /**
   * Browser script to detect GeoGebra runtime from inside the page
   */
  public static getBrowserDetectionScript(): string {
    return `
      (function() {
        try {
          var applet = window.ggbApplet;
          if (!applet) {
            return { found: false, error: 'window.ggbApplet is not defined' };
          }

          var rawVersion = '';
          if (typeof applet.getVersion === 'function') {
            try { rawVersion = String(applet.getVersion()); } catch(e) {}
          }
          if (!rawVersion && window.GGBApplet && typeof window.GGBApplet.getVersion === 'function') {
            try { rawVersion = String(window.GGBApplet.getVersion()); } catch(e) {}
          }

          var appFlavor = '';
          if (typeof applet.getAppletType === 'function') {
            try { appFlavor = String(applet.getAppletType()); } catch(e) {}
          } else if (typeof applet.getAppName === 'function') {
            try { appFlavor = String(applet.getAppName()); } catch(e) {}
          }

          var hasExportImage = typeof applet.exportImage === 'function';
          var hasGetPNGBase64 = typeof applet.getPNGBase64 === 'function';
          var hasExportSVG = typeof applet.exportSVG === 'function' || typeof applet.getSVG === 'function';
          var hasExportSVGCallback = typeof applet.exportSVG === 'function';
          var hasExportSVGSync = typeof applet.getSVG === 'function';
          var hasExportPDF = typeof applet.exportPDF === 'function';

          var isCASLoaded = false;
          if (typeof applet.isCASLoaded === 'function') {
            try { isCASLoaded = !!applet.isCASLoaded(); } catch(e) {}
          }
          var hasCAS = typeof applet.enableCAS === 'function' || isCASLoaded;
          if (!hasCAS) {
            try {
              // Harmless test check for CAS
              var res = applet.evalCommand('1+1');
              hasCAS = !!res;
            } catch(e) {}
          }

          var has3D = typeof applet.is3D === 'function' ? applet.is3D() : (appFlavor.indexOf('3d') !== -1);
          var hasSubApps = typeof applet.setSubApp === 'function' || typeof applet.getSubApp === 'function';
          var hasEvalLaTeX = typeof applet.evalLaTeX === 'function';
          var hasSetPerspective = typeof applet.setPerspective === 'function';
          var hasAnimation = typeof applet.startAnimation === 'function' && typeof applet.stopAnimation === 'function';
          var hasGetXML = typeof applet.getXML === 'function';
          var hasSetXML = typeof applet.setXML === 'function';
          var hasGetBase64 = typeof applet.getBase64 === 'function';
          var hasSetBase64 = typeof applet.setBase64 === 'function';
          var hasExerciseAPI = typeof applet.getExerciseFraction === 'function' || typeof applet.getEditorState === 'function';

          return {
            found: true,
            rawVersion: rawVersion,
            appFlavor: appFlavor,
            methods: {
              hasExportImage: hasExportImage,
              hasGetPNGBase64: hasGetPNGBase64,
              hasExportSVG: hasExportSVG,
              hasExportSVGCallback: hasExportSVGCallback,
              hasExportSVGSync: hasExportSVGSync,
              hasExportPDF: hasExportPDF,
              hasCAS: hasCAS,
              isCASLoaded: isCASLoaded,
              has3D: has3D,
              hasSubApps: hasSubApps,
              hasEvalLaTeX: hasEvalLaTeX,
              hasSetPerspective: hasSetPerspective,
              hasAnimation: hasAnimation,
              hasGetXML: hasGetXML,
              hasSetXML: hasSetXML,
              hasGetBase64: hasGetBase64,
              hasSetBase64: hasSetBase64,
              hasExerciseAPI: hasExerciseAPI
            }
          };
        } catch (err) {
          return { found: false, error: err.message || String(err) };
        }
      })()
    `;
  }

  /**
   * Build full GeoGebraVersionProfile from detection result and environment
   */
  public static buildProfile(
    detection: GeoGebraDetectionResult,
    environment: GeoGebraRuntimeEnvironment,
    fallbackFlavor: GeoGebraAppFlavor = 'classic'
  ): GeoGebraVersionProfile {
    const rawVersion = detection.rawVersion || '';
    const version = this.parseVersion(rawVersion);
    const appFlavor = detection.appFlavor ? this.normalizeAppFlavor(detection.appFlavor) : fallbackFlavor;

    const capabilities: GeoGebraCapabilities = {
      hasExportImage: detection.methods?.hasExportImage ?? false,
      hasGetPNGBase64: detection.methods?.hasGetPNGBase64 ?? true,
      hasExportSVG: detection.methods?.hasExportSVG ?? true,
      hasExportSVGCallback: detection.methods?.hasExportSVGCallback ?? true,
      hasExportSVGSync: detection.methods?.hasExportSVGSync ?? false,
      hasExportPDF: detection.methods?.hasExportPDF ?? false,
      hasPagePDF: environment === 'puppeteer',
      hasCAS: detection.methods?.hasCAS ?? true,
      isCASLoaded: detection.methods?.isCASLoaded ?? false,
      has3D: detection.methods?.has3D ?? (appFlavor === '3d'),
      hasSubApps: detection.methods?.hasSubApps ?? (appFlavor === 'suite'),
      hasEvalLaTeX: detection.methods?.hasEvalLaTeX ?? false,
      hasSetPerspective: detection.methods?.hasSetPerspective ?? true,
      hasAnimation: detection.methods?.hasAnimation ?? true,
      hasGetXML: detection.methods?.hasGetXML ?? true,
      hasSetXML: detection.methods?.hasSetXML ?? true,
      hasGetBase64: detection.methods?.hasGetBase64 ?? true,
      hasSetBase64: detection.methods?.hasSetBase64 ?? true,
      hasExerciseAPI: detection.methods?.hasExerciseAPI ?? false
    };

    const generation = this.determineGeneration(version, appFlavor, capabilities);
    const compatibility = this.computeCompatibilityFlags(generation, capabilities, appFlavor);

    return {
      version,
      generation,
      appFlavor,
      environment,
      capabilities,
      compatibility,
      detectedAt: new Date()
    };
  }

  /**
   * Create a simulated profile for testing any specific GeoGebra version
   */
  public static createSimulatedProfile(
    versionString: string,
    flavor: GeoGebraAppFlavor = 'classic',
    env: GeoGebraRuntimeEnvironment = 'mock'
  ): GeoGebraVersionProfile {
    const version = this.parseVersion(versionString);
    const generation = this.determineGeneration(version, flavor);

    const isClassic = generation === 'classic_4' || generation === 'classic_5' || generation === 'classic_6';
    const isSuiteOrLatest = generation === 'modern_suite' || generation === 'latest';

    const capabilities: GeoGebraCapabilities = {
      hasExportImage: isSuiteOrLatest,
      hasGetPNGBase64: true,
      hasExportSVG: true,
      hasExportSVGCallback: true,
      hasExportSVGSync: isClassic,
      hasExportPDF: isSuiteOrLatest,
      hasPagePDF: env === 'puppeteer',
      hasCAS: flavor === 'classic' || flavor === 'suite' || flavor === 'cas',
      isCASLoaded: true,
      has3D: flavor === 'classic' || flavor === 'suite' || flavor === '3d',
      hasSubApps: flavor === 'suite',
      hasEvalLaTeX: isSuiteOrLatest,
      hasSetPerspective: true,
      hasAnimation: true,
      hasGetXML: true,
      hasSetXML: true,
      hasGetBase64: true,
      hasSetBase64: true,
      hasExerciseAPI: flavor === 'notes' || flavor === 'evaluator'
    };

    const compatibility = this.computeCompatibilityFlags(generation, capabilities, flavor);

    return {
      version,
      generation,
      appFlavor: flavor,
      environment: env,
      capabilities,
      compatibility,
      detectedAt: new Date()
    };
  }
}
