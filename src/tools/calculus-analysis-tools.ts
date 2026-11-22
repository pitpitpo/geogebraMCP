import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const calculusAnalysisTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_tangent_line',
      description: 'Construct the tangent line to a curve, circle, or conic at a specified point or x-coordinate',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the tangent line (e.g., "tang")'
          },
          curve: {
            type: 'string',
            description: 'Name of the function or conic (e.g., "f", "c1")'
          },
          at: {
            type: 'string',
            description: 'Point name (e.g., "A") or numeric x-coordinate (e.g., "2")'
          }
        },
        required: ['name', 'curve', 'at']
      }
    },
    handler: async (params: { name: string; curve: string; at: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Tangent(${params.at}, ${params.curve})`;
        const result = await instance.evalCommand(cmd);
        const eq = await instance.getValueString(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              tangent: { name: params.name, equation: eq, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to construct tangent line', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_extrema_and_roots',
      description: 'Calculate and visualize all roots, local extrema, and inflection points of a polynomial or function',
      inputSchema: {
        type: 'object',
        properties: {
          functionName: {
            type: 'string',
            description: 'Name of the function (e.g., "f")'
          },
          findRoots: {
            type: 'boolean',
            description: 'Calculate root points'
          },
          findExtrema: {
            type: 'boolean',
            description: 'Calculate local extrema (minima and maxima)'
          },
          findInflectionPoints: {
            type: 'boolean',
            description: 'Calculate inflection points'
          }
        },
        required: ['functionName']
      }
    },
    handler: async (params: {
      functionName: string;
      findRoots?: boolean;
      findExtrema?: boolean;
      findInflectionPoints?: boolean;
    }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const results: Record<string, any> = {};

        if (params.findRoots ?? true) {
          await instance.evalCommand(`roots_${params.functionName} = {Root(${params.functionName})}`);
          const rootsStr = await instance.getValueString(`roots_${params.functionName}`);
          results['roots'] = rootsStr;
        }

        if (params.findExtrema ?? true) {
          await instance.evalCommand(`extrema_${params.functionName} = {Extremum(${params.functionName})}`);
          const extStr = await instance.getValueString(`extrema_${params.functionName}`);
          results['extrema'] = extStr;
        }

        if (params.findInflectionPoints ?? false) {
          await instance.evalCommand(`infl_${params.functionName} = {InflectionPoint(${params.functionName})}`);
          const inflStr = await instance.getValueString(`infl_${params.functionName}`);
          results['inflectionPoints'] = inflStr;
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              function: params.functionName,
              criticalPoints: results
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to calculate extrema and roots', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_taylor_polynomial',
      description: 'Compute and plot the Taylor (or Maclaurin) polynomial approximation of a function',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the polynomial function (e.g., "P_4")'
          },
          functionName: {
            type: 'string',
            description: 'Source function to expand (e.g., "f")'
          },
          x0: {
            type: 'number',
            description: 'Expansion center point x_0 (use 0 for Maclaurin series)'
          },
          order: {
            type: 'number',
            description: 'Degree / polynomial order n (e.g., 2, 4, 6)'
          }
        },
        required: ['name', 'functionName', 'x0', 'order']
      }
    },
    handler: async (params: { name: string; functionName: string; x0: number; order: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = TaylorPolynomial(${params.functionName}, ${params.x0}, ${params.order})`;
        const result = await instance.evalCommand(cmd);
        const expr = await instance.getValueString(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              taylorPolynomial: {
                name: params.name,
                order: params.order,
                center: params.x0,
                expression: expr,
                command: cmd
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute Taylor polynomial', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_limit',
      description: 'Compute the mathematical limit of a function as x approaches a target point',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Variable name to store limit result (e.g., "lim1")'
          },
          expression: {
            type: 'string',
            description: 'Function or expression (e.g., "sin(x)/x", "f")'
          },
          point: {
            type: 'number',
            description: 'Target value x approaches'
          },
          direction: {
            type: 'string',
            description: 'Limit direction: "both", "left", "right" (default "both")'
          }
        },
        required: ['name', 'expression', 'point']
      }
    },
    handler: async (params: { name: string; expression: string; point: number; direction?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        let cmd = '';
        if (params.direction === 'left') {
          cmd = `${params.name} = LimitBelow(${params.expression}, ${params.point})`;
        } else if (params.direction === 'right') {
          cmd = `${params.name} = LimitAbove(${params.expression}, ${params.point})`;
        } else {
          cmd = `${params.name} = Limit(${params.expression}, ${params.point})`;
        }

        const result = await instance.evalCommand(cmd);
        const val = await instance.getValueString(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              limit: { name: params.name, result: val, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to evaluate limit', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_asymptotes',
      description: 'Compute and plot all vertical, horizontal, and oblique/slant asymptotes of a curve',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the list of asymptotes (e.g., "asym")'
          },
          curve: {
            type: 'string',
            description: 'Name of the function or conic (e.g., "f")'
          }
        },
        required: ['name', 'curve']
      }
    },
    handler: async (params: { name: string; curve: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Asymptote(${params.curve})`;
        const result = await instance.evalCommand(cmd);
        const asymList = await instance.getValueString(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              asymptotes: { name: params.name, lines: asymList, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute asymptotes', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_definite_integral',
      description: 'Compute and visually shade the definite integral / area under a curve from a to b',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the integral object (e.g., "area1")'
          },
          functionName: {
            type: 'string',
            description: 'Name of the integrand function (e.g., "f")'
          },
          lowerLimit: {
            type: 'number',
            description: 'Lower integration bound a'
          },
          upperLimit: {
            type: 'number',
            description: 'Upper integration bound b'
          }
        },
        required: ['name', 'functionName', 'lowerLimit', 'upperLimit']
      }
    },
    handler: async (params: { name: string; functionName: string; lowerLimit: number; upperLimit: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Integral(${params.functionName}, ${params.lowerLimit}, ${params.upperLimit})`;
        const result = await instance.evalCommand(cmd);
        const val = await instance.getValue(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              integral: { name: params.name, value: val, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute definite integral', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_integral_between',
      description: 'Compute and shade the region between two curves f(x) and g(x) from a to b',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the integral region (e.g., "areaBetween")'
          },
          func1: {
            type: 'string',
            description: 'Upper function name (e.g., "f")'
          },
          func2: {
            type: 'string',
            description: 'Lower function name (e.g., "g")'
          },
          lowerLimit: {
            type: 'number',
            description: 'Start x value'
          },
          upperLimit: {
            type: 'number',
            description: 'End x value'
          }
        },
        required: ['name', 'func1', 'func2', 'lowerLimit', 'upperLimit']
      }
    },
    handler: async (params: { name: string; func1: string; func2: string; lowerLimit: number; upperLimit: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = IntegralBetween(${params.func1}, ${params.func2}, ${params.lowerLimit}, ${params.upperLimit})`;
        const result = await instance.evalCommand(cmd);
        const val = await instance.getValue(params.name);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              integralBetween: { name: params.name, value: val, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute integral between curves', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_direction_field',
      description: 'Plot a slope field / direction field for a first-order differential equation dy/dx = f(x, y)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the slope field object (e.g., "field1")'
          },
          derivativeExpr: {
            type: 'string',
            description: 'Expression for dy/dx in terms of x and y (e.g., "x - y", "sin(x) * y")'
          },
          density: {
            type: 'number',
            description: 'Grid density/segments count (optional, default 20)'
          }
        },
        required: ['name', 'derivativeExpr']
      }
    },
    handler: async (params: { name: string; derivativeExpr: string; density?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const density = params.density ?? 20;
        const cmd = `${params.name} = SlopeField(${params.derivativeExpr}, ${density})`;
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              slopeField: { name: params.name, expression: params.derivativeExpr, density, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot direction field', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
];
