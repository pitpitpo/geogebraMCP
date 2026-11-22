/**
 * GeoGebra Version and Compatibility Types
 * 
 * Supports all GeoGebra generations from Classic (v4, v5, v6) to Modern Suite and Latest (v7+).
 */

export type GeoGebraGeneration = 
  | 'classic_4'    // GeoGebra 4.x or earlier (legacy desktop/applet)
  | 'classic_5'    // GeoGebra 5.0.x / 5.2.x (Classic 5 desktop & HTML5)
  | 'classic_6'    // GeoGebra 6.0 early (v6.0.0 - v6.0.699)
  | 'modern_suite' // GeoGebra 6.0.700+ / Calculator Suite
  | 'latest';      // GeoGebra 6.0.850+ / v7.x+

export type GeoGebraAppFlavor = 
  | 'classic'      // Classic (full geometry + CAS + 3D + spreadsheet)
  | 'suite'        // Calculator Suite
  | 'graphing'     // Graphing Calculator
  | 'geometry'     // Geometry
  | '3d'           // 3D Calculator
  | 'cas'          // CAS Calculator
  | 'scientific'   // Scientific Calculator
  | 'notes'        // GeoGebra Notes
  | 'evaluator'    // Math Evaluator
  | 'unknown';

export type GeoGebraRuntimeEnvironment =
  | 'puppeteer'      // Web applet embedded in headless Chromium
  | 'standalone_cdp' // Standalone desktop application via CDP (Flatpak, Electron)
  | 'mock'           // In-memory mock instance for testing/CI
  | 'unknown';

export interface GeoGebraVersionInfo {
  versionString: string;
  major: number;
  minor: number;
  patch: number;
  build: number;
  raw: string;
}

export interface GeoGebraCapabilities {
  // Export capabilities
  hasExportImage: boolean;        // Modern v6/v7 exportImage API
  hasGetPNGBase64: boolean;       // Classic getPNGBase64 API
  hasExportSVG: boolean;          // SVG export capability
  hasExportSVGCallback: boolean;  // exportSVG(callback) style
  hasExportSVGSync: boolean;      // getSVG() or sync exportSVG
  hasExportPDF: boolean;          // PDF export via applet
  hasPagePDF: boolean;            // PDF export via Puppeteer page.pdf()
  
  // Math & CAS capabilities
  hasCAS: boolean;                // CAS engine supported
  isCASLoaded: boolean;           // CAS engine actively loaded
  has3D: boolean;                 // 3D view and coordinate system
  hasSubApps: boolean;            // Calculator Suite multi-subapp switching
  
  // Commands & Scripting
  hasEvalLaTeX: boolean;          // evalLaTeX method
  hasSetPerspective: boolean;     // Perspective/view configuration
  hasAnimation: boolean;          // Animation controls (startAnimation, etc.)
  hasGetXML: boolean;             // XML state retrieval
  hasSetXML: boolean;             // XML state loading
  hasGetBase64: boolean;          // GGB binary base64 export
  hasSetBase64: boolean;          // GGB binary base64 import
  hasExerciseAPI: boolean;        // Exercise/evaluator validation API
}

export interface GeoGebraCompatibilityFlags {
  preferredPngMethod: 'exportImage' | 'getPNGBase64' | 'canvasCapture';
  preferredSvgMethod: 'exportImage' | 'callback' | 'sync' | 'domSvgFallback';
  preferredPdfMethod: 'exportImage' | 'appletPdf' | 'pagePdf';
  casPreloadRequired: boolean;
  perspectiveMapping: 'numeric' | 'named' | 'subapp';
  coordinateDimensions: 2 | 3;
  supportsSliders: boolean;
  supportsStyling: boolean;
  supportsDynamicScripting: boolean;
}

export interface GeoGebraVersionProfile {
  version: GeoGebraVersionInfo;
  generation: GeoGebraGeneration;
  appFlavor: GeoGebraAppFlavor;
  environment: GeoGebraRuntimeEnvironment;
  capabilities: GeoGebraCapabilities;
  compatibility: GeoGebraCompatibilityFlags;
  detectedAt: Date;
}

export interface GeoGebraDetectionResult {
  found: boolean;
  rawVersion?: string;
  appFlavor?: string;
  methods?: Partial<GeoGebraCapabilities>;
  error?: string;
}

export interface GeoGebraCompatibilityReport {
  profile: GeoGebraVersionProfile;
  compatibleGenerations: {
    classic_4: boolean;
    classic_5: boolean;
    classic_6: boolean;
    modern_suite: boolean;
    latest: boolean;
  };
  activeAdapters: string[];
  recommendations: string[];
}
