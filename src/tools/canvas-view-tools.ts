import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const canvasViewTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_set_coord_system',
      description: 'Configure the viewport coordinate bounds (xmin, xmax, ymin, ymax, and optional zmin, zmax for 3D)',
      inputSchema: {
        type: 'object',
        properties: {
          xmin: {
            type: 'number',
            description: 'Minimum X coordinate'
          },
          xmax: {
            type: 'number',
            description: 'Maximum X coordinate'
          },
          ymin: {
            type: 'number',
            description: 'Minimum Y coordinate'
          },
          ymax: {
            type: 'number',
            description: 'Maximum Y coordinate'
          },
          zmin: {
            type: 'number',
            description: 'Minimum Z coordinate (for 3D view)'
          },
          zmax: {
            type: 'number',
            description: 'Maximum Z coordinate (for 3D view)'
          }
        },
        required: ['xmin', 'xmax', 'ymin', 'ymax']
      }
    },
    handler: async (params: { xmin: number; xmax: number; ymin: number; ymax: number; zmin?: number; zmax?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (params.zmin !== undefined && params.zmax !== undefined) {
          await instance.evalCommand(`SetCoordSystem(${params.xmin}, ${params.xmax}, ${params.ymin}, ${params.ymax}, ${params.zmin}, ${params.zmax})`);
        } else {
          await instance.setCoordSystem(params.xmin, params.xmax, params.ymin, params.ymax);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              coordSystem: {
                xmin: params.xmin,
                xmax: params.xmax,
                ymin: params.ymin,
                ymax: params.ymax,
                zmin: params.zmin,
                zmax: params.zmax
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set coordinate system', error);
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
      name: 'geogebra_set_axes_visible',
      description: 'Toggle visibility of coordinate axes',
      inputSchema: {
        type: 'object',
        properties: {
          xAxis: {
            type: 'boolean',
            description: 'Whether to show the X axis'
          },
          yAxis: {
            type: 'boolean',
            description: 'Whether to show the Y axis'
          },
          zAxis: {
            type: 'boolean',
            description: 'Whether to show the Z axis (3D)'
          }
        },
        required: ['xAxis', 'yAxis']
      }
    },
    handler: async (params: { xAxis: boolean; yAxis: boolean; zAxis?: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.setAxesVisible(params.xAxis, params.yAxis);
        if (params.zAxis !== undefined) {
          await instance.evalCommand(`ShowAxes(1, ${params.xAxis}, ${params.yAxis}, ${params.zAxis})`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              axes: { xAxis: params.xAxis, yAxis: params.yAxis, zAxis: params.zAxis }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set axes visibility', error);
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
      name: 'geogebra_set_grid_visible',
      description: 'Toggle visibility of the coordinate grid',
      inputSchema: {
        type: 'object',
        properties: {
          visible: {
            type: 'boolean',
            description: 'Whether to show the grid'
          }
        },
        required: ['visible']
      }
    },
    handler: async (params: { visible: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.setGridVisible(params.visible);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, gridVisible: params.visible }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set grid visibility', error);
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
      name: 'geogebra_set_perspective',
      description: 'Switch GeoGebra view or perspective ("algebra", "geometry", "cas", "3d", "spreadsheet", "probability", "suite")',
      inputSchema: {
        type: 'object',
        properties: {
          perspective: {
            type: 'string',
            description: 'Perspective name or numeric code (e.g. "algebra", "geometry", "cas", "3d", "1", "2", "5", "6")'
          }
        },
        required: ['perspective']
      }
    },
    handler: async (params: { perspective: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).setPerspective === 'function') {
          await (instance as any).setPerspective(params.perspective);
        } else {
          await instance.evalCommand(`SetPerspective("${params.perspective}")`);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, perspective: params.perspective }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set perspective', error);
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
      name: 'geogebra_reset',
      description: 'Reset construction and refresh all views back to initial clean state',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.reset();
        await instance.refreshViews();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, message: 'GeoGebra construction reset successfully' }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to reset construction', error);
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
      name: 'geogebra_undo',
      description: 'Undo the last construction action in GeoGebra',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).undo === 'function') {
          await (instance as any).undo();
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, message: 'Undo executed' }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to undo', error);
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
      name: 'geogebra_redo',
      description: 'Redo the previously undone action in GeoGebra',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (typeof (instance as any).redo === 'function') {
          await (instance as any).redo();
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: true, message: 'Redo executed' }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to redo', error);
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
      name: 'geogebra_zoom',
      description: 'Zoom into or out of the graphics view with a given zoom factor',
      inputSchema: {
        type: 'object',
        properties: {
          factor: {
            type: 'number',
            description: 'Zoom multiplier (e.g., 2 to zoom in 2x, 0.5 to zoom out 2x)'
          },
          centerX: {
            type: 'number',
            description: 'Zoom center X coordinate (optional, default 0)'
          },
          centerY: {
            type: 'number',
            description: 'Zoom center Y coordinate (optional, default 0)'
          }
        },
        required: ['factor']
      }
    },
    handler: async (params: { factor: number; centerX?: number; centerY?: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cx = params.centerX ?? 0;
        const cy = params.centerY ?? 0;
        await instance.evalCommand(`ZoomIn(${params.factor}, (${cx}, ${cy}))`);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              zoom: { factor: params.factor, centerX: cx, centerY: cy }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to zoom view', error);
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
      name: 'geogebra_pan_view',
      description: 'Pan/shift the graphics view by a given delta offset',
      inputSchema: {
        type: 'object',
        properties: {
          deltaX: {
            type: 'number',
            description: 'Horizontal pan amount in coordinate units'
          },
          deltaY: {
            type: 'number',
            description: 'Vertical pan amount in coordinate units'
          }
        },
        required: ['deltaX', 'deltaY']
      }
    },
    handler: async (params: { deltaX: number; deltaY: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.evalCommand(`Pan(${params.deltaX}, ${params.deltaY})`);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              panned: { deltaX: params.deltaX, deltaY: params.deltaY }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to pan view', error);
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
