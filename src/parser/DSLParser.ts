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

  let currentBlock: 'stock' | 'flow' | 'terminate' | 'graph' | null = null;
  let currentName = '';
  let currentConfig: any = {};
  let terminateConfig: any = {};
  let graphConfig: any = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed === '') continue;

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
          rate = (m: SystemModel) => {
            // Simple expression parser
            let expr = rateExpr;
            // Replace global variables ($var)
            expr = m.replaceGlobalVariables(expr);
            // Replace stock names
            m.stocks.forEach((stock, name) => {
              expr = expr.replace(new RegExp('\\b' + name + '\\b', 'g'), stock.value.toString());
            });
            try {
              // Safe evaluation using Function constructor
              return Function('"use strict"; return (' + expr + ')')();
            } catch {
              return 0;
            }
          };
        }

        model.addFlow(currentName, from, to, rate, rateExpression);
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
              // Safe evaluation using Function constructor
              return Function('"use strict"; return (' + expr + ')')();
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