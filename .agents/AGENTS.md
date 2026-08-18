# GEOPOWER - MATRIZES ENERGÉTICAS | Project Guidelines & AI Agent Rules

Welcome to the **GEOPOWER** repository! This document contains the primary rules, visual design system, technical architecture, and game specifications for all AI assistants and developers contributing to this project.

---

## 🎨 Visual Identity & Aesthetic System

- **Art Style**: Classic Cartoon Aesthetic (1930s–1970s print news and vintage rubber-hose/newspaper cartoon animation style).
- **Color Palette & Filters**: Black & White monochrome tone palette with vintage paper noise and film grain canvas overlay filters. High-contrast typography and inked visual elements.
- **Atmosphere & Narrative**: Historical 1970 context, newsreel headlines, vintage press aesthetic, retro UI components with sound/visual feedback resembling vintage printing presses, gauge meters, and radio broadcasts.

## 💻 Technology Stack & Web Platform

- **Platform**: Web Application (Browser-based).
- **Frontend Core**: HTML5, Vanilla CSS3 (high-performance custom styling without heavy utility frameworks), and JavaScript (ES6+ modular logic & DOM management).
- **Libraries & Rendering**: Canvas 2D / WebGL for film grain overlay filters, audio synthesis/howler libraries for retro press/radio sound effects, and UI animation helpers.

---

## ⚙️ Core Game Architecture Overview

### 1. Game Horizon & Setup
- **Timeline**: 50 sequential turns representing the timeline from **1970 to 2020** (1 turn = 1 calendar year / micro-cycle across historical decades).
- **Players**: 2 to 5 participants (Human and/or AI-controlled nations).
- **Opening Sequence**: 1970 vintage newsreel intro cinematic detailing the energy consumption explosion, early fuel crisis signals, and the call for a Global Energy Summit.
- **Nations**: 5 Asymmetric Nations with distinct geographic traits, initial energy matrices, and specific economic vulnerabilities (ensuring non-self-sufficiency).

---

## 🔄 Turn Structure (4 Phases per Year)

Each turn processes chronologically through 4 strict phases:

1. **Phase 1: Event Revelation (Crises & Climate)**
   - Unveils unpredictable historical or climate events (oil price shocks, river basin droughts, maritime blockades, industrial accidents).
   - Dynamically modifies generation costs, resource availability, and power plant efficiency.

2. **Phase 2: Market, Diplomacy & International Conferences**
   - Simultaneous trading between players: Coal, Oil, Uranium, Financial Capital ($), and Innovation Patents.
   - International summit voting on anti-embargo resolutions, global crisis management, and joint R&D funding.

3. **Phase 3: National Management & R&D Expansion**
   - Allocation of national funds and resources into Science & Tech Trees (Fossil refining $\rightarrow$ Nuclear expansion $\rightarrow$ Solar, Wind, Biofuels).
   - Construction of new power plants, transmission grid modernization, and operational tuning of energy sources.

4. **Phase 4: Mathematical Energy Balance & Resolution**
   - **Energy Balance Equation**: $\text{Net Energy (MW)} = \text{Total Generated MW} - \text{Total Demand (MW)}$
   - **Surplus ($\text{Net MW} \ge 0$)**: Tax generation, population satisfaction increase, and GDP growth.
   - **Deficit ($\text{Net MW} < 0$)**: Automatic rolling blackouts, loss of social stability, reduced future revenues, and industrial freeze.
   - **Global Ecological Footprint Meter**: Cumulative thermal power emissions update a shared global meter. Exceeding critical thresholds triggers global climate disasters punishing all players.

---

## 🏆 Victory Condition (Round 50)

At the 50th round, the game computes the **Resilience Score** for each nation based on:
1. Accumulated GDP Growth.
2. Sustained Social Stability Index.
3. Technological Innovation Level & Clean Energy Transition.
4. Ecological Liability Control & Carbon Mitigation.

---

## 📁 Repository & AI Customizations Structure

- `.agents/AGENTS.md` - Core project guidelines and rules (this file).
- `.agents/rules/game-logic.md` - Complete mathematical equations and balance specifications.
- `.agents/skills/game-engine/SKILL.md` - Engine & State Machine skill instructions.
- `.agents/skills/game-ui-design/SKILL.md` - Vintage cartoon B&W aesthetic & UI component guidelines.
- `.agents/skills/game-nations-trade/SKILL.md` - Nations blueprint, market trading, and events dataset.
- `.agents/skills/game-testing/SKILL.md` - Game verification, simulation, and balance testing.
