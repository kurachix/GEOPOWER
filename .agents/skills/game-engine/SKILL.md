---
name: game-engine
description: >-
  Use this skill when developing, refactoring, or extending the core state engine, turn progression loop (50 turns: 1970 to 2020), 4-phase sequence, energy balance calculations, and blackout/GDP algorithms for GEOPOWER.
---

# GEOPOWER Game Engine & State Management Skill

This skill guides the implementation of the simulation motor and game turn workflow.

## Engine Responsibilities

1. **Game State Initialization**:
   - Initialize 2 to 5 player nations with starting resources, plant capacities, demand baseline, and initial matrices.
   - Set start year = 1970, current round = 1, max rounds = 50.
   - Set initial Global Ecological Footprint = 0.

2. **Sequential 4-Phase Turn Lifecycle**:
   - `Phase 1: Event Revelation`: Fetch year-indexed or randomized historic/climate event for turn $t$. Modify plant efficiency, fuel prices, or regional demand.
   - `Phase 2: Market & Diplomacy`: Execute bilateral trade orders (Coal, Oil, Uranium, Capital, Patents) and calculate resolution votes.
   - `Phase 3: National Management`: Process R&D tech investments, plant construction queues, transmission upgrades, and source throttling.
   - `Phase 4: Mathematical Energy Balance`: Run mathematical resolution (Generation vs Demand, tax collection, blackout processing, global footprint updates).

3. **Victory Resolution (Round 50)**:
   - When round reaches 50, execute final Resilience Score calculation as defined in [game-logic.md](../../rules/game-logic.md).
   - Rank players and trigger endgame victory screen.

## Code Patterns & Best Practices

- **Immutability**: Store turn state changes cleanly per round to allow full historical timeline analysis (1970–2020).
- **Deterministic Math**: Ensure all math calculations (demand growth, generation capacity, emission totals) produce deterministic results given the same input actions and seed.
