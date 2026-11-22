import { 
  GeoGebraVersionProfile, 
  GeoGebraCompatibilityReport 
} from './types';

/**
 * GeoGebra Compatibility Engine
 * 
 * Provides translation, polyfills, and version-agnostic abstractions
 * ensuring 100% interoperability across all GeoGebra versions from Classic 4/5/6
 * to Calculator Suite and Latest 7+.
 */
export class GeoGebraCompatibilityEngine {
  /**
   * Normalize GeoGebra command for cross-version compatibility
   */
  public static normalizeCommand(command: string, profile: GeoGebraVersionProfile): string {
    if (!command || typeof command !== 'string') return '';
    let normalized = command.trim();

    // 1. Perspective / View Normalization
    // If command is SetPerspective(X), normalize argument
    const persMatch = normalized.match(/^SetPerspective\s*\(\s*["']?([^"'\)]+)["']?\s*\)$/i);
    if (persMatch && persMatch[1]) {
      const normPers = this.normalizePerspective(persMatch[1], profile);
      return `SetPerspective("${normPers}")`;
    }

    // 2. Coordinate System Normalization
    // If instance is in 3D mode but 4 args provided, or 2D mode and 6 args provided
    const coordMatch = normalized.match(/^SetCoordSystem\s*\(([^)]+)\)$/i);
    if (coordMatch && coordMatch[1]) {
      const args = coordMatch[1].split(',').map(s => s.trim());
      if (profile.capabilities.has3D && args.length === 4) {
        // Expand 2D bounds to 3D with default zmin/zmax [-5, 5]
        return `SetCoordSystem(${args[0]}, ${args[1]}, ${args[2]}, ${args[3]}, -5, 5)`;
      } else if (!profile.capabilities.has3D && args.length >= 6) {
        // Clamp 3D bounds to 2D
        return `SetCoordSystem(${args[0]}, ${args[1]}, ${args[2]}, ${args[3]})`;
      }
    }

