# Multi-Screen Flow Analysis Guidelines

When analyzing a user flow (sequence of screens), provide both per-screen feedback and journey-level feedback.

## Journey-Level Review Focus

### Cross-Screen Consistency
- **Terminology**: Do labels, button text, and key terms remain consistent across screens?
  - ❌ "Sign up" on Screen 1, "Create account" on Screen 3
  - ✅ Consistent use of "Create account" throughout
- **Tone**: Does the voice remain appropriate and consistent throughout the journey?
  - ❌ Casual on Screen 1 ("Let's get started!"), formal on Screen 3 ("Please provide...")
  - ✅ Consistent register that matches user context
- **Visual Language**: Do color usage, spacing, typography remain coherent?
  - ❌ Large spacious layout on Screen 1, cramped layout on Screen 2
  - ✅ Consistent visual hierarchy and spacing rhythm

### Flow Logic & Progression
- Do screens build on each other logically?
- Is the user's mental model supported throughout?
- Are there gaps or confusing jumps in the sequence?
- Does each screen set expectations for the next one?

### Transitions
- Are there jarring shifts in content, expectations, or visual hierarchy?
- Does each screen prepare the user for the next step?
- Is critical context preserved across screens (e.g., error messages, user input)?
- Do animations or interactions flow naturally between screens?

## Screen Naming Convention

Designers may use this convention to help organize and communicate their flows:
- **1, 2, 3** — Sequential screens in a linear flow
- **2.1, 2.2** — Multiple states or variations within the same screen (e.g., empty form vs. filled form, loading state vs. complete state)
- **3.X** — Masked/excluded screens (out of scope, external systems, or reference only)

Use screen names to understand the intended sequence and context. Screens named with decimals (e.g., 2.1, 2.2) should be compared for consistency, but the main flow progression uses the whole numbers (1, 2, 3). Screens ending in .X are typically not part of the critical path and may be mentioned in feedback but not as primary flow considerations.

## Analysis Approach

1. **First Pass**: Review each screen individually for style guide compliance
2. **Second Pass**: Look across screens for consistency patterns
3. **Journey Feedback**: Synthesize findings into flow-level observations
4. **Recommendations**: Prioritize cross-screen fixes for maximum impact
