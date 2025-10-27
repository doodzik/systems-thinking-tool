# DSL Reference Guide

Quick reference for the Systems Thinking Tool Domain-Specific Language.

---

## Syntax Overview

```
// Comments
const Name = value

lookup TableName {
  [x, y]
}

lookup2d TableName {
  [x, y]: z
}

stock StockName {
  initial: number
  units: "string"
  min: number
  max: number
}

flow FlowName {
  from: source | sink | StockName
  to: source | sink | StockName
  rate: expression
  units: "string"
}

graph GraphName {
  title: "string"
  variables: Var1, Var2
  type: line | area
  yAxisLabel: "string"
  color: "#hex"
}

terminate {
  when: boolean_expression
}
```

---

## Constants

**Syntax:**
```
const Name = value
```

**Examples:**
```
const GrowthRate = 0.05
const MaxCapacity = 1000
const PI_TIMES_2 = PI * 2
```

**Notes:**
- Can reference other constants
- Can use Math functions
- Available in all rate expressions

---

## Stocks

**Syntax:**
```
stock StockName {
  initial: number          // Required
  units: "string"          // Optional
  min: number             // Optional - auto-enforced
  max: number             // Optional - auto-enforced
}
```

**Examples:**
```
stock Population {
  initial: 100
  min: 0
  units: "people"
}

stock Temperature {
  initial: 68
  min: 0
  max: 100
  units: "°F"
}
```

**Notes:**
- `min` and `max` are enforced after each step
- Values clamped to constraints if exceeded
- Reference stocks by name in expressions

---

## Flows

**Syntax:**
```
flow FlowName {
  from: source | sink | StockName    // Required
  to: source | sink | StockName      // Required
  rate: expression                    // Required
  units: "string"                     // Optional
}
```

**Source/Sink Keywords:**
- `source` - Infinite external source (cloud icon)
- `sink` - Infinite external sink (cloud icon)
- Stock name - Flow between stocks
- Omit property - Treated as null

**Examples:**
```
// From infinite source
flow Births {
  from: source
  to: Population
  rate: Population * 0.02
}

// Between stocks
flow Transfer {
  from: StockA
  to: StockB
  rate: StockA * 0.1
}

// To infinite sink
flow Deaths {
  from: Population
  to: sink
  rate: Population * 0.01
}
```

---

## Rate Expressions

### Operators

| Type | Operators |
|------|-----------|
| Arithmetic | `+` `-` `*` `/` `%` |
| Comparison | `<` `>` `<=` `>=` `==` `!=` |
| Logical | `&&` `||` `!` |
| Ternary | `condition ? true_value : false_value` |

### Stock References

Direct reference by name:
```
rate: Population * 0.5
rate: Resources / Population
rate: (StockA + StockB) / 2
```

### Built-in Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TIME` | Current time | Simulation time (starts at 0) |
| `dt` | Time step | Default: 1 |
| `PI` | 3.14159... | Mathematical π |
| `E` | 2.71828... | Euler's number |

### Math Functions

**Basic:**
```javascript
min(a, b, ...)       // Minimum value
max(a, b, ...)       // Maximum value
abs(x)               // Absolute value
```

**Rounding:**
```javascript
floor(x)             // Round down
ceil(x)              // Round up
round(x)             // Round to nearest
```

**Exponential:**
```javascript
sqrt(x)              // Square root
pow(base, exp)       // Exponentiation
exp(x)               // e^x
log(x)               // Natural logarithm
```

**Visual comparison of nonlinear functions:**

```
sqrt(x) - Diminishing Returns    pow(x, 2) - Accelerating
Effect                           Effect
  ^     ╱─────────                 ^              ╱
  |    ╱                           |            ╱
  |   ╱                            |          ╱
  |  ╱                             |        ╱
  | ╱                              |     ╱
  |╱                               |  ╱
  └────────> Input                 |╱
   (advertising, team size)        └────────> Input
                                    (network effects)

exp(x) - Explosive                log(x) - Saturating
Effect                            Effect
  ^                   ╱            ^  ╱─────────────
  |                 ╱              | ╱
  |               ╱                |╱
  |             ╱                  |
  |          ╱                     |
  |      ╱                         |
  |  ╱                             |
  |╱                               └────────> Input
  └────────> Input                  (perceived wealth)
   (panic, viral spread)
```

**Trigonometric:**
```javascript
sin(x)               // Sine
cos(x)               // Cosine
tan(x)               // Tangent
```

**Visual - Using with TIME for oscillation:**
```
sin(TIME)
Value
  ^    ╱╲      ╱╲      ╱╲
  |   ╱  ╲    ╱  ╲    ╱  ╲
  |  ╱    ╲  ╱    ╲  ╱    ╲
  | ╱      ╲╱      ╲╱      ╲
  |╱
  └────────────────────────> TIME
   natural oscillation
```

