---
name: game-nations-trade
description: >-
  Use this skill when defining nation attributes, resource trading protocols (Coal, Oil, Uranium, Capital, Patents), historical event datasets (1970-2020), and international diplomacy summit mechanics.
---

# GEOPOWER Nations, Market & Diplomacy Skill

This skill defines the data structures and procedural rules for nations, resource markets, and international diplomacy.

## 1. Asymmetric Nation Blueprints (5 Pioneer Nations)

Each nation represents a real-world energy pioneer with distinct geographic traits, initial matrix, and vulnerabilities:

1. **Noruega (Norway)**
   - *Geographic & Matrix Attribute*: Huge hydroelectric output and rich North Sea offshore oil/gas reserves.
   - *Vulnerability*: High exposure to international fuel market volatility and harsh winter heating demand peaks.
2. **Brasil (Brazil)**
   - *Geographic & Matrix Attribute*: Vast river basin hydroelectric potential and pioneer in Biofuels (Ethanol/Biomass).
   - *Vulnerability*: Heavy vulnerability to river basin droughts (hydrological risk) and massive grid transmission costs.
3. **Islândia (Iceland)**
   - *Geographic & Matrix Attribute*: World pioneer in geothermal energy and hydro power generation.
   - *Vulnerability*: Isolated island grid with zero cross-border interconnections and full reliance on imported oil for transport/shipping.
4. **Reino Unido (United Kingdom)**
   - *Geographic & Matrix Attribute*: Legacy coal infrastructure, North Sea gas exploration, and high offshore wind potential.
   - *Vulnerability*: Rapidly declining domestic coal reserves and high exposure to maritime trade blockades and fuel import shocks.
5. **Estados Unidos (United States)**
   - *Geographic & Matrix Attribute*: Industrial powerhouse with massive coal/oil resources, advanced nuclear technology, and capital.
   - *Vulnerability*: Voracious energy consumption per capita, high carbon footprint liability, and severe vulnerability to international oil embargos.

## 2. Resource & Patent Trade System

- **Tradable Assets**:
  - Raw Commodities: Coal (tons), Crude Oil (barrels), Uranium (kg).
  - Financials: Capital ($ Millions).
  - Intellect: R&D Innovation Patents (unlocking tech tree nodes for recipient nations).
- **Exchange Mechanism**:
  - Simultaneous offer submission during Phase 2.
  - Bilateral agreement validation (both parties must approve trade terms).

## 3. Historical & Climate Events Dataset (1970–2020)

- Events tied to timeline milestones (e.g., 1973 Oil Crisis, 1979 Hydro Drought, 1986 Industrial Accident, 1997 Kyoto Protocol summit, 2008 Financial Shock, 2015 Paris Agreement).
- Modifies generation costs, global oil/coal prices, or environmental threshold penalties.
