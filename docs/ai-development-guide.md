# Using the Claude Skill for Development

This guide shows how to use the Systems Thinking Tool Claude skill to accelerate your development workflow.

---

## What is the Claude Skill?

The **Systems Thinking Tool Claude Skill** ([SKILL.md](SKILL.md)) is a comprehensive prompt that teaches Claude AI about the DSL syntax and system dynamics concepts. When you load this skill, Claude becomes an expert at:

- Generating DSL code for system models
- Explaining system dynamics concepts
- Debugging DSL syntax errors
- Suggesting model improvements
- Creating examples for specific domains

---

## Quick Start

### Option 1: Copy-Paste (Simplest)

1. Open [SKILL.md](SKILL.md) in this repository
2. Copy the entire content
3. Start a new conversation with Claude
4. Paste this message:
   ```
   Please use this skill for all my systems thinking questions:
   
   [paste SKILL.md content here]
   ```
5. Ask your questions!

### Option 2: Claude Projects (Best for Ongoing Work)

1. Create a new Project in Claude
2. Add [SKILL.md](SKILL.md) to the project knowledge
3. All conversations in that project will have access to the skill
4. Perfect for iterative development

### Option 3: Custom Instructions (Claude Pro/Team)

1. Go to Claude Settings → Skills
2. Upload [SKILL.md](SKILL.md) as a custom skill
3. Enable it for all conversations
4. Available across all chats

---

## Development Workflows

### 1. Generate Model from Description

**Prompt:**
```
I need a DSL model for inventory management with:
- Stock that depletes from sales
- Reorder point triggers new orders
- 7-day delivery delay
- Sales rate of 10 units/day
```

**Claude generates:**
```
const SalesRate = 10
const ReorderPoint = 30
const OrderQuantity = 100
const DeliveryDelay = 7

stock Inventory {
  initial: 100
  min: 0
  units: "units"
}

stock OnOrder {
  initial: 0
  min: 0
  units: "units"
}

flow Sales {
  from: Inventory
  to: sink
  rate: SalesRate
}

flow Ordering {
  from: source
  to: OnOrder
  rate: Inventory < ReorderPoint ? OrderQuantity : 0
}

flow Delivery {
  from: OnOrder
  to: Inventory
  rate: DELAY(Ordering, DeliveryDelay)
}

graph InventoryStatus {
  title: "Inventory Levels"
  variables: Inventory, OnOrder
  type: line
}
```

---

### 2. Debug Syntax Errors

**Your code:**
```
stock Population {
  initial = 100
}

flow Growth {
  from: Population
  rate: Population * 0.05
}
```

**Prompt:**
```
This DSL code isn't working. Can you fix it?

[paste your code]
```

**Claude responds:**
```
I found two issues:

1. Stock properties use colons, not equals:
   initial: 100  (not initial = 100)

2. Flow 'Growth' has from but no to:
   Add: to: Population

Corrected code:

stock Population {
  initial: 100
}

flow Growth {
  from: source
  to: Population
  rate: Population * 0.05
}
```

---

### 3. Enhance Existing Model

**Prompt:**
```
I have this basic epidemic model. How can I add:
- Vaccination
- Immunity waning over time
- Hospitalization tracking

[paste your current model]
```

**Claude suggests improvements with complete code**

---

### 4. Understand Complex Expressions

**Prompt:**
```
What does this rate expression do?

rate: Population * (BaseDeathRate + DELAY_GRADUAL(
  LOOKUP(Resources / Population, ResourceStressEffect),
  MortalityDelay
))
```

**Claude explains:**
```
This expression calculates death rate with these components:

1. Base death rate: BaseDeathRate
2. Stress-induced mortality: LOOKUP(Resources / Population, ResourceStressEffect)
   - Calculates resources per person
   - Looks up additional mortality from stress curve
3. Delayed perception: DELAY_GRADUAL(..., MortalityDelay)
   - Resource stress takes time to affect health
   - Smooth delay models gradual biological response
4. Total rate: Population * (base + delayed stress)

Effect: Death rate increases when resources scarce,
but with realistic time lag for health deterioration.
```

