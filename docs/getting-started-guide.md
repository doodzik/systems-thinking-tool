# Getting Started with Systems Thinking

## What is Systems Thinking?

Systems thinking is a way of understanding how things work by looking at the relationships and feedback loops that connect them, rather than just individual parts. It helps you see the bigger picture and understand why systems behave the way they do over time.

### Key Concepts

**Stocks**: Things that accumulate or deplete over time
- Example: Population, inventory, money in bank, water in reservoir

**Flows**: Rates that change stocks
- Example: Birth rate, sales rate, income, water flowing in/out

**Feedback Loops**: Circular causality where changes feed back on themselves
- **Reinforcing (R)**: Amplify change - growth or collapse
- **Balancing (B)**: Resist change - seek equilibrium

**Delays**: Time lags between cause and effect
- Example: Training takes time, perception lags reality, orders in transit

**Nonlinear Relationships**: Effects that don't scale proportionally
- Example: Diminishing returns, network effects, tipping points

---

## Why Systems Thinking?

Traditional linear thinking assumes:
- Simple cause → effect
- Changes are proportional
- Problems have simple solutions

But most real-world problems involve:
- Multiple interacting causes
- Feedback that amplifies or dampens effects
- Unintended consequences from well-intentioned actions
- Delays that create oscillations and instability

Systems thinking helps you:
- Understand why quick fixes often backfire
- Find leverage points for effective interventions
- Anticipate unintended consequences
- See patterns that repeat across different domains

---

## Common System Archetypes

These patterns appear everywhere - in business, ecology, society, and technology:

### 1. Limits to Growth

Growth accelerates until it hits a constraint

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
```

**Example:** Startup growth limited by capacity to hire and train

**Feedback loops:**
- R (Reinforcing): Growth → More Resources → More Growth
- B (Balancing): Growth → Resource Depletion → Limits Growth

---

### 2. Shifting the Burden

Quick fixes undermine fundamental solutions

**Visual:**
```
Problem
High|╲    ╱╲    ╱╲    ╱╲
    | ╲  ╱  ╲  ╱  ╲  ╱
 Low|──╲╱────╲╱────╲╱
    └────────────────> Time
     Quick fixes provide relief
     but problem returns worse
```

**Example:** Using overtime instead of fixing root cause of workload

---

### 3. Success to the Successful

Winners accumulate more resources, creating dominance

**Visual:**
```
Market Share
100%|        Winner ╱─────
    |              ╱
 50%|            ╱
    |          ╱
  0%|────────╱ Loser
    └────────────────> Time
```

**Example:** Market leaders get better deals from suppliers

---

### 4. Tragedy of the Commons

Individually rational actions collectively deplete shared resources

**Visual:**
```
Shared Resource
High|╲
    | ╲
    |  ╲
    |   ╲
 Low|    ╲___________
    └────────────────> Time
     Each actor takes
     "their fair share"
```

**Example:** Overfishing, pollution, technical debt

---

### 5. Fixes That Backfire

Solutions create new problems that worsen the original issue

**Visual:**
```
Problem Level
High|    ╱─────
    |   ╱
Init|──╱ temporary relief
    |   ╲
Worse|    ╲─────
    └────────────────> Time
         fix makes it worse
```

**Example:** Antibiotics creating resistant bacteria

---

## Tools for Systems Thinking

### Visual Tools

**Causal Loop Diagrams (CLDs)**
- Show connections between variables
- Mark reinforcing (R) and balancing (B) loops
- Tools: Paper and pen, Kumu, Loopy

**Stock and Flow Diagrams**
- Distinguish stocks (boxes) from flows (valves)
- Show material moving through system
- Tools: Stella, Vensim, this tool!

### Simulation Tools

**System Dynamics Software**
- Build quantitative models
- Run simulations over time
- Test scenarios and policies
- Examples: Stella, Vensim, Insight Maker, **Systems Thinking Tool**

**Agent-Based Models**
- Simulate individual actors and their interactions
- Tools: NetLogo, AnyLogic

---

## Using the Systems Thinking Tool

### Interface Layout

```
┌─────────────────────────────────────────────────────┐
│ System Dynamics Modeler                             │
├─────────────────────────┬───────────────────────────┤
│                         │                           │
│  DSL Editor             │  Visual Diagram           │
│  (left panel)           │  (top right)              │
│                         │                           │
│  Write your model       │  See stocks and flows     │
│  using DSL syntax       │  as visual diagram        │
│                         │                           │
├─────────────────────────┼───────────────────────────┤
│                         │  Simulation Graph         │
│                         │  (bottom right)           │
│                         │                           │
│                         │  Watch stocks change      │
│                         │  over time                │
├─────────────────────────┴───────────────────────────┤
│ [Step] [▶ Run] [⏸ Pause] [Reset] Speed: ────○──── │
└─────────────────────────────────────────────────────┘
```

### Quick Start Tutorial

**Step 1: Define a Stock**

In the left panel (DSL editor), type:
```
stock Population {
  initial: 100
  units: "people"
}
```

You'll see a rectangle appear in the visual diagram labeled "Population".

**Step 2: Add a Flow**

Add growth to your population:
```
flow Births {
  from: source
  to: Population
  rate: Population * 0.02
}
```

You'll see a valve connecting a cloud (source) to Population.

**Step 3: Run the Simulation**

1. Click **Run** button at the bottom
2. Watch the graph show Population growing exponentially
3. Click **Pause** to stop
4. Click **Reset** to start over

**Step 4: Add a Constraint**

Add resource limits:
```
stock Resources {
  initial: 1000
  units: "units"
}

