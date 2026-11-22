import { ToolDefinition } from '../types/mcp';
import { instancePool } from './geogebra-tools';
import logger from '../utils/logger';

export const linearAlgebraStatisticsTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_create_vector',
      description: 'Create a 2D or 3D vector from coordinates, endpoints, or Cartesian definition',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the vector (e.g., "u", "v", "w")'
          },
          definition: {
            type: 'string',
            description: 'Vector coordinates or endpoints (e.g., "(3, 2)", "(1, 2, 3)", or "A, B" for vector from point A to B)'
          },
          startPoint: {
            type: 'string',
            description: 'Optional starting/anchor point for the vector (e.g., "A", "(1, 1)")'
          }
        },
        required: ['name', 'definition']
      }
    },
    handler: async (params: { name: string; definition: string; startPoint?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        let cmd = '';
        if (params.startPoint) {
          cmd = `${params.name} = Vector(${params.startPoint}, ${params.definition})`;
        } else {
          cmd = `${params.name} = Vector(${params.definition})`;
        }

        const result = await instance.evalCommand(cmd);
        const x = await instance.getXcoord(params.name);
        const y = await instance.getYcoord(params.name);
        const z = await instance.getZcoord(params.name);
        const valueStr = await instance.getValueString(params.name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              vector: {
                name: params.name,
                definition: valueStr,
                coordinates: { x, y, z },
                command: cmd
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create vector', error);
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
      name: 'geogebra_matrix_operations',
      description: 'Perform matrix operations: invert, determinant, transpose, eigenvalues, eigenvectors, reduced row echelon form (RREF), rank, or trace',
      inputSchema: {
        type: 'object',
        properties: {
          matrix: {
            type: 'string',
            description: 'Matrix definition or variable name (e.g., "{{1, 2}, {3, 4}}" or "M1")'
          },
          operation: {
            type: 'string',
            description: 'Matrix operation: "invert", "determinant", "transpose", "eigenvalues", "eigenvectors", "rref", "rank", or "trace"'
          },
          outputName: {
            type: 'string',
            description: 'Name for the resulting matrix or scalar (e.g., "invM", "detM")'
          }
        },
        required: ['matrix', 'operation']
      }
    },
    handler: async (params: { matrix: string; operation: string; outputName?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const op = params.operation.toLowerCase();
        let cmdExpr = '';

        switch (op) {
          case 'invert':
          case 'inverse':
            cmdExpr = `Invert(${params.matrix})`;
            break;
          case 'determinant':
          case 'det':
            cmdExpr = `Determinant(${params.matrix})`;
            break;
          case 'transpose':
            cmdExpr = `Transpose(${params.matrix})`;
            break;
          case 'eigenvalues':
            cmdExpr = `Eigenvalues(${params.matrix})`;
            break;
          case 'eigenvectors':
            cmdExpr = `Eigenvectors(${params.matrix})`;
            break;
          case 'rref':
            cmdExpr = `ReducedRowEchelonForm(${params.matrix})`;
            break;
          case 'rank':
            cmdExpr = `MatrixRank(${params.matrix})`;
            break;
          case 'trace':
            cmdExpr = `Trace(${params.matrix})`;
            break;
          default:
            throw new Error(`Unsupported matrix operation: ${params.operation}`);
        }

        const targetName = params.outputName || `mat_${op}`;
        const cmd = `${targetName} = ${cmdExpr}`;
        const result = await instance.evalCommand(cmd);
        const valStr = await instance.getValueString(targetName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              operation: op,
              resultName: targetName,
              value: valStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to perform matrix operation', error);
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
      name: 'geogebra_fit_curve',
      description: 'Perform curve fitting / regression analysis on a list of points (linear, polynomial, exponential, power, logarithmic, sinusoidal, logistic)',
      inputSchema: {
        type: 'object',
        properties: {
          pointsList: {
            type: 'string',
            description: 'List of points or list variable name (e.g., "{(1, 2), (2, 5), (3, 7), (4, 11)}" or "list1")'
          },
          fitType: {
            type: 'string',
            description: 'Regression type: "linear", "poly", "exp", "power", "log", "sin", or "logistic"'
          },
          order: {
            type: 'number',
            description: 'Polynomial degree/order when fitType is "poly" (default: 2)'
          },
          name: {
            type: 'string',
            description: 'Name for the fitted curve function (e.g., "f_fit")'
          }
        },
        required: ['pointsList', 'fitType']
      }
    },
    handler: async (params: { pointsList: string; fitType: string; order?: number; name?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const type = params.fitType.toLowerCase();
        let fitFunc = '';

        switch (type) {
          case 'linear':
          case 'line':
            fitFunc = `FitLine(${params.pointsList})`;
            break;
          case 'poly':
          case 'polynomial':
            fitFunc = `FitPoly(${params.pointsList}, ${params.order ?? 2})`;
            break;
          case 'exp':
          case 'exponential':
            fitFunc = `FitExp(${params.pointsList})`;
            break;
          case 'power':
          case 'pow':
            fitFunc = `FitPow(${params.pointsList})`;
            break;
          case 'log':
          case 'logarithmic':
            fitFunc = `FitLog(${params.pointsList})`;
            break;
          case 'sin':
          case 'sinusoidal':
            fitFunc = `FitSin(${params.pointsList})`;
            break;
          case 'logistic':
            fitFunc = `FitLogistic(${params.pointsList})`;
            break;
          default:
            throw new Error(`Unsupported fit type: ${params.fitType}`);
        }

        const outName = params.name || `fit_${type}`;
        const cmd = `${outName} = ${fitFunc}`;
        const result = await instance.evalCommand(cmd);
        const eqStr = await instance.getValueString(outName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              fitType: type,
              functionName: outName,
              equation: eqStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to fit curve', error);
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
      name: 'geogebra_statistical_analysis',
      description: 'Compute comprehensive descriptive statistics (Mean, Median, SD, Variance, Quartiles, Min, Max) for a dataset and optionally render a BoxPlot, Histogram, or DotPlot',
      inputSchema: {
        type: 'object',
        properties: {
          dataList: {
            type: 'string',
            description: 'List of numbers or list name (e.g., "{12, 15, 14, 10, 18, 22, 19, 25}" or "data1")'
          },
          visualize: {
            type: 'string',
            description: 'Optional visualization type: "none", "boxplot", "dotplot", or "histogram" (default: "none")'
          },
          outputPrefix: {
            type: 'string',
            description: 'Prefix for generated statistical variables and visualization (default: "stat")'
          }
        },
        required: ['dataList']
      }
    },
    handler: async (params: { dataList: string; visualize?: string; outputPrefix?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const prefix = params.outputPrefix || 'stat';

        // Calculate key metrics
        const metrics = [
          { key: 'mean', cmd: `${prefix}_mean = Mean(${params.dataList})` },
          { key: 'median', cmd: `${prefix}_med = Median(${params.dataList})` },
          { key: 'sd', cmd: `${prefix}_sd = SD(${params.dataList})` },
          { key: 'sampleSd', cmd: `${prefix}_sample_sd = SampleSD(${params.dataList})` },
          { key: 'variance', cmd: `${prefix}_var = Variance(${params.dataList})` },
          { key: 'q1', cmd: `${prefix}_q1 = Q1(${params.dataList})` },
          { key: 'q3', cmd: `${prefix}_q3 = Q3(${params.dataList})` },
          { key: 'min', cmd: `${prefix}_min = Min(${params.dataList})` },
          { key: 'max', cmd: `${prefix}_max = Max(${params.dataList})` }
        ];

        const results: Record<string, number | string> = {};
        for (const metric of metrics) {
          try {
            await instance.evalCommand(metric.cmd);
            const varName = (metric.cmd.split('=')[0] || '').trim();
            const val = await instance.getValue(varName);
            results[metric.key] = val;
          } catch {
            // Ignore individual metric errors if data size is small for quartiles
          }
        }

        // Optional visualization
        let vizResult: { type: string; name: string; command: string } | null = null;
        const viz = (params.visualize || 'none').toLowerCase();
        if (viz === 'boxplot') {
          const boxCmd = `${prefix}_box = BoxPlot(0, 1, ${params.dataList})`;
          await instance.evalCommand(boxCmd);
          vizResult = { type: 'boxplot', name: `${prefix}_box`, command: boxCmd };
        } else if (viz === 'dotplot') {
          const dotCmd = `${prefix}_dot = DotPlot(${params.dataList})`;
          await instance.evalCommand(dotCmd);
          vizResult = { type: 'dotplot', name: `${prefix}_dot`, command: dotCmd };
        } else if (viz === 'histogram') {
          const histCmd = `${prefix}_hist = Histogram(Classes(${params.dataList}, 5), ${params.dataList})`;
          await instance.evalCommand(histCmd);
          vizResult = { type: 'histogram', name: `${prefix}_hist`, command: histCmd };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              dataList: params.dataList,
              statistics: results,
              visualization: vizResult
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to perform statistical analysis', error);
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
      name: 'geogebra_probability_distribution',
      description: 'Plot and evaluate theoretical probability distributions (Normal, Binomial, Poisson, Exponential, Gamma, T-Distribution)',
      inputSchema: {
        type: 'object',
        properties: {
          distribution: {
            type: 'string',
            description: 'Distribution type: "normal", "binomial", "poisson", "exponential", "gamma", or "t"'
          },
          params: {
            type: 'string',
            description: 'Comma-separated parameters (e.g., "0, 1" for Normal(mean, sd); "10, 0.5" for Binomial(n, p); "4" for Poisson(lambda))'
          },
          cumulative: {
            type: 'boolean',
            description: 'Whether to compute cumulative distribution function CDF (default: false)'
          },
          name: {
            type: 'string',
            description: 'Name for the distribution curve or function (e.g., "norm1")'
          }
        },
        required: ['distribution', 'params']
      }
    },
    handler: async (params: { distribution: string; params: string; cumulative?: boolean; name?: string }) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const dist = params.distribution.toLowerCase();
        const isCum = params.cumulative ? 'true' : 'false';
        let distFunc = '';

        switch (dist) {
          case 'normal':
            distFunc = `Normal(${params.params}, x${params.cumulative ? ', true' : ''})`;
            break;
          case 'binomial':
            distFunc = `BinomialDist(${params.params}, x, ${isCum})`;
            break;
          case 'poisson':
            distFunc = `Poisson(${params.params}, x, ${isCum})`;
            break;
          case 'exponential':
            distFunc = `Exponential(${params.params}, x${params.cumulative ? ', true' : ''})`;
            break;
          case 'gamma':
            distFunc = `Gamma(${params.params}, x${params.cumulative ? ', true' : ''})`;
            break;
          case 't':
          case 'tdistribution':
            distFunc = `TDistribution(${params.params}, x${params.cumulative ? ', true' : ''})`;
            break;
          default:
            throw new Error(`Unsupported distribution: ${params.distribution}`);
        }

        const outName = params.name || `dist_${dist}`;
        const cmd = `${outName} = ${distFunc}`;
        const result = await instance.evalCommand(cmd);
        const valStr = await instance.getValueString(outName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              distribution: dist,
              name: outName,
              definition: valStr,
              command: cmd
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot probability distribution', error);
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