---

### 5. Convert Domain Knowledge to Model

**Prompt:**
```
I'm modeling customer churn for a SaaS business. 
We know:
- Good support reduces churn
- But customers don't notice quality changes immediately
- Takes ~6 months for perception to update
- Churn rate: 5% baseline, 2% with excellent support, 10% with poor

Convert this to DSL code.
```

**Claude generates complete model with lookup table and delay**

---

### 6. Explore "What If" Scenarios

**Prompt:**
```
I have this population model. How would I add:
- A policy intervention at month 24
- That reduces birth rate by 20%
- For 12 months

Show me the DSL.
```

**Claude provides time-based pattern solution**

---

### 7. Learn by Example

**Prompt:**
```
Show me 3 different ways to model seasonal patterns:
1. Simple repeating cycle
2. Growing baseline with seasonal variation
3. Random seasonal noise

Include complete DSL for each.
```

**Claude provides multiple implementations with explanations**

---

## Advanced Use Cases

### Code Review

**Prompt:**
```
Review this DSL model and suggest improvements:
- Is the model well-structured?
- Are there better ways to express these relationships?
- Any potential issues?

[paste model]
```

---

### Performance Optimization

**Prompt:**
```
This model is slow to simulate. Can you:
1. Identify performance bottlenecks
2. Suggest optimizations
3. Simplify without losing accuracy

[paste model]
```

---

### Domain Translation

**Prompt:**
```
Translate this system dynamics concept to our DSL:
"A balancing loop with a third-order delay seeking
a goal that drifts based on recent performance"

Show me the complete implementation.
```

---

### Documentation Generation

**Prompt:**
```
Generate documentation for this model:
- What does it simulate?
- Key assumptions
- Expected behavior
- How to modify parameters

[paste model]
```

---

### Testing Scenarios

**Prompt:**
```
Create 5 test cases for this inventory model:
1. Normal operation
2. Demand spike
3. Supply disruption  
4. Order delay increase
5. Multiple simultaneous issues

Show expected behavior for each.
```

---

## Tips for Effective Prompts

### Be Specific

❌ "Make a population model"
✅ "Create a population model with birth rate 2%, death rate 1%, resource consumption, and resource depletion limiting growth"

### Provide Context

❌ "Fix this code [paste]"
✅ "This code should model customer churn but churn rate stays constant. I want it to vary based on support quality. [paste]"

### Ask for Explanations

```
Generate code for X, and explain:
- Why you chose this structure
- What each part does
- How to modify it for scenario Y
```

### Iterate

```
[Claude generates code]

"Good! Now add:
- A constraint that X can't exceed Y
- A delay between Z and W
- A graph showing A and B"
```

### Request Multiple Options

```
Show me 3 different approaches to model this:
1. Simple/fast
2. Realistic/complex
3. With detailed tracking

Explain tradeoffs of each.
```

---

## Common Patterns

### Pattern: "Generate from description"
```
Create a DSL model for [system] with:
- [list key components]
- [list behaviors]
- [list constraints]
```

### Pattern: "Explain this code"
```
Explain what this model does and how it works:
[paste DSL code]
```

### Pattern: "Debug this"
```
This model should [expected behavior] but instead [actual behavior].
Here's the code:
[paste DSL]
```

### Pattern: "Add feature"
```
I have this model [paste]. Add:
- [new feature]
- [new behavior]
- [new constraint]
```

### Pattern: "Compare approaches"
```
Show me 2 ways to model [concept]:
1. Using [approach A]
2. Using [approach B]

Which is better for [use case]?
```

---

## Integration with Your Workflow

### During Development

1. **Planning**: Ask Claude to generate initial model structure
2. **Implementation**: Copy generated DSL into editor
3. **Testing**: Describe issues, get debugging help
4. **Refinement**: Request enhancements iteratively

### During Code Review

