import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const geometry3dTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_create_3d_point',
      description: 'Create a 3D point with (x, y, z) coordinates in GeoGebra 3D Graphics view',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the point (e.g., "P", "A3")'
          },
          x: {
            type: 'number',
            description: 'X coordinate'
          },
          y: {
            type: 'number',
            description: 'Y coordinate'
          },
          z: {
            type: 'number',
            description: 'Z coordinate'
          }
        },
        required: ['name', 'x', 'y', 'z']
      }
    },
    handler: async (params: { name: string; x: number; y: number; z: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = (${params.x}, ${params.y}, ${params.z})`;
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              point: { name: params.name, x: params.x, y: params.y, z: params.z },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create 3D point', error);
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
      name: 'geogebra_create_sphere',
      description: 'Create a 3D sphere defined by a center point and radius',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the sphere (e.g., "sph1")'
          },
          center: {
            type: 'string',
            description: 'Center point name or coordinates string (e.g., "A", "(0, 0, 0)")'
          },
          radius: {
            type: 'number',
            description: 'Radius of the sphere (must be > 0)'
          }
        },
        required: ['name', 'center', 'radius']
      }
    },
    handler: async (params: { name: string; center: string; radius: number }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Sphere(${params.center}, ${params.radius})`;
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              sphere: { name: params.name, center: params.center, radius: params.radius },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create sphere', error);
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
      name: 'geogebra_create_plane',
      description: 'Create a 3D plane through 3 points or from a linear 3D equation (ax + by + cz = d)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the plane (e.g., "p1")'
          },
          definition: {
            type: 'string',
            description: '3 point names separated by commas (e.g. "A, B, C") or equation (e.g. "2x - 3y + z = 5")'
          }
        },
        required: ['name', 'definition']
      }
    },
    handler: async (params: { name: string; definition: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        let cmd = '';
        if (params.definition.includes('=')) {
          cmd = `${params.name}: ${params.definition}`;
        } else {
          cmd = `${params.name} = Plane(${params.definition})`;
        }
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              plane: { name: params.name, definition: params.definition },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create plane', error);
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
      name: 'geogebra_create_polyhedron',
      description: 'Create 3D polyhedra and solids (Cube, Tetrahedron, Pyramid, Prism, Cylinder, Cone)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the 3D solid'
          },
          type: {
            type: 'string',
            description: 'Type of solid: "cube", "tetrahedron", "pyramid", "prism", "cylinder", "cone"'
          },
          parameters: {
            type: 'string',
            description: 'Parameters list (e.g., "A, B" for cube, "A, B, r" for cylinder, "polygon, height" for prism)'
          }
        },
        required: ['name', 'type', 'parameters']
      }
    },
    handler: async (params: { name: string; type: string; parameters: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const typeCapitalized = params.type.charAt(0).toUpperCase() + params.type.slice(1).toLowerCase();
        const cmd = `${params.name} = ${typeCapitalized}(${params.parameters})`;
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              solid: { name: params.name, type: params.type, parameters: params.parameters },
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create polyhedron', error);
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
      name: 'geogebra_surface_3d',
      description: 'Plot a 3D parametric surface defined by x(u,v), y(u,v), z(u,v)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the surface (e.g., "s1")'
          },
          xExpr: {
            type: 'string',
            description: 'X coordinate expression in terms of u and v (e.g., "u * cos(v)")'
          },
          yExpr: {
            type: 'string',
            description: 'Y coordinate expression in terms of u and v (e.g., "u * sin(v)")'
          },
          zExpr: {
            type: 'string',
            description: 'Z coordinate expression in terms of u and v (e.g., "u")'
          },
          uMin: {
            type: 'number',
            description: 'u parameter minimum'
          },
          uMax: {
            type: 'number',
            description: 'u parameter maximum'
          },
          vMin: {
            type: 'number',
            description: 'v parameter minimum'
          },
          vMax: {
            type: 'number',
            description: 'v parameter maximum'
          }
        },
        required: ['name', 'xExpr', 'yExpr', 'zExpr', 'uMin', 'uMax', 'vMin', 'vMax']
      }
    },
    handler: async (params: {
      name: string;
      xExpr: string;
      yExpr: string;
      zExpr: string;
      uMin: number;
      uMax: number;
      vMin: number;
      vMax: number;
    }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Surface(${params.xExpr}, ${params.yExpr}, ${params.zExpr}, u, ${params.uMin}, ${params.uMax}, v, ${params.vMin}, ${params.vMax})`;
        const result = await instance.evalCommand(cmd);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              surface: { name: params.name, command: cmd }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create 3D surface', error);
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
