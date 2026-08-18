---
name: game-testing
description: >-
  Use this skill when writing unit tests, running simulation benchmarks for 50-round games, testing balance math, or verifying game UI and state transition logic.
---

# GEOPOWER Game Testing & Verification Skill

This skill provides guidelines and testing procedures to verify the game engine, math balance, and UI stability.

## Verification Checklist

1. **Mathematical Energy Balance Test**:
   - Verify that surplus MW increases GDP and stability.
   - Verify that deficit MW correctly triggers blackouts, stability drop, revenue penalty, and R&D freeze when $> 20\%$.

2. **50-Turn Simulation Test**:
   - Run automated head-to-head simulations with 2 to 5 bot players taking actions for 50 turns (1970–2020).
   - Ensure state machine transitions seamlessly through all 4 phases per turn without deadlocking.
   - Verify Global Ecological Footprint Meter accumulates carbon output and triggers global climate disasters accurately upon reaching thresholds (500, 1000, 1500).

3. **Endgame Victory Scoring Test**:
   - Assert that round 50 computes the correct Resilience Score based on weighted formula parameters.
   - Confirm winner declaration and game reset/replay flow.