---

## Delay Functions

### SMOOTH

**Exponential smoothing / moving average**

**Syntax:**
```
SMOOTH(input, smoothing_time)
```

**Visual Response (input jumps from 0 to 10):**
```
Output
10|                 ╱────
  |               ╱
  |             ╱
  |          ╱
 0|────────╱
  └────────────────────> Time
  quick start, then gradual
```

**Behavior:**
- Responds immediately but gradually
- 63% adapted after 1 time period
- 95% adapted after 3 time periods
- Asymptotic approach, never quite reaches input

**Use cases:**
- Perception lags (people slowly notice changes)
- Market awareness (brand builds slowly)
- Reputation/brand value (slow to build, slow to fade)
- Noise filtering (smooth out fluctuations)

**Example:**
```
rate: SMOOTH(ActualQuality, 6)
```

---

### DELAY

**Physical pipeline delay (exact timing)**

**Syntax:**
```
DELAY(input, delay_time)
```

**Visual Response (input spike at time 5):**
```
Output
10|          ┌───┐
  |          │   │
  |          │   │
 0|──────────┘   └──────> Time
         t=5    t=5+delay
           ↑           ↑
        input      output
     (exact timing preserved)
```

**Behavior:**
- No output change until delay passes
- Sharp transition at delay time
- Exactly preserves input shape and timing
- Higher memory usage

**Use cases:**
- Manufacturing pipelines (parts through assembly)
- Shipping in transit (orders to delivery)
- Construction projects (staged completion)
- Fixed processing times (permits, approvals)

**Example:**
```
rate: DELAY(OrderRate, 14)
```

---

### DELAY_GRADUAL

**Smooth material delay (third-order)**

**Syntax:**
```
DELAY_GRADUAL(input, delay_time)
```

**Visual Response (input spike):**
```
Output
10|            ╱──╲
  |          ╱      ╲
  |        ╱          ╲
  |      ╱              ╲
 0|────╱                  ╲──> Time
     smooth bell curve
   (peak at ~1.5× delay)
```

**Behavior:**
- Smooth bell-curve response
- Peak output around 1.5× delay time
- Models natural timing variation
- More realistic than sharp pipeline delay

**Use cases:**
- Training programs (people ready at different times)
- Multi-stage production (variable throughput)
- Biological processes (growth, maturation)
- Information diffusion (spreads gradually)

**Example:**
```
rate: DELAY_GRADUAL(StressEffect, 5)
```

---

### Delay Comparison

**All three delays with same input (step from 0 to 10 at time 0):**

```
         SMOOTH               DELAY_GRADUAL            DELAY
Output   (perception)         (training)               (shipping)

10|     ╱────              10|    ╱──╲             10|    ┌────
  |   ╱                      |  ╱      ╲             |    │
  | ╱                        |╱          ╲           |    │
0 |╱___                    0 |____        ╲__      0 |────┘
  └────> Time                └────> Time              └────> Time
  fast start                 realistic bell           exact timing
  gradual finish             natural variation        sharp edge
```

**Which to use?**
- **Averaging/filtering?** → SMOOTH
- **Physical transit?** → DELAY
- **Multi-stage process?** → DELAY_GRADUAL
- **Not sure?** → DELAY_GRADUAL (most realistic)

---

## Lookup Tables

### 1D Lookup Tables

**Syntax:**
```
lookup TableName {
  [x1, y1]
  [x2, y2]
  [x3, y3]
}
```

**Usage:**
```
LOOKUP(input, TableName)
```

**Behavior:**
- Linear interpolation between points
- Points auto-sorted by x value
- Extrapolates with first/last value

**Visual representation:**
```
Output (y)
  ^
  |      ●────●
  |     ╱      ╲
  |   ╱          ●
  | ╱
  |╱
  └────────────────> Input (x)
     linear interpolation
```

**Example:**
```
lookup CrowdingEffect {
  [0, 1.0]
  [50, 0.95]
  [90, 0.60]
  [110, 0.20]
}

rate: BaseRate * LOOKUP(Occupancy, CrowdingEffect)
```

**Visualized:**
```
Productivity
  ^
1.0|●────╲
   |      ╲
0.8|       ╲
   |        ╲
0.6|         ●─╲
   |            ╲
0.2|             ●
   └────────────────> Occupancy %
    0   50   90  110
```

---

### 2D Lookup Tables

**Syntax:**
```
lookup2d TableName {
  [x1, y1]: z1
  [x2, y2]: z2
  [x3, y3]: z3
}
```

**Usage:**
```
LOOKUP2D(inputX, inputY, TableName)
```

**Behavior:**
- Bilinear interpolation
- Requires regular grid of points