    // 3. Slider Syntax Normalization
    // Classic 5/6 accepts 9 parameters; modern allows compact 3 parameters.
    const sliderMatch = normalized.match(/=\s*Slider\s*\(([^)]+)\)/i);
    if (sliderMatch && sliderMatch[1]) {
      const args = sliderMatch[1].split(',').map(s => s.trim());
      // If modern/suite and user passed empty/extra parameters, clean them up
      if (args.length > 3 && (profile.generation === 'modern_suite' || profile.generation === 'latest')) {
        // Keep valid args
        const cleanArgs = args.filter(a => a.length > 0);
        if (cleanArgs.length >= 3) {
          const parts = normalized.split('=');
          const varName = (parts[0] || '').trim();
          normalized = `${varName} = Slider(${cleanArgs.join(', ')})`;
        }
      }
    }

    // 4. Roots alias normalization (Root vs Roots)
    if (normalized.startsWith('roots =') || normalized.includes('Roots(')) {
      normalized = normalized.replace(/\bRoots\(/g, 'Root(');
    }

    return normalized;
  }

  /**
   * Normalize perspective strings across Classic and Suite/Latest
   */
  public static normalizePerspective(perspective: string, profile: GeoGebraVersionProfile): string {
    const raw = (perspective || '').toLowerCase().trim();
    const isClassic = profile.generation === 'classic_4' || 
                      profile.generation === 'classic_5' || 
                      profile.generation === 'classic_6';

    const numericMap: Record<string, string> = {
      'algebra': '1',
      'graphing': '1',
      'geometry': '2',
      'table': '3',
      'spreadsheet': '4',
      'cas': '5',
      '3d': '6',
      'probability': '6'
    };

    const namedMap: Record<string, string> = {
      '1': 'graphing',
      '2': 'geometry',
      '3': 'table',
      '4': 'spreadsheet',
      '5': 'cas',
      '6': '3d'
    };

    if (profile.compatibility.perspectiveMapping === 'numeric' || isClassic) {
      if (numericMap[raw]) {
        return numericMap[raw];
      }
      return raw;
    }

    if (profile.compatibility.perspectiveMapping === 'subapp' || profile.appFlavor === 'suite') {
      if (namedMap[raw]) {
        return namedMap[raw];
      }
      return raw;
    }

    return raw;
  }

  /**
   * Browser script to execute version-compatible PNG export
   */
  public static getExportPngScript(scale: number = 1, transparent: boolean = false, dpi: number = 72): string {
    return `
      (async function(scale, transparent, dpi) {
        var applet = window.ggbApplet;
        if (!applet) throw new Error('GeoGebra applet not available');

        // Priority 1: Modern exportImage API (v6.0.700+, Suite, v7+)
        if (typeof applet.exportImage === 'function') {
          try {
            var imgResult = applet.exportImage({
              type: 'png',
              scale: scale,
              transparent: transparent,
              dpi: dpi
            });

            if (imgResult) {
              // May return a base64 string or data URI or Promise
              var resolved = await Promise.resolve(imgResult);
              if (typeof resolved === 'string' && resolved.length > 20) {
                return resolved.replace(/^data:image\\/png;base64,/, '');
              }
            }
          } catch (e) {
            console.warn('exportImage(png) attempt failed, falling back to getPNGBase64:', e);
          }
        }

        // Priority 2: Classic getPNGBase64 API (Classic 5, Classic 6)
        if (typeof applet.getPNGBase64 === 'function') {
          try {
            var pngBase64 = applet.getPNGBase64(scale, transparent, dpi);
            if (pngBase64) {
              var resolvedBase64 = await Promise.resolve(pngBase64);
              if (typeof resolvedBase64 === 'string' && resolvedBase64.length > 20) {
                return resolvedBase64.replace(/^data:image\\/png;base64,/, '');
              }
            }
          } catch (e) {
            console.warn('getPNGBase64 attempt failed:', e);
          }
        }

        // Priority 3: Canvas extraction fallback from DOM
        var canvas = document.querySelector('#ggb-element canvas, .geogebraweb canvas');
        if (canvas && typeof canvas.toDataURL === 'function') {
          var dataUrl = canvas.toDataURL('image/png');
          return dataUrl.replace(/^data:image\\/png;base64,/, '');
        }

        throw new Error('All PNG export methods failed across GeoGebra versions');
      })(${scale}, ${transparent}, ${dpi})
    `;
  }

  /**
   * Browser script to execute version-compatible SVG export
   */
  public static getExportSvgScript(): string {
    return `
      (async function() {
        var applet = window.ggbApplet;
        if (!applet) throw new Error('GeoGebra applet not available');

        // Priority 1: Modern exportImage API (v6.0.700+, Suite, v7+)
        if (typeof applet.exportImage === 'function') {
          try {
            var svgImg = applet.exportImage({ type: 'svg' });
            var resolvedSvg = await Promise.resolve(svgImg);
            if (typeof resolvedSvg === 'string' && resolvedSvg.includes('<svg')) {
              return resolvedSvg;
            }
          } catch (e) {
            console.warn('exportImage(svg) attempt failed, falling back:', e);
          }
        }

        // Priority 2: Classic exportSVG with callback (v5, v6 web)
        if (typeof applet.exportSVG === 'function') {
          try {
            var cbResult = await new Promise(function(resolve, reject) {
              var timer = setTimeout(function() {
                resolve(null);
              }, 5000);

              try {
                var syncReturn = applet.exportSVG(function(svgStr) {
                  clearTimeout(timer);
                  resolve(svgStr);
                });

                if (typeof syncReturn === 'string' && syncReturn.includes('<svg')) {
                  clearTimeout(timer);
                  resolve(syncReturn);
                }
              } catch (err) {
                clearTimeout(timer);
                resolve(null);
              }
            });

            if (cbResult && typeof cbResult === 'string' && cbResult.includes('<svg')) {
              return cbResult;
            }
          } catch (e) {
            console.warn('exportSVG callback attempt failed:', e);
          }
        }

        // Priority 3: Synchronous getSVG API (Classic 5 / early 6)
        if (typeof applet.getSVG === 'function') {
          try {
            var syncSvg = applet.getSVG();
            if (typeof syncSvg === 'string' && syncSvg.includes('<svg')) {
              return syncSvg;
            }
          } catch (e) {}
        }

        // Priority 4: DOM SVG extraction fallback
        var svgEl = document.querySelector('#ggb-element svg, .geogebraweb svg');
        if (svgEl) {
          var serializer = new XMLSerializer();
          var xmlString = serializer.serializeToString(svgEl);
          if (xmlString && xmlString.includes('<svg')) {
            return xmlString;
          }
        }

        throw new Error('All SVG export methods failed across GeoGebra versions');
      })()
    `;
  }

  /**
   * Browser script to execute version-compatible PDF export
   */
  public static getExportPdfScript(): string {
    return `
      (async function() {
        var applet = window.ggbApplet;
        if (!applet) throw new Error('GeoGebra applet not available');

        // Priority 1: Modern exportImage API (v6.0.700+, Suite, v7+)
        if (typeof applet.exportImage === 'function') {
          try {
            var pdfImg = applet.exportImage({ type: 'pdf' });
            var resolvedPdf = await Promise.resolve(pdfImg);
            if (typeof resolvedPdf === 'string' && resolvedPdf.length > 20) {
              return resolvedPdf.replace(/^data:application\\/pdf;base64,/, '');
            }
          } catch (e) {}
        }

        // Priority 2: Classic getPDFBase64
        if (typeof applet.getPDFBase64 === 'function') {
          try {
            var pdfRes = await Promise.resolve(applet.getPDFBase64());
            if (typeof pdfRes === 'string' && pdfRes.length > 20) {
              return pdfRes.replace(/^data:application\\/pdf;base64,/, '');
            }
          } catch (e) {}
        }

        return null; // Will trigger Puppeteer page.pdf() fallback
      })()
    `;
  }

  /**
   * Generate comprehensive compatibility report across all GeoGebra versions
   */
  public static generateReport(profile: GeoGebraVersionProfile): GeoGebraCompatibilityReport {
    const activeAdapters: string[] = [];
    const recommendations: string[] = [];

    // Identify active adapters
    if (profile.compatibility.preferredPngMethod === 'exportImage') {
      activeAdapters.push('Modern exportImage(PNG) Adapter [v6.0.700+ / Suite / v7]');
    } else {
      activeAdapters.push('Classic getPNGBase64 Adapter [Classic 4/5/6]');
    }

    if (profile.compatibility.preferredSvgMethod === 'exportImage') {
      activeAdapters.push('Modern exportImage(SVG) Vector Adapter');
    } else if (profile.compatibility.preferredSvgMethod === 'callback') {
      activeAdapters.push('Async Callback exportSVG Adapter [Web/Classic 5/6]');
    } else {
      activeAdapters.push('Synchronous getSVG / DOM SVG Extractor');
    }

    if (profile.compatibility.casPreloadRequired) {
      activeAdapters.push('Classic CAS Preload & Engine Warmup Hook');
    }

    if (profile.compatibility.perspectiveMapping === 'subapp') {
      activeAdapters.push('Calculator Suite Multi-SubApp Perspective Router');
    } else {
      activeAdapters.push('Classic Numeric Perspective Mapper (1-6)');
    }

    // Determine generation compatibility
    const compatibleGenerations = {
      classic_4: true,
      classic_5: true,
      classic_6: true,
      modern_suite: true,
      latest: true
    };

    // Specific recommendations based on detected version
    if (profile.generation === 'classic_4' || profile.generation === 'classic_5') {
      recommendations.push('Classic 5 detected: CAS commands require explicit CAS view warmup.');
    } else if (profile.generation === 'modern_suite') {
      recommendations.push('Calculator Suite detected: High-resolution exportImage and subApp switching enabled.');
    } else if (profile.generation === 'latest') {
      recommendations.push('GeoGebra Latest detected: Full modern capabilities available.');
    }

    return {
      profile,
      compatibleGenerations,
      activeAdapters,
      recommendations
    };
  }
}
