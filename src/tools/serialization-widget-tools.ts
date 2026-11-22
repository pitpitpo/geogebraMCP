import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const serializationWidgetTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_get_xml',
      description: 'Export complete GeoGebra construction state as standard GeoGebra XML markup (or for a specific object)',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Optional object name to get XML for. If omitted, returns entire applet XML construction.'
          }
        },
        required: []
      }
    },
    handler: async (_params: { objectName?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const xml = await (instance.getXML ? instance.getXML() : Promise.resolve(''));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              xmlLength: xml.length,
              xml
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get GeoGebra XML', error);
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
      name: 'geogebra_set_xml',
      description: 'Restore and load complete construction state into GeoGebra from an XML string',
      inputSchema: {
        type: 'object',
        properties: {
          xml: {
            type: 'string',
            description: 'Valid GeoGebra XML construction string'
          }
        },
        required: ['xml']
      }
    },
    handler: async (params: { xml: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (instance.setXML) {
          await instance.setXML(params.xml);
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'GeoGebra construction state restored from XML'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set GeoGebra XML', error);
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
      name: 'geogebra_get_base64',
      description: 'Export complete GeoGebra construction state as a Base64-encoded binary string (.ggb file format)',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const base64 = await (instance.getBase64 ? instance.getBase64() : Promise.resolve(''));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              base64Length: base64.length,
              base64
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get GeoGebra Base64', error);
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
      name: 'geogebra_set_base64',
      description: 'Load and restore a complete GeoGebra worksheet from a Base64-encoded binary string (.ggb file)',
      inputSchema: {
        type: 'object',
        properties: {
          base64: {
            type: 'string',
            description: 'Base64-encoded string representing a .ggb GeoGebra construction file'
          }
        },
        required: ['base64']
      }
    },
    handler: async (params: { base64: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        if (instance.setBase64) {
          await instance.setBase64(params.base64);
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'GeoGebra construction restored from Base64 binary'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set GeoGebra Base64', error);
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
      name: 'geogebra_batch_commands',
      description: 'Execute multiple GeoGebra commands sequentially in a single batch call with execution reporting',
      inputSchema: {
        type: 'object',
        properties: {
          commands: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of GeoGebra commands to execute in sequential order'
          },
          stopOnError: {
            type: 'boolean',
            description: 'Whether to halt execution immediately if a command fails (default: false)'
          }
        },
        required: ['commands']
      }
    },
    handler: async (params: { commands: string[]; stopOnError?: boolean }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const results: Array<{ command: string; success: boolean; label?: string | undefined; error?: string | undefined }> = [];

        for (const cmd of params.commands) {
          try {
            const res = await instance.evalCommand(cmd);
            results.push({
              command: cmd,
              success: res.success,
              label: res.labels && res.labels.length > 0 ? res.labels[0] : undefined
            });
          } catch (cmdErr) {
            const errMsg = cmdErr instanceof Error ? cmdErr.message : String(cmdErr);
            results.push({
              command: cmd,
              success: false,
              error: errMsg
            });
            if (params.stopOnError) {
              break;
            }
          }
        }

        const successCount = results.filter(r => r.success).length;

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              totalCommands: params.commands.length,
              executed: results.length,
              successCount,
              failedCount: results.length - successCount,
              results
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to execute batch commands', error);
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
      name: 'geogebra_create_checkbox',
      description: 'Create an interactive boolean checkbox in the Graphics view to toggle visibility of associated objects',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the boolean variable (e.g., "showTangents", "b1")'
          },
          label: {
            type: 'string',
            description: 'Display label next to checkbox (e.g., "Show Tangent Line")'
          },
          checked: {
            type: 'boolean',
            description: 'Initial state of checkbox (default: true)'
          },
          actionObjects: {
            type: 'string',
            description: 'Optional list of object names to associate with checkbox visibility (e.g., "{f, P, tang}")'
          }
        },
        required: ['name', 'label']
      }
    },
    handler: async (params: { name: string; label: string; checked?: boolean; actionObjects?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = params.actionObjects
          ? `${params.name} = Checkbox(${params.actionObjects})`
          : `${params.name} = Checkbox()`;

        const result = await instance.evalCommand(cmd);
        if (instance.setCaption) {
          await instance.setCaption(params.name, params.label);
        }
        if (params.checked !== undefined && instance.setValue) {
          await instance.setValue(params.name, params.checked ? 1 : 0);
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              checkbox: {
                name: params.name,
                label: params.label,
                checked: params.checked ?? true,
                command: cmd
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create checkbox', error);
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
      name: 'geogebra_create_button',
      description: 'Create an interactive push button in the Graphics view with an executable GeoGebra script',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the button object (e.g., "btnReset", "btn1")'
          },
          caption: {
            type: 'string',
            description: 'Text caption displayed on the button (e.g., "Reset Construction", "Calculate")'
          },
          script: {
            type: 'string',
            description: 'GeoGebra scripting command(s) executed when clicked (e.g., "StartAnimation()", "SetValue(a, 0)")'
          }
        },
        required: ['name', 'caption', 'script']
      }
    },
    handler: async (params: { name: string; caption: string; script: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = Button("${params.caption}")`;
        const result = await instance.evalCommand(cmd);
        if (instance.setCaption) {
          await instance.setCaption(params.name, params.caption);
        }

        // Attach click script via SetClickScript command
        const escapedScript = params.script.replace(/"/g, '\\"');
        await instance.evalCommand(`SetClickScript(${params.name}, "${escapedScript}")`);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              button: {
                name: params.name,
                caption: params.caption,
                script: params.script,
                command: cmd
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create button', error);
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
      name: 'geogebra_create_input_box',
      description: 'Create an interactive input box in the Graphics view linked to a variable, number, or function',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the input box object (e.g., "ib1", "funcInput")'
          },
          linkedObject: {
            type: 'string',
            description: 'Name of the variable, function, or point linked to the input box (e.g., "f", "a", "k")'
          },
          caption: {
            type: 'string',
            description: 'Optional label or caption displayed next to the input box (e.g., "f(x) = ")'
          }
        },
        required: ['name', 'linkedObject']
      }
    },
    handler: async (params: { name: string; linkedObject: string; caption?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const cmd = `${params.name} = InputBox(${params.linkedObject})`;
        const result = await instance.evalCommand(cmd);

        if (params.caption && instance.setCaption) {
          await instance.setCaption(params.name, params.caption);
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              inputBox: {
                name: params.name,
                linkedObject: params.linkedObject,
                caption: params.caption,
                command: cmd
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create input box', error);
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