flow Consumption {
  from: Resources
  to: sink
  rate: Population * 0.5
}
```

Run again and see how resource depletion affects the system!

---

### Using the Editor

**Live Updates**: The diagram updates as you type

**Syntax Highlighting**: Keywords, numbers, and strings are color-coded

**Error Messages**: Console shows errors if syntax is invalid

**Comments**: Use `//` for notes
```
// This is a comment
const GrowthRate = 0.05  // inline comment
```

---

### Simulation Controls

**Step**: Advance one time step (`dt`)

**Run**: Continuously advance time until:
- You press Pause
- Termination condition is met
- Simulation reaches reasonable limit

**Pause**: Stop running simulation (resume with Run)

**Reset**: Return all stocks to initial values, clear graph

**Speed Slider**: Control simulation speed (slower = easier to observe)

---

### Understanding the Visual Diagram

**Stocks (Rectangles)**
- Show current value inside
- Size doesn't indicate value

**Flows (Valve symbols)**
- Arrow direction shows flow direction
- Thickness doesn't indicate rate

**Clouds (Sources/Sinks)**
- ☁️ Source = infinite input
- ☁️ Sink = infinite output

**Connections**
- Lines show what affects what
- Hover to see relationships

---

### Reading the Graph

**Y-axis**: Stock values

**X-axis**: Time

**Multiple Lines**: Different stocks shown in different colors

**Legend**: Toggle in graph to show/hide variables

**Table View**: Toggle to see exact numbers at each time step

---

## Your First Complete Model

Let's build a thermostat:

```
// Constants
const TargetTemp = 70
const HeatingRate = 5
const CoolingRate = 0.5

// Stock
stock Temperature {
  initial: 60
  min: 0
  max: 100
  units: "°F"
}

// Flows
flow Heating {
  from: source
  to: Temperature
  rate: Temperature < TargetTemp ? HeatingRate : 0
}

flow Cooling {
  from: Temperature
  to: sink
  rate: CoolingRate
}

// Visualization
graph TempControl {
  title: "Temperature Over Time"
  variables: Temperature
  type: line
  yAxisLabel: "°F"
}
```

**What happens:**
1. Temperature starts at 60°F (below target)
2. Heater turns on at full rate (+5°F per step)
3. Temperature rises toward 70°F
4. Heater turns off when temp reaches 70°F
5. Cooling causes temp to drop (-0.5°F per step)
6. Heater turns back on when temp falls below 70°F
7. System oscillates around target

**Visual behavior:**
```
Temperature
    ^    ╱╲      ╱╲
 70°|───╱──╲────╱──╲─── Target
    |  ╱    ╲  ╱    ╲
 60°|─╱      ╲╱
    └────────────────> Time
     Heater On  Off  On
```

**Try experimenting:**
- Change `TargetTemp` to 80
- Increase `HeatingRate` to 10 (faster oscillations)
- Add `SMOOTH(Temperature, 3)` to add sensor delay

---

## Common Patterns to Try

### Exponential Growth
```
stock Amount { initial: 100 }
flow Growth {
  from: source
  to: Amount
  rate: Amount * 0.05  // 5% per period
}
```

**Visual behavior:**
```
Amount
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

### Goal-Seeking
```
const Goal = 100
stock Actual { initial: 50 }
flow Adjustment {
  from: source
  to: Actual
  rate: (Goal - Actual) * 0.2  // Close 20% of gap
}
```

**Visual behavior:**
```
Value
100|           ────────
   |         ╱
   |       ╱
   |     ╱
 50|────╱
   └────────────────> Time
    approaches goal
```

---

### Inventory with Delays
```
stock Inventory { initial: 100 }
stock OnOrder { initial: 0 }

flow Sales {
  from: Inventory
  to: sink
  rate: 10
}

flow Ordering {
  from: source
  to: OnOrder
  rate: Inventory < 30 ? 50 : 0
}

flow Delivery {
  from: OnOrder
  to: Inventory
  rate: DELAY(Ordering, 7)  // 7-day shipping
}
```

**Visual behavior:**
```
Inventory
100|╲    ╱╲    ╱╲
   | ╲  ╱  ╲  ╱  ╲
 30|──╲╱────╲╱────
   └────────────────> Time
    oscillates around
    reorder point
```

---

## Understanding Delays Visually

### Three Types of Delays

**Input: Step change from 0 to 10 at time 0**

```
SMOOTH (Perception/Awareness)
Output
10|                 ╱────
  |               ╱
  |             ╱
  |          ╱
 0|────────╱
  └────────────────────> Time
  Quick start, gradual finish

