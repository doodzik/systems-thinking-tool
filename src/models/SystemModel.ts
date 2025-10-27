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
  units?: string;

  constructor(
    name: string,
    from: Stock | null,
    to: Stock | null,
    rate: number | ((model: SystemModel) => number),
    rateExpression?: string,
    units?: string
  ) {
    this.name = name;
    this.from = from;
    this.to = to;
    this.rate = rate;
    this.rateExpression = rateExpression;
    this.units = units;
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
 * Delay buffer for tracking historical values
 */
interface DelayBuffer {
  values: Array<{ time: number; value: number }>;
  delayTime: number;
  type: 'smooth' | 'delay' | 'delay_gradual';
  smoothedValue?: number; // For SMOOTH function
}

/**
 * 1D Lookup table for nonlinear relationships
 */
export interface LookupTable {
  name: string;
  points: Array<{ x: number; y: number }>;
}

/**
 * 2D Lookup table for multi-factor relationships
 */
export interface LookupTable2D {
  name: string;
  points: Array<{ x: number; y: number; z: number }>;
}

/**
 * Main system model containing stocks and flows
 */
export class SystemModel {
  stocks: Map<string, Stock> = new Map();
  flows: Map<string, Flow> = new Map();
  constants: Map<string, number> = new Map(); // User-defined constants
  time: number = 0;
  stepCount: number = 0; // Global variable for step count
  dt: number = 1; // Simulation time step
  history: Array<{time: number, state: Map<string, number>}> = [];
  private initialState: Map<string, number> = new Map();
  terminationCondition?: (model: SystemModel) => boolean;
  terminationExpression?: string;
  isTerminated: boolean = false;
  graphs: Map<string, GraphConfig> = new Map();
  
  // Delay tracking - key is unique identifier for each delay function instance
  private delayBuffers: Map<string, DelayBuffer> = new Map();
  private nextDelayId: number = 0;

  // Lookup tables for nonlinear relationships
  lookupTables: Map<string, LookupTable> = new Map();
  lookupTables2D: Map<string, LookupTable2D> = new Map();

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
    rateExpression?: string,
    units?: string
  ): Flow {
    const flow = new Flow(name, from, to, rate, rateExpression, units);
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
   * Add a constant to the model
   */
  addConstant(name: string, value: number): void {
    this.constants.set(name, value);
  }

  /**
   * Add a 1D lookup table to the model
   */
  addLookupTable(name: string, points: Array<{ x: number; y: number }>): void {
    // Sort points by x value for efficient interpolation
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    this.lookupTables.set(name, { name, points: sortedPoints });
  }

  /**
   * Add a 2D lookup table to the model
   */
  addLookupTable2D(name: string, points: Array<{ x: number; y: number; z: number }>): void {
    this.lookupTables2D.set(name, { name, points });
  }

  /**
   * Get global variable values including built-in constants
   */
  getGlobalVariables(): Map<string, number> {
    return new Map([
      ['TIME', this.time],
      ['dt', this.dt],
      ['PI', Math.PI],
      ['E', Math.E],
      // Legacy support
      ['step', this.stepCount],
      ['time', this.time],
    ]);
  }

  /**
   * Get all constants (user-defined + built-in)
   */
  getAllConstants(): Map<string, number> {
    const allConstants = new Map<string, number>();
    
    // Add built-in constants
    allConstants.set('PI', Math.PI);
    allConstants.set('E', Math.E);
    allConstants.set('TIME', this.time);
    allConstants.set('dt', this.dt);
    
    // Add user-defined constants
    this.constants.forEach((value, name) => {
      allConstants.set(name, value);
    });
    
    return allConstants;
  }

  /**
   * Replace global variables and constants in expression string with their values
   */
  replaceGlobalVariables(expression: string): string {
    let result = expression;
    
    // Replace $variableName syntax (legacy support for $step, $time)
    const globals = this.getGlobalVariables();
    globals.forEach((value, name) => {
      result = result.replace(new RegExp('\\$' + name + '\\b', 'g'), value.toString());
    });

    // Replace constants and built-in variables (without $ prefix)
    const allConstants = this.getAllConstants();
    allConstants.forEach((value, name) => {
      // Use word boundary to avoid partial matches
      result = result.replace(new RegExp('\\b' + name + '\\b', 'g'), value.toString());
    });

    // Replace user-defined constants
    this.constants.forEach((value, name) => {
      result = result.replace(new RegExp('\\b' + name + '\\b', 'g'), value.toString());
    });

    // Make Math functions available in expression context
    // This is handled in the Function() eval with Math object

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
   * SMOOTH function - Exponential smoothing/averaging
   * Creates a moving average that gradually adapts to new values
   */
  SMOOTH(input: number, smoothingTime: number, bufferId: string): number {
    // Get or create buffer
    let buffer = this.delayBuffers.get(bufferId);
    if (!buffer) {
      buffer = {
        values: [],
        delayTime: smoothingTime,
        type: 'smooth',
        smoothedValue: input, // Initialize with current input
      };
      this.delayBuffers.set(bufferId, buffer);
    }

    // Update smoothed value using exponential smoothing
    // smoothedValue = smoothedValue + (input - smoothedValue) / smoothingTime * dt
    const alpha = this.dt / smoothingTime;
    const newSmoothedValue = buffer.smoothedValue! + (input - buffer.smoothedValue!) * alpha;
    buffer.smoothedValue = newSmoothedValue;

    // Record current value for history
    buffer.values.push({ time: this.time, value: input });
    
    // Keep reasonable history length
    const maxHistoryTime = smoothingTime * 5;
    while (buffer.values.length > 0 && this.time - buffer.values[0].time > maxHistoryTime) {
      buffer.values.shift();
    }

    return newSmoothedValue;
  }

  /**
   * DELAY function - Physical pipeline delay
   * What goes in now comes out exactly N time periods later
   */
  DELAY(input: number, delayTime: number, bufferId: string): number {
    // Get or create buffer
    let buffer = this.delayBuffers.get(bufferId);
    if (!buffer) {
      buffer = {
        values: [],
        delayTime: delayTime,
        type: 'delay',
      };
      this.delayBuffers.set(bufferId, buffer);
    }

    // Add current input to buffer
    buffer.values.push({ time: this.time, value: input });

    // Find value that was added exactly delayTime ago
    const targetTime = this.time - delayTime;
    
    // If we don't have enough history, return initial value
    if (buffer.values.length < 2 || buffer.values[0].time > targetTime) {
      return input; // Return current input as initial value
    }

    // Find the value at targetTime using linear interpolation
    for (let i = 1; i < buffer.values.length; i++) {
      const curr = buffer.values[i];
      const prev = buffer.values[i - 1];
      
      if (curr.time >= targetTime) {
        // Interpolate between prev and curr
        if (curr.time === prev.time) {
          return prev.value;
        }
        const ratio = (targetTime - prev.time) / (curr.time - prev.time);
        return prev.value + ratio * (curr.value - prev.value);
      }
    }

    // If targetTime is beyond our buffer, return the last value
    return buffer.values[buffer.values.length - 1].value;
  }

  /**
   * DELAY_GRADUAL function - Smooth material delay
   * Models processes with natural variation in timing (third-order delay)
   */
  DELAY_GRADUAL(input: number, delayTime: number, bufferId: string): number {
    // Get or create buffer
    let buffer = this.delayBuffers.get(bufferId);
    if (!buffer) {
      buffer = {
        values: [],
        delayTime: delayTime,
        type: 'delay_gradual',
      };
      this.delayBuffers.set(bufferId, buffer);
    }

    // Add current input to buffer
    buffer.values.push({ time: this.time, value: input });

    // DELAY_GRADUAL uses a third-order delay which creates a bell curve response
    // Peak output occurs around 1.5 × delay time
    // We'll implement this as a weighted average of recent history
    
    const targetTime = this.time - delayTime;
    
    // If we don't have enough history, return initial value
    if (buffer.values.length < 2 || buffer.values[0].time > targetTime - delayTime) {
      return input;
    }

    // Calculate weighted average using a bell curve (Gaussian-like) weighting
    // Weight function: exp(-((t - targetTime) / (delayTime/3))^2)
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const point of buffer.values) {
      const timeDiff = point.time - targetTime;
      const normalizedDiff = timeDiff / (delayTime / 3);
      const weight = Math.exp(-(normalizedDiff * normalizedDiff));
      
      weightedSum += point.value * weight;
      totalWeight += weight;
    }

    const result = totalWeight > 0 ? weightedSum / totalWeight : input;

    // Clean up old values
    const maxHistoryTime = delayTime * 4;
    while (buffer.values.length > 0 && this.time - buffer.values[0].time > maxHistoryTime) {
      buffer.values.shift();
    }

    return result;
  }

  /**
   * LOOKUP function - 1D linear interpolation
   * For arbitrary nonlinear relationships based on empirical data
   */
  LOOKUP(input: number, tableName: string | Array<[number, number]>): number {
    let table: LookupTable;
    
    // Handle inline tables
    if (Array.isArray(tableName)) {
      table = {
        name: 'inline',
        points: tableName.map(([x, y]) => ({ x, y })).sort((a, b) => a.x - b.x),
      };
    } else {
      // Named table
      const namedTable = this.lookupTables.get(tableName);
      if (!namedTable) {
        console.error(`Lookup table "${tableName}" not found`);
        return 0;
      }
      table = namedTable;
    }
    
    const points = table.points;
    
    // Handle edge cases
    if (points.length === 0) return 0;
    if (points.length === 1) return points[0].y;
    
    // Extrapolation: use first/last value if outside range
    if (input <= points[0].x) return points[0].y;
    if (input >= points[points.length - 1].x) return points[points.length - 1].y;
    
    // Linear interpolation
    for (let i = 1; i < points.length; i++) {
      if (input <= points[i].x) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const ratio = (input - p0.x) / (p1.x - p0.x);
        return p0.y + ratio * (p1.y - p0.y);
      }
    }
    
    return points[points.length - 1].y;
  }
  
  /**
   * LOOKUP2D function - 2D bilinear interpolation
   * For relationships with two inputs
   */
  LOOKUP2D(inputX: number, inputY: number, tableName: string): number {
    const table = this.lookupTables2D.get(tableName);
    if (!table) {
      console.error(`2D Lookup table "${tableName}" not found`);
      return 0;
    }
    
    const points = table.points;
    if (points.length === 0) return 0;
    
    // Find unique X and Y values
    const xValues = [...new Set(points.map(p => p.x))].sort((a, b) => a - b);
    const yValues = [...new Set(points.map(p => p.y))].sort((a, b) => a - b);
    
    // Clamp input to table bounds
    const clampedX = Math.max(xValues[0], Math.min(xValues[xValues.length - 1], inputX));
    const clampedY = Math.max(yValues[0], Math.min(yValues[yValues.length - 1], inputY));
    
    // Find surrounding X values
    let x0Index = 0;
    let x1Index = 0;
    for (let i = 0; i < xValues.length - 1; i++) {
      if (clampedX >= xValues[i] && clampedX <= xValues[i + 1]) {
        x0Index = i;
        x1Index = i + 1;
        break;
      }
    }
    if (clampedX === xValues[xValues.length - 1]) {
      x0Index = xValues.length - 1;
      x1Index = xValues.length - 1;
    }
    
    // Find surrounding Y values
    let y0Index = 0;
    let y1Index = 0;
    for (let i = 0; i < yValues.length - 1; i++) {
      if (clampedY >= yValues[i] && clampedY <= yValues[i + 1]) {
        y0Index = i;
        y1Index = i + 1;
        break;
      }
    }
    if (clampedY === yValues[yValues.length - 1]) {
      y0Index = yValues.length - 1;
      y1Index = yValues.length - 1;
    }
    
    // Get Z values at corners
    const getZ = (xIdx: number, yIdx: number): number => {
      const x = xValues[xIdx];
      const y = yValues[yIdx];
      const point = points.find(p => p.x === x && p.y === y);
      return point ? point.z : 0;
    };
    
    const z00 = getZ(x0Index, y0Index);
    const z10 = getZ(x1Index, y0Index);
    const z01 = getZ(x0Index, y1Index);
    const z11 = getZ(x1Index, y1Index);
    
    // Bilinear interpolation
    const x0 = xValues[x0Index];
    const x1 = xValues[x1Index];
    const y0 = yValues[y0Index];
    const y1 = yValues[y1Index];
    
    if (x0 === x1 && y0 === y1) return z00;
    if (x0 === x1) {
      const ty = (clampedY - y0) / (y1 - y0);
      return z00 + ty * (z01 - z00);
    }
    if (y0 === y1) {
      const tx = (clampedX - x0) / (x1 - x0);
      return z00 + tx * (z10 - z00);
    }
    
    const tx = (clampedX - x0) / (x1 - x0);
    const ty = (clampedY - y0) / (y1 - y0);
    
    const z0 = z00 + tx * (z10 - z00);
    const z1 = z01 + tx * (z11 - z01);
    
    return z0 + ty * (z1 - z0);
  }

  /**
   * Generate unique ID for delay buffer
   */
  generateDelayId(): string {
    return `delay_${this.nextDelayId++}`;
  }

  /**
   * Reset model to initial state
   */
  reset(): void {
    this.time = 0;
    this.stepCount = 0;
    this.history = [];
    this.isTerminated = false;
    this.delayBuffers.clear(); // Clear delay buffers
    this.nextDelayId = 0;

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