**Example:**
```
lookup2d ReactionYield {
  [20, 1]: 10
  [20, 5]: 25
  [80, 1]: 45
  [80, 5]: 75
}

rate: LOOKUP2D(Temperature, Pressure, ReactionYield)
```

---

## Time-Based Patterns

Use `LOOKUP(TIME, pattern)` for any time-based pattern.

**Step change:**
```
lookup Policy {
  [0, 100]
  [12, 150]
  [24, 150]
}
rate: LOOKUP(TIME, Policy)
```
**Visual:**
```
Rate
150|        ┌──────────
   |        │
100|────────┘
   └────────────────> Time
            12  24
```

---

**Pulse (temporary spike):**
```
lookup Campaign {
  [0, 0]
  [6, 100]
  [9, 100]
  [9, 0]
  [24, 0]
}
rate: LOOKUP(TIME, Campaign)
```
**Visual:**
```
Rate
100|      ┌───┐
   |      │   │
  0|──────┘   └──────> Time
        6     9
```

---

**Ramp (gradual increase):**
```
lookup Rollout {
  [0, 0]
  [10, 0]
  [20, 100]
  [30, 100]
}
rate: LOOKUP(TIME, Rollout)
```
**Visual:**
```
Rate
100|          ╱────
   |        ╱
 50|      ╱
   |    ╱
  0|───╱
   └────────────────> Time
    0  10  20  30
```

---

**Repeating pattern (seasonal):**
```
lookup Seasonal {
  [0, 1.0]
  [3, 1.2]
  [6, 1.5]
  [9, 1.1]
  [12, 1.0]
}
rate: BaseRate * LOOKUP(TIME % 12, Seasonal)
```
**Visual:**
```
Multiplier
1.5|        ●
   |       ╱╲
1.2|    ●╱  ╲●
1.0|───●─────●───●
   └────────────────> Month
    0  3  6  9  12
   (repeats annually)
```

Use `TIME % period` for cyclical patterns.

---

## Graphs

**Syntax:**
```
graph GraphName {
  title: "string"                   // Optional
  variables: Var1, Var2, Var3       // Required - comma-separated
  type: line | area                 // Optional - default: line
  yAxisLabel: "string"              // Optional
  color: "#hex_color"               // Optional - single variable only
}
```

**Examples:**
```
graph PopulationTrend {
  title: "Population Over Time"
  variables: Population, Capacity
  type: line
  yAxisLabel: "People"
}

graph Revenue {
  title: "Revenue Growth"
  variables: Revenue
  type: area
  color: "#10b981"
}
```

**Notes:**
- Multiple graphs allowed
- Variables must be stock names
- Color applies only if single variable

---

## Termination Conditions

**Syntax:**
```
terminate {
  when: boolean_expression
}
```

**Examples:**
```
terminate {
  when: Population <= 0
}

terminate {
  when: Population <= 5 || Resources <= 0 || TIME >= 100
}
```

**Notes:**
- Stops simulation when condition becomes true
- Useful for avoiding infinite runs
- Can reference stocks, constants, TIME

---

## Expression Examples

### Conditional Flow
```
rate: Stock > Threshold ? FlowRate : 0
```

### Constrained Flow
```
rate: min(Desired, Available)
```

### Prevented Negative
```
rate: max(0, Stock - MinimumLevel)
```

### Nonlinear Effect
```
rate: Stock * LOOKUP(Factor, EffectCurve)
```

### Combined Delays and Lookups
```
rate: DELAY_GRADUAL(LOOKUP(Stock, Table), 5)
```

### Seasonal with Growth
```
rate: BaseRate * (1 + TIME * 0.01) * LOOKUP(TIME % 12, SeasonalPattern)
```

---

## Common Patterns

### Exponential Growth
```
flow Growth {
  from: source
  to: Stock
  rate: Stock * growth_rate
}
```
**Visual:**
```
Stock
  ^              ╱
  |            ╱
  |          ╱
  |        ╱
  |      ╱
  |    ╱
  |  ╱
  |╱
  └────────────────> Time
   exponential curve
```

---

### Exponential Decay
```
flow Decay {
  from: Stock
  to: sink
  rate: Stock * decay_rate
}
```
**Visual:**
```
Stock
  ^╲
  | ╲
  |  ╲
  |   ╲
  |    ╲
  |      ╲
  |        ╲
  |          ╲___
  └────────────────> Time
   exponential decline
```

---

### Goal-Seeking
```
flow Adjustment {
  from: source
  to: Actual
  rate: (Goal - Actual) * adjustment_rate
}
```
**Visual:**
```
Value
Goal|          ────────
    |        ╱
    |      ╱
    |    ╱
    |  ╱
Init|╱
    └────────────────> Time
     approaches goal asymptotically
```

