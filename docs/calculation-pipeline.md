# Calculation pipeline

How a set of inputs becomes a recipe. The diagrams show **settings** as
slanted boxes, **decisions** as diamonds, **calculations** as rectangles and
**results** as rounded boxes. The edges carry the data between them. Every
calculation names the function that does it, and the section of the docs that
explains why it works that way.

All of it runs in [`src/lib/`](../src/lib/), in metric base units (grams, °C,
hours). Conversion to ounces and °F happens only in the components.

---

## 1. Overview

```mermaid
flowchart TD
  classDef setting fill:#fff7ed,stroke:#ea580c,color:#7c2d12
  classDef decision fill:#fef9c3,stroke:#ca8a04,color:#713f12
  classDef calc fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
  classDef result fill:#ecfdf5,stroke:#059669,color:#064e3b

  style_[/"Pizza style preset"/]:::setting
  size[/"Pizzas × ball weight"/]:::setting
  percents[/"Water, salt, oil, sugar, ice %"/]:::setting
  method[/"Dough method"/]:::setting
  schedule[/"Final dough schedule:<br/>room h + °C, fridge h + °C,<br/>bulk/proof split, balling point"/]:::setting
  thermal[/"Account for cooling down"/]:::setting
  yeastType[/"Yeast type"/]:::setting
  auto[/"Calculate automatically?"/]:::setting
  pref[/"Preferment settings"/]:::setting
  starterIn[/"Starter settings"/]:::setting

  sanitize["sanitize()<br/>clamp every input; method sets<br/>the room-time minimums"]:::calc
  total["totalDough = pizzas × ball weight"]:::calc
  toSchedule["toSchedule()<br/>cold mass = whole batch or one ball"]:::calc
  demand["scheduleDemand()<br/>fresh yeast % the final dough's<br/>schedule needs in all<br/>see §2"]:::calc
  which{"method?"}:::decision

  direct["yeast % = demand × type conversion<br/>or the hand-entered %"]:::calc
  prefCalc["preferment pipeline<br/>see §3"]:::calc
  sourCalc["sourdough pipeline<br/>see §4"]:::calc

  weights["calculateRecipe()<br/>baker's % → grams; preferment or<br/>starter flour and water taken off<br/>the final mix; ice split"]:::calc

  ingredients(["Ingredients:<br/>preferment / starter card + final dough"]):::result
  timeline(["Timeline and total hours"]):::result
  steps(["Instructions"]):::result
  planner(["Clock time per step<br/>when a bake time is set"]):::result
  warnings(["Warnings: preferment surplus,<br/>starter out of range, feed mismatch"]):::result

  style_ -->|"preset values"| sanitize
  size --> sanitize
  percents --> sanitize
  method --> sanitize
  schedule --> sanitize
  pref --> sanitize
  starterIn --> sanitize
  sanitize --> total
  sanitize -->|"room/cold h + °C"| toSchedule
  thermal -->|"on: pass cold mass"| toSchedule
  total -->|"batch mass"| toSchedule
  toSchedule -->|"FermentationSchedule"| demand
  demand -->|"fresh %"| which
  which -->|direct| direct
  which -->|"poolish, biga"| prefCalc
  which -->|sourdough| sourCalc
  yeastType --> direct
  yeastType --> prefCalc
  auto --> direct
  auto --> prefCalc
  auto --> sourCalc
  direct -->|"yeast %"| weights
  prefCalc -->|"preferment yeast %,<br/>final yeast %"| weights
  sourCalc -->|"starter %"| weights
  total --> weights
  weights --> ingredients
  weights --> timeline
  weights --> steps
  prefCalc --> warnings
  sourCalc --> warnings
  timeline --> planner
  steps --> planner
```

---

## 2. Yeast demand of the final dough

