/**
 * Represents an accumulation in the system
 * Examples: Population, Temperature, Money in account
 */
export class Stock {
  min?: number;
  max?: number;
  units?: string;
  name: string;
  value: number;

  constructor(
    name: string,
    value: number,
    config?: {
      min?: number;
      max?: number;
      units?: string;
    }
  ) {
    this.name = name;
    this.value = value;
    this.min = config?.min;
    this.max = config?.max;
    this.units = config?.units;
  }

  /**
   * Apply constraints after value changes
   */
  constrain(): void {
    if (this.min !== undefined && this.value < this.min) {
      this.value = this.min;
    }
    if (this.max !== undefined && this.value > this.max) {
      this.value = this.max;
    }
  }
}

/**
 * Represents a rate of change between stocks
 * Examples: Birth rate, Heat transfer, Cash flow
 */
export class Flow {
  name: string;
  from: Stock | null;  // null = infinite source
  to: Stock | null;    // null = infinite sink
  rate: number | ((model: SystemModel) => number);
  rateExpression?: string; // Store original DSL expression for dependency tracking

  constructor(
    name: string,
    from: Stock | null,
    to: Stock | null,
    rate: number | ((model: SystemModel) => number),
    rateExpression?: string
  ) {
    this.name = name;
    this.from = from;
    this.to = to;
    this.rate = rate;
    this.rateExpression = rateExpression;
  }

  /**
   * Calculate current flow rate
   */
  getRate(model: SystemModel): number {
    if (typeof this.rate === 'function') {
      return this.rate(model);
    }
    return this.rate;
  }
}

/**
 * Represents a custom graph configuration
 */
export interface GraphConfig {
  name: string;
  title?: string;
  variables: string[];
  type?: 'line' | 'area';
  yAxisLabel?: string;
  color?: string;
}

/**
 * Main system model containing stocks and flows
 */
export class SystemModel {
  stocks: Map<string, Stock> = new Map();
  flows: Map<string, Flow> = new Map();
  time: number = 0;
  stepCount: number = 0; // Global variable for step count
  history: Array<{time: number, state: Map<string, number>}> = [];
  private initialState: Map<string, number> = new Map();
  terminationCondition?: (model: SystemModel) => boolean;
  terminationExpression?: string;
  isTerminated: boolean = false;
  graphs: Map<string, GraphConfig> = new Map();

  /**
   * Add a stock to the model
   */
  addStock(name: string, initial: number, config?: any): Stock {
    const stock = new Stock(name, initial, config);
    this.stocks.set(name, stock);
    this.initialState.set(name, initial);
    return stock;
  }

  /**
   * Add a flow to the model
   */
  addFlow(
    name: string,
    from: Stock | null,
    to: Stock | null,
    rate: number | ((model: SystemModel) => number),
    rateExpression?: string
  ): Flow {
    const flow = new Flow(name, from, to, rate, rateExpression);
    this.flows.set(name, flow);
    return flow;
  }

  /**
   * Set termination condition for the simulation
   */
  setTerminationCondition(condition: (model: SystemModel) => boolean, expression?: string): void {
    this.terminationCondition = condition;
    this.terminationExpression = expression;
  }

  /**
   * Add a graph configuration to the model
   */
  addGraph(config: GraphConfig): void {
    this.graphs.set(config.name, config);
  }

  /**
   * Get global variable values
   */
  getGlobalVariables(): Map<string, number> {
    return new Map([
      ['step', this.stepCount],
      ['time', this.time],
    ]);
  }

  /**
   * Replace global variables in expression string with their values
   */
  replaceGlobalVariables(expression: string): string {
    let result = expression;
    const globals = this.getGlobalVariables();

    globals.forEach((value, name) => {
      // Replace $variableName with the actual value
      result = result.replace(new RegExp('\\$' + name + '\\b', 'g'), value.toString());
    });

    return result;
  }

  /**
   * Execute one simulation step
   */
  step(dt: number = 1): void {
    // Check if already terminated
    if (this.isTerminated) return;

    // Calculate all flow amounts
    const flowAmounts = new Map<Flow, number>();
    this.flows.forEach(flow => {
      const rate = flow.getRate(this);
      flowAmounts.set(flow, rate * dt);
    });

    // Apply flows to stocks
    flowAmounts.forEach((amount, flow) => {
      if (flow.from) flow.from.value -= amount;
      if (flow.to) flow.to.value += amount;
    });

    // Apply constraints
    this.stocks.forEach(stock => stock.constrain());

    // Update time, step count and record history
    this.time += dt;
    this.stepCount += 1;
    this.recordState();

    // Check termination condition
    if (this.terminationCondition && this.terminationCondition(this)) {
      this.isTerminated = true;
    }
  }

  /**
   * Record current state for history
   */
  recordState(): void {
    const state = new Map<string, number>();
    this.stocks.forEach((stock, name) => {
      state.set(name, stock.value);
    });
    this.history.push({ time: this.time, state });

    // Keep only last 1000 points
    if (this.history.length > 1000) {
      this.history.shift();
    }
  }

  /**
   * Run simulation for multiple steps
   */
  run(steps: number, dt: number = 1): void {
    for (let i = 0; i < steps; i++) {
      this.step(dt);
    }
  }

  /**
   * Reset model to initial state
   */
  reset(): void {
    this.time = 0;
    this.stepCount = 0;
    this.history = [];
    this.isTerminated = false;

    // Reset stocks to initial values
    this.initialState.forEach((initialValue, stockName) => {
      const stock = this.stocks.get(stockName);
      if (stock) {
        stock.value = initialValue;
      }
    });

    // Record initial state
    this.recordState();
  }
}