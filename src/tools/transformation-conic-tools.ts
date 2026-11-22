import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const transformationConicTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_transform_object',
      description: 'Apply geometric transformations to an object: rotate, reflect, translate, dilate (scale), or shear',
      inputSchema: {
        type: 'object',
        properties: {
          object: {
            type: 'string',
            description: 'Name of the object to transform (e.g., "poly1", "A", "f", "c")'
          },
          type: {
            type: 'string',
            description: 'Transformation type: "rotate", "reflect", "translate", "dilate", or "shear"'
          },
          centerOrAxis: {
            type: 'string',
            description: 'Center point (for rotate/dilate), axis/line/point (for reflect), or shear line (e.g., "(0, 0)", "xAxis", "line1")'
          },
          factorOrAngle: {
            type: 'string',
            description: 'Angle for rotation (e.g. "45°", "pi/3") or scale factor for dilation/shear (e.g. "2", "0.5")'
          },
          vector: {
            type: 'string',
            description: 'Translation vector name or definition (e.g., "u", "Vector((2, 3))")'
          },
          name: {
            type: 'string',
            description: 'Name for the transformed object (e.g., "poly1_rot")'
          }
        },
        required: ['object', 'type']
      }
    },
    handler: async (params: {
      object: string;
      type: string;
      centerOrAxis?: string;
      factorOrAngle?: string;
      vector?: string;
      name?: string;
    }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const tType = params.type.toLowerCase();
        let transformExpr = '';

        switch (tType) {
          case 'rotate':
            transformExpr = `Rotate(${params.object}, ${params.factorOrAngle || '90°'}${params.centerOrAxis ? ', ' + params.centerOrAxis : ', (0, 0)'})`;
            break;
          case 'reflect':
            transformExpr = `Reflect(${params.object}, ${params.centerOrAxis || 'xAxis'})`;
            break;
          case 'translate':
            transformExpr = `Translate(${params.object}, ${params.vector || 'Vector((1, 1))'})`;
            break;
          case 'dilate':
          case 'scale':
            transformExpr = `Dilate(${params.object}, ${params.factorOrAngle || '2'}${params.centerOrAxis ? ', ' + params.centerOrAxis : ', (0, 0)'})`;
            break;
          case 'shear':
            transformExpr = `Shear(${params.object}, ${params.centerOrAxis || 'xAxis'}, ${params.factorOrAngle || '1'})`;
            break;
          default:
            throw new Error(`Unsupported transformation type: ${params.type}`);
        }

        const outName = params.name || `${params.object}_${tType}`;
        const cmd = `${outName} = ${transformExpr}`;
        const result = await instance.evalCommand(cmd);
        const valStr = await instance.getValueString(outName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              transformation: tType,
              name: outName,
              definition: valStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to transform object', error);
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
      name: 'geogebra_create_conic',
      description: 'Construct conic sections: ellipse (foci + point/distance), hyperbola (foci + point/distance), parabola (focus + directrix), circle, or conic through 5 points',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the conic (e.g., "el1", "hyp1", "par1", "con1")'
          },
          conicType: {
            type: 'string',
            description: 'Conic section type: "ellipse", "hyperbola", "parabola", "circle_radius", or "conic_five_points"'
          },
          param1: {
            type: 'string',
            description: 'First parameter: Focus 1, center, or Point 1 (e.g., "A", "(-2, 0)")'
          },
          param2: {
            type: 'string',
            description: 'Second parameter: Focus 2, directrix line, radius, or Point 2 (e.g., "B", "y = -2", "4")'
          },
          param3: {
            type: 'string',
            description: 'Optional third parameter: Point on conic, major axis length, or Point 3 (e.g., "C", "5")'
          },
          param4: {
            type: 'string',
            description: 'Optional fourth parameter: Point 4 (for conic through 5 points)'
          },
          param5: {
            type: 'string',
            description: 'Optional fifth parameter: Point 5 (for conic through 5 points)'
          }
        },
        required: ['name', 'conicType', 'param1', 'param2']
      }
    },
    handler: async (params: {
      name: string;
      conicType: string;
      param1: string;
      param2: string;
      param3?: string;
      param4?: string;
      param5?: string;
    }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cType = params.conicType.toLowerCase();
        let conicExpr = '';

        switch (cType) {
          case 'ellipse':
            conicExpr = `Ellipse(${params.param1}, ${params.param2}, ${params.param3 || '5'})`;
            break;
          case 'hyperbola':
            conicExpr = `Hyperbola(${params.param1}, ${params.param2}, ${params.param3 || '3'})`;
            break;
          case 'parabola':
            conicExpr = `Parabola(${params.param1}, ${params.param2})`;
            break;
          case 'circle_radius':
            conicExpr = `Circle(${params.param1}, ${params.param2})`;
            break;
          case 'conic_five_points':
            if (!params.param3 || !params.param4 || !params.param5) {
              throw new Error('conic_five_points requires param1, param2, param3, param4, and param5');
            }
            conicExpr = `Conic(${params.param1}, ${params.param2}, ${params.param3}, ${params.param4}, ${params.param5})`;
            break;
          default:
            throw new Error(`Unsupported conic type: ${params.conicType}`);
        }

        const cmd = `${params.name} = ${conicExpr}`;
        const result = await instance.evalCommand(cmd);
        const eqStr = await instance.getValueString(params.name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              conicType: cType,
              name: params.name,
              equation: eqStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create conic', error);
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
      name: 'geogebra_locus',
      description: 'Construct a locus curve representing the path traced by a dependent point as another point moves along a path or slider',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the locus curve (e.g., "loc1")'
          },
          point: {
            type: 'string',
            description: 'Dependent point tracing the path (e.g., "P")'
          },
          movingPoint: {
            type: 'string',
            description: 'Moving point or slider driving the motion (e.g., "M", "t")'
          }
        },
        required: ['name', 'point', 'movingPoint']
      }
    },
    handler: async (params: { name: string; point: string; movingPoint: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Locus(${params.point}, ${params.movingPoint})`;
        const result = await instance.evalCommand(cmd);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              locus: { name: params.name, point: params.point, movingPoint: params.movingPoint },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to construct locus', error);
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
      name: 'geogebra_measure_angle',
      description: 'Measure and display an angle defined by three points (A, B, C) or between two intersecting lines/vectors',
      inputSchema: {
        type: 'object',
        properties: {
          pointsOrLines: {
            type: 'string',
            description: 'Three points defining the angle (e.g. "A, B, C" for angle ABC) or two lines (e.g. "f, g")'
          },
          name: {
            type: 'string',
            description: 'Optional name for the angle variable (e.g., "alpha", "angle1")'
          }
        },
        required: ['pointsOrLines']
      }
    },
    handler: async (params: { pointsOrLines: string; name?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const angleName = params.name || 'ang';
        const cmd = `${angleName} = Angle(${params.pointsOrLines})`;
        const result = await instance.evalCommand(cmd);
        const valStr = await instance.getValueString(angleName);
        const degVal = await instance.getValue(angleName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              name: angleName,
              value: degVal,
              formatted: valStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to measure angle', error);
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
      name: 'geogebra_intersect_objects',
      description: 'Find intersection points between two geometric objects (curves, lines, conics, circles, or functions)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the intersection point(s) (e.g., "P_int", "roots")'
          },
          object1: {
            type: 'string',
            description: 'First geometric object (e.g., "f", "c1", "line1", "xAxis")'
          },
          object2: {
            type: 'string',
            description: 'Second geometric object (e.g., "g", "c2", "line2", "yAxis")'
          },
          index: {
            type: 'number',
            description: 'Optional intersection index (1, 2, ...) if choosing a specific intersection point'
          }
        },
        required: ['name', 'object1', 'object2']
      }
    },
    handler: async (params: { name: string; object1: string; object2: string; index?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        let cmd = '';
        if (params.index !== undefined) {
          cmd = `${params.name} = Intersect(${params.object1}, ${params.object2}, ${params.index})`;
        } else {
          cmd = `${params.name} = Intersect(${params.object1}, ${params.object2})`;
        }

        const result = await instance.evalCommand(cmd);
        const x = await instance.getXcoord(params.name);
        const y = await instance.getYcoord(params.name);
        const z = await instance.getZcoord(params.name);
        const valStr = await instance.getValueString(params.name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              name: params.name,
              value: valStr,
              coordinates: { x, y, z },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to find intersection of objects', error);
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