`scheduleDemand()` in [`recipe.ts`](../src/lib/recipe.ts) calls
`freshYeastFraction()` in [`yeast.ts`](../src/lib/fermentation/yeast.ts). This
is the original model, described in
[fermentation-model.md §2](fermentation-model.md#2-the-model-this-app-uses).

```mermaid
flowchart TD
  classDef setting fill:#fff7ed,stroke:#ea580c,color:#7c2d12
  classDef decision fill:#fef9c3,stroke:#ca8a04,color:#713f12
  classDef calc fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
  classDef result fill:#ecfdf5,stroke:#059669,color:#064e3b

  room[/"room h, room °C"/]:::setting
  cold[/"fridge h, fridge °C"/]:::setting
  mass[/"cold mass, if cooling is on"/]:::setting

  lag["effectiveColdTime()<br/>cooling curve, Q10 = 2<br/>fermentation-model §6.5"]:::calc
  roomAct["roomActivity()<br/>A(T) · t^−1.45<br/>§2.1"]:::calc
  coldAct["coldActivity()<br/>saturating Hill curve<br/>§2.2"]:::calc
  hasCold{"fridge h > 0?"}:::decision
  hasRoom{"room h > 0?"}:::decision
  roomOnly["room × 1.26"]:::calc
  coldOnly["cold activity alone"]:::calc
  both["room × combinedFactor(cold h, °C)<br/>× correction(cold h)<br/>§2.3"]:::calc
  out(["fresh yeast % of flour"]):::result

  cold --> lag
  mass --> lag
  room --> roomAct
  lag -->|"effective fridge h"| coldAct
  lag -->|"effective fridge h"| both
  roomAct --> hasCold
  hasCold -->|no| roomOnly
  hasCold -->|yes| hasRoom
  hasRoom -->|no| coldOnly
  hasRoom -->|yes| both
  coldAct --> coldOnly
  roomOnly --> out
  coldOnly --> out
  both --> out
```

---

## 3. Preferment pipeline (poolish, biga)

Implemented in [`methods.ts`](../src/lib/fermentation/methods.ts) and
`resolveYeastPercent()` / `prefermentSurplus()` in
[`recipe.ts`](../src/lib/recipe.ts). The numbers are sourced in
[preferments.md §5 and §7](preferments.md#5-how-this-maps-onto-the-existing-model).

```mermaid
flowchart TD
  classDef setting fill:#fff7ed,stroke:#ea580c,color:#7c2d12
  classDef decision fill:#fef9c3,stroke:#ca8a04,color:#713f12
  classDef calc fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
  classDef result fill:#ecfdf5,stroke:#059669,color:#064e3b

  variant[/"Variant<br/>room · fridge · cold · long"/]:::setting
  phases[/"room h + °C, fridge h + °C, order"/]:::setting
  share[/"Share of flour"/]:::setting
  hyd[/"Preferment hydration"/]:::setting
  kitchen[/"Kitchen °C (final dough room °C)"/]:::setting
  demand[/"Final dough demand, from §2"/]:::setting

  fill["variantFields()<br/>a variant fills the fields;<br/>matchVariant() names them back"]:::calc
  massEst["prefermentMassEstimate()<br/>flour × share × (1 + hydration)"]:::calc
  coldFirst{"fridge first, or<br/>no room phase?"}:::decision
  entryWarm["enters the fridge at the mix<br/>temperature (cold biga: 25 °C)"]:::calc
  entryRoom["enters the fridge at its room °C"]:::calc
  equiv["equivalentRoomHours()<br/>room h + cooled fridge h × Q10^((T_cold − T_room)/10)<br/>preferments §7.2"]:::calc
  prefYeast["prefermentYeastPercent()<br/>room curve at the equivalent hours<br/>× 0.8 poolish / 2.8 biga<br/>§5.1, §5.2"]:::calc
  water["prefermentWaterTemp()<br/>base − 2 × kitchen °C, base 55 / 70<br/>§7.4"]:::calc
  supply["leavening the ripe preferment brings<br/>= share × 1.1 poolish / 3 biga<br/>§5.5"]:::calc
  manual{"automatic?"}:::decision
  finalYeast["final yeast = max(0, demand − supply)"]:::calc
  surplusQ{"supply > 1.15 × demand?"}:::decision
  bisect["bisect the room time where<br/>demand = supply"]:::calc
  handYeast["hand-entered final yeast %"]:::calc

  outPref(["Preferment: flour, water, yeast,<br/>water °C, schedule, equivalent hours"]):::result
  outFinal(["Yeast added to the final dough"]):::result
  outWarn(["'Ready early' warning with<br/>a suggested room time"]):::result

  variant --> fill --> phases
  phases --> coldFirst
  coldFirst -->|yes| entryWarm
  coldFirst -->|no| entryRoom
  entryWarm -->|"entry °C"| equiv
  entryRoom -->|"entry °C"| equiv
  share --> massEst
  hyd --> massEst
  massEst -->|"mass → cooling time"| equiv
  phases --> equiv
  equiv -->|"equivalent hours"| prefYeast
  prefYeast --> outPref
  phases --> water
  kitchen --> water
  water --> outPref
  share --> supply
  demand --> manual
  supply --> manual
  manual -->|yes| finalYeast
  manual -->|no| handYeast
  finalYeast --> outFinal
  handYeast --> outFinal
  finalYeast --> surplusQ
  surplusQ -->|yes| bisect --> outWarn
```

---

## 4. Sourdough pipeline

Implemented in [`sourdough.ts`](../src/lib/fermentation/sourdough.ts) and
`resolveStarterPercent()` in [`recipe.ts`](../src/lib/recipe.ts). Sourced in
[preferments.md §4 and §5.6](preferments.md#56-sourdough-as-implemented).

```mermaid
flowchart TD
  classDef setting fill:#fff7ed,stroke:#ea580c,color:#7c2d12
  classDef decision fill:#fef9c3,stroke:#ca8a04,color:#713f12
  classDef calc fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
  classDef result fill:#ecfdf5,stroke:#059669,color:#064e3b

  demand[/"Final dough demand, from §2"/]:::setting
  auto[/"Calculate automatically?"/]:::setting
  manualPct[/"Hand-entered starter %"/]:::setting
  hyd[/"Starter hydration"/]:::setting
  feed[/"Feed h before mixing, feed °C"/]:::setting

  starterFor["starterPercentFor()<br/>starter % = 35 × demand<br/>§5.6"]:::calc
  range{"within 2–50 %<br/>and the recipe's water?"}:::decision
  clampS["clamp, flag too short / too long"]:::calc
  split["starter weight → its flour + water<br/>taken off the final dough"]:::calc
  invert["feedingPlan()<br/>invert peak time =<br/>(0.3 + 2.8·log2 dilution) / 2^((T−24)/6)<br/>round to a whole 1 : n : n"]:::calc
  fits{"peak within tolerance<br/>of the lead time?"}:::decision

  outStarter(["Starter in the final dough"]):::result
  outFeed(["Feed: seed, flour, water, ratio,<br/>+ 20 g to keep"]):::result
  outWarn(["Warnings: schedule too short / long,<br/>feed earlier / later"]):::result

  auto -->|yes| starterFor
  demand --> starterFor
  auto -->|no| manualPct
  starterFor --> range
  manualPct --> range
  range -->|yes| split
  range -->|no| clampS --> split
  clampS --> outWarn
  hyd --> split
  split --> outStarter
  split -->|"starter grams"| invert
  hyd --> invert
  feed --> invert
  invert --> outFeed
  invert --> fits
  fits -->|no| outWarn
```

---

## 5. Timeline and planner

[`RecipeDisplay.tsx`](../src/components/RecipeDisplay.tsx) lays the phases end
to end. In order, they are the preferment's room and fridge phases (in its
chosen order) or the starter feed, then the bulk rise, the fridge, and the
ball proof. With a bake time entered, each step's clock time is the bake time
minus the hours still to go after that step starts. Nothing is stored; the bake
time lives only in the page.
