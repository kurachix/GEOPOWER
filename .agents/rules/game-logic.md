# GEOPOWER Game Logic & Mathematical Equations Rule

This document defines the authoritative mathematical equations, balance algorithms, and state transitions for the GEOPOWER simulation motor (1970–2020).

---

## 1. Energy Generation & Demand Balance

For each nation $i$ at turn $t \in [1, 50]$:

$$\text{Generation}_i(t) = \sum_{k \in \text{Sources}} \text{Capacity}_{i,k}(t) \times \text{Efficiency}_{i,k}(t) \times \text{FuelAvailability}_{i,k}(t)$$

$$\text{Demand}_i(t) = \text{BaseDemand}_i \times (1 + \text{PopulationGrowth}_i)^t \times (1 + \text{GDPGrowth}_i(t-1)) \times \text{EventModifier}_i(t)$$

$$\text{Balance}_i(t) = \text{Generation}_i(t) - \text{Demand}_i(t)$$

---

## 2. Economic Growth vs. Blackout Punishment

### Surplus Condition ($\text{Balance}_i(t) \ge 0$)
- **Tax Revenue**: $\text{Revenue}_i(t) = \text{BaseTax}_i + (\text{Balance}_i(t) \times \text{TaxRate}_i)$
- **GDP Growth**: $\text{GDP}_i(t) = \text{GDP}_i(t-1) \times (1 + \gamma_{\text{surplus}})$
- **Social Stability**: $\text{Stability}_i(t) = \min(100, \text{Stability}_i(t-1) + 2)$

### Deficit Condition ($\text{Balance}_i(t) < 0$)
- **Blackout Penalty Ratio**: $\delta_i(t) = \frac{|\text{Balance}_i(t)|}{\text{Demand}_i(t)}$
- **Social Stability Hit**: $\text{Stability}_i(t) = \text{Stability}_i(t-1) - (\delta_i(t) \times 40)$
- **GDP Stagnation/Contraction**: $\text{GDP}_i(t) = \text{GDP}_i(t-1) \times (1 - (\delta_i(t) \times 0.15))$
- **Industrial Freeze**: Research point generation in R&D is frozen for turn $t+1$ if $\delta_i(t) > 0.20$.

---

## 3. Shared Global Ecological Footprint Meter

Each turn, total carbon emissions from thermal sources across all nations are aggregated:

$$\text{AnnualEmissions}(t) = \sum_{i=1}^{N} \sum_{k \in \text{Thermal}} \text{Output}_{i,k}(t) \times \text{PollutionFactor}_k$$

$$\text{GlobalFootprint}(t) = \text{GlobalFootprint}(t-1) + \text{AnnualEmissions}(t) - \text{NaturalAbsorptionRate}$$

### Threshold Trigger & Climate Disasters
- **Level 1 Threshold (500 pts)**: Mild climate events (crop yields -10%, hydro power efficiency -15%).
- **Level 2 Threshold (1000 pts)**: Severe climate disaster (coastal flooding, extreme heatwaves, overall generation efficiency -30% across all nations).
- **Catastrophic Threshold (1500 pts)**: Global ecological crisis; emergency carbon taxation imposed automatically on highest polluters.

---

## 4. Victory Scoring Formula (Turn 50)

At turn 50, the final **Resilience Score** $S_i$ is computed as:

$$S_i = w_1 \cdot \left(\frac{\text{GDP}_i(50)}{\text{GDP}_{\text{max}}}\right) + w_2 \cdot \left(\frac{\text{Stability}_i(50)}{100}\right) + w_3 \cdot \left(\frac{\text{TechTreeLevel}_i(50)}{\text{TechMax}}\right) - w_4 \cdot \left(\frac{\text{CumulativeEmissions}_i}{\text{TotalGlobalEmissions}}\right)$$

Where:
- $w_1 = 0.35$ (Economic Weight)
- $w_2 = 0.30$ (Social Stability Weight)
- $w_3 = 0.20$ (Innovation & Clean Tech Weight)
- $w_4 = 0.15$ (Environmental Liability Penalty Weight)
