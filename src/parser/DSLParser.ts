import { SystemModel, Stock } from '../models/SystemModel';

interface GraphConfig {
  name: string;
  title?: string;
  variables: string[];
  type?: 'line' | 'area';
  yAxisLabel?: string;
  color?: string;
}

export function parseDSL(code: string): SystemModel {
  const model = new SystemModel();
  const lines = code.split('\n');

  let currentBlock: 'stock' | 'flow' | 'terminate' | 'graph' | 'lookup' | 'lookup2d' | null = null;
  let currentName = '';
  let currentConfig: any = {};
  let terminateConfig: any = {};
  let graphConfig: any = {};
  let lookupPoints: Array<{ x: number; y: number }> = [];
  let lookup2dPoints: Array<{ x: number; y: number; z: number }> = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed === '') continue;

    // Constant definition
    if (trimmed.startsWith('const ')) {
      const match = trimmed.match(/const\s+(\w+)\s*=\s*(.+)/);
      if (match) {
        const constName = match[1];
        const constValue = match[2].trim();
        
        // Parse the value (should be a number or expression)
        let parsedValue: number;
        if (!isNaN(Number(constValue))) {
          parsedValue = Number(constValue);
        } else {
          // Try to evaluate as expression (may contain other constants or Math functions)
          try {
            // Create evaluation context with Math functions
            const evalContext = {
              PI: Math.PI,
              E: Math.E,
              sin: Math.sin,
              cos: Math.cos,
              tan: Math.tan,
              sqrt: Math.sqrt,
              abs: Math.abs,
              floor: Math.floor,
              ceil: Math.ceil,
              round: Math.round,
              min: Math.min,
              max: Math.max,
              pow: Math.pow,
              exp: Math.exp,
              log: Math.log,
            };
            
            // Replace any already-defined constants in the expression
            let expr = constValue;
            model.constants.forEach((value, name) => {
              expr = expr.replace(new RegExp('\\b' + name + '\\b', 'g'), value.toString());
            });
            
            // Evaluate with Math functions available
            parsedValue = new Function(...Object.keys(evalContext), `"use strict"; return (${expr})`)(...Object.values(evalContext));
          } catch (error) {
            console.warn(`Failed to parse constant ${constName}: ${constValue}`, error);
            parsedValue = 0;
          }
        }
        
        model.addConstant(constName, parsedValue);
      }
      continue;
    }

    // Stock definition
    if (trimmed.startsWith('stock ')) {
      const match = trimmed.match(/stock\s+(\w+)\s*{/);
      if (match) {
        currentBlock = 'stock';
        currentName = match[1];
        currentConfig = {};
      }
    }

    // Flow definition
    else if (trimmed.startsWith('flow ')) {
      const match = trimmed.match(/flow\s+(\w+)\s*{/);
      if (match) {
        currentBlock = 'flow';
        currentName = match[1];
        currentConfig = {};
      }
    }

    // Terminate definition
    else if (trimmed.startsWith('terminate {')) {
      currentBlock = 'terminate';
      terminateConfig = {};
    }

    // Graph definition
    else if (trimmed.startsWith('graph ')) {
      const match = trimmed.match(/graph\s+(\w+)\s*{/);
      if (match) {
        currentBlock = 'graph';
        currentName = match[1];
        graphConfig = {};
      }
    }

    // Lookup table definition (1D)
    else if (trimmed.startsWith('lookup ')) {
      const match = trimmed.match(/lookup\s+(\w+)\s*{/);
      if (match) {
        currentBlock = 'lookup';
        currentName = match[1];
        lookupPoints = [];
      }
    }

    // Lookup table definition (2D)
    else if (trimmed.startsWith('lookup2d ')) {
      const match = trimmed.match(/lookup2d\s+(\w+)\s*{/);
      if (match) {
        currentBlock = 'lookup2d';
        currentName = match[1];
        lookup2dPoints = [];
      }
    }

    // Lookup table point (1D format: [x, y])
    else if (currentBlock === 'lookup' && trimmed.startsWith('[')) {
      const match = trimmed.match(/\[([^,]+),\s*([^\]]+)\]/);
      if (match) {
        const x = parseFloat(match[1].trim());
        const y = parseFloat(match[2].trim());
        if (!isNaN(x) && !isNaN(y)) {
          lookupPoints.push({ x, y });
        }
      }
    }

    // Lookup table point (2D format: [x, y]: z)
    else if (currentBlock === 'lookup2d' && trimmed.startsWith('[')) {
      const match = trimmed.match(/\[([^,]+),\s*([^\]]+)\]:\s*(.+)/);
      if (match) {
        const x = parseFloat(match[1].trim());
        const y = parseFloat(match[2].trim());
        const z = parseFloat(match[3].trim());
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          lookup2dPoints.push({ x, y, z });
        }
      }
    }

    // Property assignment
    else if (trimmed.includes(':') && currentBlock) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Parse value
      let parsedValue: any;
      if (value.startsWith('"') && value.endsWith('"')) {
        // String value
        parsedValue = value.slice(1, -1);
      } else if (!isNaN(Number(value))) {
        // Number value
        parsedValue = Number(value);
      } else {
        // Expression or reference
        parsedValue = value;
      }

      // Assign to correct config
      if (currentBlock === 'terminate') {
        terminateConfig[key] = parsedValue;
      } else if (currentBlock === 'graph') {
        graphConfig[key] = parsedValue;
      } else {
        currentConfig[key] = parsedValue;
      }
    }

    // End of block
    else if (trimmed === '}') {
      if (currentBlock === 'stock' && currentName) {
        model.addStock(currentName, currentConfig.initial || 0, {
          units: currentConfig.units,
          min: currentConfig.min,
          max: currentConfig.max,
        });
      } else if (currentBlock === 'flow' && currentName) {
        // Parse from and to
        let from: Stock | null = null;
        let to: Stock | null = null;

        if (currentConfig.from && currentConfig.from !== 'source') {
          from = model.stocks.get(currentConfig.from) || null;
        }
        if (currentConfig.to && currentConfig.to !== 'sink') {
          to = model.stocks.get(currentConfig.to) || null;
        }

        // Parse rate (can be expression)
        let rate: number | ((m: SystemModel) => number) = 0;
        let rateExpression: string | undefined;

        if (typeof currentConfig.rate === 'number') {
          rate = currentConfig.rate;
        } else if (typeof currentConfig.rate === 'string') {
          // Parse expression
          const rateExpr = currentConfig.rate;
          rateExpression = rateExpr; // Store original expression
          // Generate unique delay IDs for any delay functions in the expression
          const delayIdMap = new Map<string, string>();
          let delayIdCounter = 0;
          let processedExpr = rateExpr;
          
          // Find all SMOOTH, DELAY, and DELAY_GRADUAL calls and assign unique IDs
          const delayFunctions = ['SMOOTH', 'DELAY', 'DELAY_GRADUAL'];
          for (const funcName of delayFunctions) {
            const regex = new RegExp(`${funcName}\\s*\\(`, 'g');
            let match;
            while ((match = regex.exec(rateExpr)) !== null) {
              const callKey = `${funcName}_${currentName}_${delayIdCounter++}`;
              delayIdMap.set(callKey, model.generateDelayId());
            }
          }
          
          rate = (m: SystemModel) => {
            // Simple expression parser
            let expr = rateExpr;
            
            // Replace global variables ($var)
            expr = m.replaceGlobalVariables(expr);
            
            // Replace stock names
            m.stocks.forEach((stock, name) => {
              expr = expr.replace(new RegExp('\\b' + name + '\\b', 'g'), stock.value.toString());
            });
            
            // IMPORTANT: Replace LOOKUP functions BEFORE delay functions
            // This ensures LOOKUP calls nested inside delay functions are properly converted
            // Pattern: LOOKUP(input, TableName) -> m.LOOKUP(input, "TableName")
            expr = expr.replace(/LOOKUP\s*\(([^,]+),\s*([a-zA-Z_]\w*)\s*\)/g, 'm.LOOKUP($1, "$2")');
            
            // Replace LOOKUP2D function calls and quote table names
            // Pattern: LOOKUP2D(inputX, inputY, TableName) -> m.LOOKUP2D(inputX, inputY, "TableName")
            expr = expr.replace(/LOOKUP2D\s*\(([^,]+),\s*([^,]+),\s*([a-zA-Z_]\w*)\s*\)/g, 'm.LOOKUP2D($1, $2, "$3")');
            
            // Replace delay function calls with method calls that include buffer IDs
            let delayCounter = 0;
            for (const funcName of delayFunctions) {
              expr = expr.replace(new RegExp(`${funcName}\\s*\\(`, 'g'), () => {
                const callKey = `${funcName}_${currentName}_${delayCounter++}`;
                const bufferId = delayIdMap.get(callKey) || m.generateDelayId();
                return `m.${funcName}(`;
              });
            }
            
            // Inject buffer IDs into delay function calls
            // We need to add the bufferId as the third parameter
            delayCounter = 0;
            for (const funcName of delayFunctions) {
              const pattern = new RegExp(`m\\.${funcName}\\(([^,]+),\\s*([^)]+)\\)`, 'g');
              expr = expr.replace(pattern, (_match: string, input: string, delayTime: string) => {
                const callKey = `${funcName}_${currentName}_${delayCounter++}`;
                const bufferId = delayIdMap.get(callKey) || m.generateDelayId();
                return `m.${funcName}(${input}, ${delayTime}, "${bufferId}")`;
              });
            }
            
            try {
              // Safe evaluation using Function constructor with Math functions
              const evalContext = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                sqrt: Math.sqrt,
                abs: Math.abs,
                floor: Math.floor,
                ceil: Math.ceil,
                round: Math.round,
                min: Math.min,
                max: Math.max,
                pow: Math.pow,
                exp: Math.exp,
                log: Math.log,
                m: m, // Make model available for delay function calls
              };
              return new Function(...Object.keys(evalContext), '"use strict"; return (' + expr + ')')(...Object.values(evalContext));
            } catch (error) {
              console.error('Expression evaluation error:', error, 'Expression:', expr);
              return 0;
            }
          };
        }

        model.addFlow(currentName, from, to, rate, rateExpression, currentConfig.units);
      } else if (currentBlock === 'terminate') {
        // Parse termination condition
        if (terminateConfig.when) {
          const conditionExpr = terminateConfig.when;
          const terminationCondition = (m: SystemModel) => {
            // Simple expression parser
            let expr = conditionExpr;
            // Replace global variables ($var)
            expr = m.replaceGlobalVariables(expr);
            // Replace stock names
            m.stocks.forEach((stock, name) => {
              expr = expr.replace(new RegExp('\\b' + name + '\\b', 'g'), stock.value.toString());
            });
            try {
              // Safe evaluation using Function constructor with Math functions
              const evalContext = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                sqrt: Math.sqrt,
                abs: Math.abs,
                floor: Math.floor,
                ceil: Math.ceil,
                round: Math.round,
                min: Math.min,
                max: Math.max,
                pow: Math.pow,
                exp: Math.exp,
                log: Math.log,
              };
              return new Function(...Object.keys(evalContext), '"use strict"; return (' + expr + ')')(...Object.values(evalContext));
            } catch {
              return false;
            }
          };
          model.setTerminationCondition(terminationCondition, conditionExpr);
        }
      } else if (currentBlock === 'graph') {
        // Parse graph configuration
        const graphConfigObj: GraphConfig = {
          name: currentName,
          title: graphConfig.title || currentName,
          variables: [],
          type: graphConfig.type || 'line',
          yAxisLabel: graphConfig.yAxisLabel,
          color: graphConfig.color,
        };

        // Parse variables (comma-separated list)
        if (graphConfig.variables) {
          if (typeof graphConfig.variables === 'string') {
            graphConfigObj.variables = graphConfig.variables
              .split(',')
              .map((v: string) => v.trim())
              .filter((v: string) => v.length > 0);
          }
        }

        model.addGraph(graphConfigObj);
      } else if (currentBlock === 'lookup' && currentName) {
        // Add 1D lookup table
        model.addLookupTable(currentName, lookupPoints);
        lookupPoints = [];
      } else if (currentBlock === 'lookup2d' && currentName) {
        // Add 2D lookup table
        model.addLookupTable2D(currentName, lookup2dPoints);
        lookup2dPoints = [];
      }

      currentBlock = null;
      currentName = '';
      currentConfig = {};
    }
  }

  // Record initial state
  model.recordState();
  return model;
}