1. Paste model into Claude
2. Ask for review and suggestions
3. Request specific improvements
4. Validate changes before implementing

### When Learning

1. Ask for examples of specific patterns
2. Request explanations of complex expressions
3. Get domain-specific implementations
4. Explore variations and tradeoffs

### For Documentation

1. Generate model documentation
2. Create usage examples
3. Explain system behavior
4. Document parameters and effects

---

## Example: Full Development Session

**Your goal:** Model technical debt in a software project

**Conversation:**

**You:**
```
I want to model technical debt accumulation in a software project. 
It should include:
- Code quality starts at 100
- Features add technical debt
- Debt reduces productivity
- Refactoring reduces debt but takes time
- More debt = harder to refactor

Can you create a DSL model?
```

**Claude:** [generates initial model]

**You:**
```
Good! Now add:
- Debt accumulation accelerates when quality is low
- Emergency refactoring when debt exceeds threshold
- Graph showing quality, debt, and productivity
```

**Claude:** [enhances model]

**You:**
```
The productivity should also affect how fast we add features.
And add a termination condition when quality drops below 20.
```

**Claude:** [final version with all features]

**You:**
```
Explain how the feedback loops work in this model.
```

**Claude:** [detailed explanation]

---

## Skill Limitations

The Claude skill knows:
- ✅ Complete DSL syntax
- ✅ All functions and features
- ✅ System dynamics concepts
- ✅ Common patterns and archetypes
- ✅ Best practices

The skill cannot:
- ❌ Execute or run your code
- ❌ Access your repository
- ❌ Debug runtime errors (only syntax)
- ❌ Know about future DSL changes
- ❌ Implement features not in the DSL

For runtime issues, you'll need to test in the actual tool.

---

## Updating Your Workflow

### Before Using Skill
1. Manually write DSL code
2. Look up syntax in docs
3. Debug by trial and error
4. Implement features slowly

### After Using Skill
1. Describe what you want
2. Get working code immediately
3. Iterate with Claude's help
4. Learn patterns through examples

---

## Best Practices

**Do:**
- Start conversations with context
- Ask for explanations, not just code
- Iterate on generated solutions
- Request multiple approaches
- Verify code in the tool

**Don't:**
- Paste entire repos (Claude has context limits)
- Assume generated code is perfect (always test)
- Use for completely new DSL features
- Forget to update the skill when DSL changes

---

## Skill Maintenance

The skill is based on the current DSL implementation. When you add new features:

1. Update [SKILL.md](SKILL.md) with new syntax
2. Add examples of new features
3. Document new functions or constructs
4. Share updates with your team

This keeps the skill accurate and useful!

---

## Getting Started

1. **Download**: Get [SKILL.md](SKILL.md) from this repo
2. **Load**: Choose your method (copy-paste, project, or custom skill)
3. **Test**: Try generating a simple model
4. **Experiment**: Explore different prompts
5. **Integrate**: Use in your daily workflow

---

## Example Prompts to Try

```
"Create a thermostat model with temperature oscillation"

"Explain the difference between SMOOTH and DELAY_GRADUAL"

"Generate a SIR epidemic model with vaccination"

"Debug this code: [paste]"

"Show me 3 ways to model seasonal patterns"

"Convert this business process to a system dynamics model: [description]"

"What's the best way to model: [your concept]"

"Review this model and suggest improvements: [paste]"
```

---

## Resources

- **Skill file**: [SKILL.md](SKILL.md)
- **Getting Started**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **DSL Reference**: [DSL_REFERENCE.md](DSL_REFERENCE.md)
- **Tool**: [systemsthinkingtool.com](https://systemsthinkingtool.com)
- **Repository**: [github.com/doodzik/systems-thinking-tool](https://github.com/doodzik/systems-thinking-tool)

---

## Community

Share your experiences:
- What prompts work best?
- What patterns have you discovered?
- How has it improved your workflow?

Contribute improvements:
- Better examples
- Clearer explanations
- New use cases
- Updated features

The skill gets better with community feedback!