import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const objectStylingTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_delete_object',
      description: 'Delete one or more objects from the GeoGebra construction by name',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'The name of the object to delete (e.g., "A", "f", "c1")'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const success = await instance.deleteObject(params.objectName);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success, deletedObject: params.objectName }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to delete object', error);
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
      name: 'geogebra_set_value',
      description: 'Set the numeric or scalar value of an existing GeoGebra object (e.g., a slider or variable)',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object/slider/variable (e.g., "k", "a")'
          },
          value: {
            type: 'number',
            description: 'Numeric value to assign'
          }
        },
        required: ['objectName', 'value']
      }
    },
    handler: async (params: { objectName: string; value: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.setValue(params.objectName, params.value);
        const updatedVal = await instance.getValue(params.objectName);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, objectName: params.objectName, value: updatedVal }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set value', error);
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
      name: 'geogebra_get_value',
      description: 'Get the current numeric and string value of a GeoGebra object or expression',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object or expression to evaluate (e.g., "a", "Area", "f(2)")'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const numVal = await instance.getValue(params.objectName);
        const strVal = await instance.getValueString(params.objectName);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              value: numVal,
              valueString: strVal
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get value', error);
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
      name: 'geogebra_get_coordinates',
      description: 'Get the exact (x, y, z) coordinates of a point or vector in GeoGebra',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the point or vector (e.g., "A", "B", "P")'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const x = await instance.getXcoord(params.objectName);
        const y = await instance.getYcoord(params.objectName);
        const z = await instance.getZcoord(params.objectName);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              coordinates: { x, y, z }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get coordinates', error);
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
      name: 'geogebra_set_coordinates',
      description: 'Move or set the coordinates of a free point or vector',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the point or vector'
          },
          x: {
            type: 'number',
            description: 'New X coordinate'
          },
          y: {
            type: 'number',
            description: 'New Y coordinate'
          },
          z: {
            type: 'number',
            description: 'New Z coordinate (optional, default 0)'
          }
        },
        required: ['objectName', 'x', 'y']
      }
    },
    handler: async (params: { objectName: string; x: number; y: number; z?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setCoords === 'function') {
          await (instance as any).setCoords(params.objectName, params.x, params.y, params.z || 0);
        } else {
          await instance.evalCommand(`SetCoords(${params.objectName}, ${params.x}, ${params.y}${params.z !== undefined ? ', ' + params.z : ''})`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              coordinates: { x: params.x, y: params.y, z: params.z || 0 }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set coordinates', error);
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
      name: 'geogebra_set_color',
      description: 'Set the visual color (RGB 0-255) and opacity (0-1) of an object',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          },
          red: {
            type: 'number',
            description: 'Red component (0-255)'
          },
          green: {
            type: 'number',
            description: 'Green component (0-255)'
          },
          blue: {
            type: 'number',
            description: 'Blue component (0-255)'
          },
          alpha: {
            type: 'number',
            description: 'Opacity/filling from 0 (transparent) to 1 (opaque)'
          }
        },
        required: ['objectName', 'red', 'green', 'blue']
      }
    },
    handler: async (params: { objectName: string; red: number; green: number; blue: number; alpha?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setColor === 'function') {
          await (instance as any).setColor(params.objectName, params.red, params.green, params.blue, params.alpha ?? 1);
        } else {
          await instance.evalCommand(`SetColor(${params.objectName}, ${params.red}/255, ${params.green}/255, ${params.blue}/255)`);
          if (params.alpha !== undefined) {
            await instance.evalCommand(`SetFilling(${params.objectName}, ${params.alpha})`);
          }
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              color: { r: params.red, g: params.green, b: params.blue, alpha: params.alpha ?? 1 }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set color', error);
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
      name: 'geogebra_set_visible',
      description: 'Show or hide a GeoGebra object in the graphics view',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          },
          visible: {
            type: 'boolean',
            description: 'true to show, false to hide'
          }
        },
        required: ['objectName', 'visible']
      }
    },
    handler: async (params: { objectName: string; visible: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setVisible === 'function') {
          await (instance as any).setVisible(params.objectName, params.visible);
        } else {
          await instance.evalCommand(`SetVisibleInView(${params.objectName}, 1, ${params.visible})`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, objectName: params.objectName, visible: params.visible }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set visibility', error);
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
      name: 'geogebra_set_label_visible',
      description: 'Show or hide the label/name of a GeoGebra object',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          },
          visible: {
            type: 'boolean',
            description: 'true to show label, false to hide'
          }
        },
        required: ['objectName', 'visible']
      }
    },
    handler: async (params: { objectName: string; visible: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setLabelVisible === 'function') {
          await (instance as any).setLabelVisible(params.objectName, params.visible);
        } else {
          await instance.evalCommand(`ShowLabel(${params.objectName}, ${params.visible})`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, objectName: params.objectName, labelVisible: params.visible }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set label visibility', error);
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
      name: 'geogebra_set_caption',
      description: 'Set a custom caption (supports LaTeX formatting e.g. "$x^2$") and label style for an object',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          },
          caption: {
            type: 'string',
            description: 'Caption text (e.g., "Midpoint M", "$\\alpha$")'
          },
          showCaptionOnly: {
            type: 'boolean',
            description: 'If true, display only caption instead of name'
          }
        },
        required: ['objectName', 'caption']
      }
    },
    handler: async (params: { objectName: string; caption: string; showCaptionOnly?: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setCaption === 'function') {
          await (instance as any).setCaption(params.objectName, params.caption);
          if (params.showCaptionOnly && typeof (instance as any).setLabelStyle === 'function') {
            await (instance as any).setLabelStyle(params.objectName, 3); // 3 = caption only
          }
        } else {
          await instance.evalCommand(`SetCaption(${params.objectName}, "${params.caption}")`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, objectName: params.objectName, caption: params.caption }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set caption', error);
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
      name: 'geogebra_set_fixed',
      description: 'Lock or unlock an object to prevent it from being accidentally moved or dragged',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          },
          fixed: {
            type: 'boolean',
            description: 'true to lock/fix object, false to unlock'
          }
        },
        required: ['objectName', 'fixed']
      }
    },
    handler: async (params: { objectName: string; fixed: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setFixed === 'function') {
          await (instance as any).setFixed(params.objectName, params.fixed);
        } else {
          await instance.evalCommand(`SetFixed(${params.objectName}, ${params.fixed})`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, objectName: params.objectName, fixed: params.fixed }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set fixed', error);
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
      name: 'geogebra_set_line_style',
      description: 'Set line thickness and line style (solid, dashed, dotted)',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the line, segment, circle, or function'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1 to 13)'
          },
          style: {
            type: 'number',
            description: '0 = full/solid, 1 = dashed long, 2 = dashed short, 3 = dotted, 4 = dash-dot'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string; thickness?: number; style?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (params.thickness !== undefined) {
          if (typeof (instance as any).setLineThickness === 'function') {
            await (instance as any).setLineThickness(params.objectName, params.thickness);
          } else {
            await instance.evalCommand(`SetLineThickness(${params.objectName}, ${params.thickness})`);
          }
        }
        if (params.style !== undefined) {
          if (typeof (instance as any).setLineStyle === 'function') {
            await (instance as any).setLineStyle(params.objectName, params.style);
          } else {
            await instance.evalCommand(`SetLineStyle(${params.objectName}, ${params.style})`);
          }
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              thickness: params.thickness,
              style: params.style
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set line style', error);
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
      name: 'geogebra_set_point_style',
      description: 'Set point size and point visual glyph style',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the point'
          },
          size: {
            type: 'number',
            description: 'Point size (1 to 9)'
          },
          style: {
            type: 'number',
            description: '0 = filled circle, 1 = cross, 2 = empty circle, 3 = plus, 4 = diamond, 5 = triangle'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string; size?: number; style?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (params.size !== undefined) {
          if (typeof (instance as any).setPointSize === 'function') {
            await (instance as any).setPointSize(params.objectName, params.size);
          } else {
            await instance.evalCommand(`SetPointSize(${params.objectName}, ${params.size})`);
          }
        }
        if (params.style !== undefined) {
          if (typeof (instance as any).setPointStyle === 'function') {
            await (instance as any).setPointStyle(params.objectName, params.style);
          } else {
            await instance.evalCommand(`SetPointStyle(${params.objectName}, ${params.style})`);
          }
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              size: params.size,
              style: params.style
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set point style', error);
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
      name: 'geogebra_get_definition_string',
      description: 'Get the exact algebraic definition string and command that created an object',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object'
          }
        },
        required: ['objectName']
      }
    },
    handler: async (params: { objectName: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const defStr = typeof (instance as any).getDefinitionString === 'function'
          ? await (instance as any).getDefinitionString(params.objectName)
          : '';
        const cmdStr = typeof (instance as any).getCommandString === 'function'
          ? await (instance as any).getCommandString(params.objectName)
          : '';
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectName: params.objectName,
              definitionString: defStr,
              commandString: cmdStr
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get definition string', error);
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