---

### S-Shaped Growth (Logistic)
```
flow Growth {
  from: source
  to: Stock
  rate: Stock * growth_rate * (1 - Stock / Capacity)
}
```
**Visual:**
```
Stock
Cap |           ╱──────
    |         ╱
    |       ╱
    |     ╱
    |   ╱
    | ╱
    |╱
  0 └────────────────> Time
     fast growth then levels off
```

---

### Oscillation (with Delay)
```
flow Adjustment {
  from: source
  to: Actual
  rate: DELAY(Goal - Actual, delay_time) * response_rate
}
```
**Visual:**
```
Value
    ^    ╱╲      ╱╲
Goal|───╱──╲────╱──╲───
    |  ╱    ╲  ╱    ╲
    |        ╲╱
    └────────────────> Time
     oscillates around goal
```

### Stock Transfer
```
flow Transfer {
  from: StockA
  to: StockB
  rate: StockA * transfer_rate
}
```

### Conditional Activation
```
flow ActivatedFlow {
  from: Source
  to: Target
  rate: Condition > Threshold ? Rate : 0
}
```

### Delayed Response
```
flow DelayedEffect {
  from: source
  to: Stock
  rate: SMOOTH(Stimulus, delay_time) * sensitivity
}
```

---

## Naming Conventions

**Valid names:**
- Alphanumeric characters and underscores
- Cannot start with numbers
- Case-sensitive

**Examples:**
```
Population          ✓
Customer_Count      ✓
Stock1              ✓
_internal          ✓
1stStock           ✗ (starts with number)
Stock-Name         ✗ (contains hyphen)
```

**Best practices:**
- PascalCase for stocks/flows: `CustomerBase`, `MonthlyChurn`
- UPPER_CASE for constants: `GROWTH_RATE`, `MAX_CAPACITY`
- Descriptive names: `AverageWaitTime` not `AvgWT`

---

## Simulation Behavior

**Default time step:** `dt = 1`

**Simulation loop:**
1. Evaluate all flow rates at current state
2. Calculate stock changes: `dStock = Σ(inflows) - Σ(outflows)`
3. Update stocks: `Stock += dStock * dt`
4. Enforce constraints (min/max)
5. Increment time: `TIME += dt`
6. Record history
7. Check termination condition
8. Repeat

**History:**
- Last 1000 simulation points kept
- Circular buffer prevents memory issues

**Reset:**
- Sets `TIME = 0`
- Resets all stocks to initial values
- Clears all delay buffers
- Clears history

---

## Limitations

**Naming:**
- Must match regex: `\w+`
- Cannot start with numbers
- Case-sensitive

**Values:**
- No explicit max/min for properties
- Stock constraints optional
- History limited to 1000 points

**Expressions:**
- JavaScript-based evaluation
- No string operations
- No custom function definitions
- Runtime errors for undefined references

**Delays:**
- Each delay call needs unique buffer
- Memory proportional to delay time × dt
- Buffers persist until reset

---

## Error Handling

**Common errors:**

**"Undefined stock 'X'"**
- Check spelling
- Verify stock is defined before use
- Names are case-sensitive

**"Cannot read property 'value'"**
- Stock referenced before definition
- Typo in stock name

**"Invalid rate expression"**
- Check for syntax errors
- Verify all referenced names exist
- Missing operators or parentheses

**"Circular dependency"**
- Stocks cannot reference each other directly
- Use delays to break circular logic

---

## Performance Tips

**Keep expressions simple:**
- Complex expressions evaluated every step
- Factor out constants
- Use lookup tables for complex curves

**Limit history:**
- Long simulations accumulate history
- Reset periodically for long runs

**Optimize delays:**
- SMOOTH/DELAY_GRADUAL faster than DELAY
- Avoid many parallel delays
- Longer dt = faster simulation (but less accurate)

---

## Quick Reference Card

```
// Stock
stock Name { initial: 100, min: 0, max: 1000, units: "unit" }

// Flow  
flow Name { from: source, to: Stock, rate: Stock * 0.5 }

// Constant
const Rate = 0.05

// Lookup
lookup Table { [0, 0], [100, 50] }

// Graph
graph Name { title: "X", variables: Stock1, Stock2, type: line }

// Terminate
terminate { when: Stock <= 0 }

// Delays
SMOOTH(input, time)
DELAY(input, time)
DELAY_GRADUAL(input, time)

// Lookup
LOOKUP(input, Table)
LOOKUP2D(x, y, Table)

// Built-ins
TIME, dt, PI, E

// Math
min, max, abs, sqrt, pow, exp, log
sin, cos, tan, floor, ceil, round

// Operators
+ - * / %
< > <= >= == !=
&& || !
condition ? true : false
```