DELAY_GRADUAL (Training/Multi-stage)
Output
10|            ╱──╲
  |          ╱      ╲
  |        ╱          ╲
  |      ╱              ╲
 0|────╱                  ╲──
  └────────────────────> Time
  Smooth bell curve

DELAY (Physical Pipeline)
Output
10|          ┌─────────
  |          │
  |          │
 0|──────────┘
  └────────────────────> Time
           ↑
      exact timing
```

**When to use which:**
- **People notice changes slowly?** → SMOOTH
- **Parts moving through factory?** → DELAY  
- **Training with variable completion?** → DELAY_GRADUAL

---

## Understanding Nonlinear Effects

### Linear vs Nonlinear

**Linear (proportional):**
```
Effect
  ^      ╱
  |    ╱
  |  ╱
  |╱
  └────────> Input
   double input = double effect
```

**Square Root (diminishing returns):**
```
Effect
  ^  ╱─────────
  | ╱
  |╱
  └────────> Input
   (advertising, team size)
```

**Power (accelerating):**
```
Effect
  ^              ╱
  |            ╱
  |          ╱
  |        ╱
  |     ╱
  |  ╱
  |╱
  └────────> Input
   (network effects, panic)
```

**Lookup Table (any shape):**
```
Effect
  ^
  |  ●───●
  | ╱     ╲
  |╱       ╲●
  |          ╲
  └────────> Input
   (custom curves from data)
```

### Real Example: Customer Satisfaction vs Wait Time

```
lookup SatisfactionCurve {
  [0, 100]      // Instant = perfect
  [5, 80]       // 5 min = good
  [10, 50]      // 10 min = neutral
  [20, 10]      // 20 min = angry
}

flow SatisfactionChange {
  rate: LOOKUP(WaitTime, SatisfactionCurve)
}
```

**Visualized:**
```
Satisfaction
100|●─╲
   |   ╲
 80|    ●─╲
   |       ╲
 50|        ●─╲
   |           ╲
 10|            ●
   └────────────────> Wait Time (min)
    0   5  10    20

Key insight: Small wait time improvements
at high levels (20→15 min) have HUGE impact.
Optimizing 5→0 min barely matters!
```

---

## Tips for Learning

1. **Start Simple**: Begin with one stock and one flow

2. **Build Gradually**: Add complexity one element at a time

3. **Watch Behavior**: Run simulation and observe patterns

4. **Ask "Why?"**: If behavior surprises you, look for feedback loops

5. **Experiment**: Change parameters and see what happens

6. **Use Real Numbers**: Base on actual data when possible

7. **Document**: Add comments explaining your thinking

---

## Common Mistakes to Avoid

**Forgetting Feedback**: Every flow should eventually affect its own rate
- ❌ `rate: 10` (constant - no feedback)
- ✅ `rate: Stock * 0.1` (proportional - feedback)

**Ignoring Delays**: Real systems have time lags
- ❌ Assuming instant response
- ✅ Using SMOOTH or DELAY functions

**Missing Constraints**: Real stocks can't go negative
- ❌ Allowing negative populations
- ✅ Add `min: 0` or use `max(0, rate)`

**Over-Complicating**: Simplicity reveals insights
- ❌ Including every possible detail
- ✅ Focus on key feedback loops

---

## Next Steps

**Study Examples**: Look at the built-in examples in the tool

**Read the Reference**: Check the comprehensive DSL reference for all syntax

**Model Your Domain**: Pick a problem you understand and model it

**Share & Discuss**: Share your models, get feedback

**Iterate**: Refine your models based on what you learn

---

## Learning Resources

**Books:**
- "Thinking in Systems" by Donella Meadows (best intro)
- "Business Dynamics" by John Sterman (comprehensive)
- "The Fifth Discipline" by Peter Senge (business focus)

**Online:**
- System Dynamics Society (systemdynamics.org)
- MIT System Dynamics Group
- Loopy (ncase.me/loopy) - simple interactive tool

**Practice:**
- Model everyday systems (coffee cooling, traffic jams)
- Recreate famous models (SIR epidemic, predator-prey)
- Build models for your work/research domain

---

## Getting Help

**Common Issues:**

**"My model doesn't do anything"**
- Check that flows reference stocks (create feedback)
- Verify initial values aren't zero
- Increase simulation time

**"Everything goes to infinity"**
- Add balancing loops (constraints)
- Check for missing negative flows
- Verify rate expressions make sense

**"Syntax errors"**
- Check for missing braces `{}`
- Verify property names (initial, rate, from, to)
- Check for typos in stock/constant names

**"Graph looks weird"**
- Try different time scales
- Check if stocks have reasonable units
- Look for missing `min: 0` constraints

---

## What to Model

**Personal:**
- Savings and spending
- Learning and skill development
- Health and exercise habits

**Business:**
- Customer acquisition and churn
- Inventory management
- Project capacity and burnout

**Social:**
- Epidemic spread
- Opinion dynamics
- Resource commons

**Technical:**
- System performance and load
- Technical debt accumulation
- Error rate and reliability

The key is to start with something you understand well, then gradually add complexity!