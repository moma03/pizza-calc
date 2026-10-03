# Preferments: biga, poolish and sourdough

Research notes for adding indirect doughs to the calculator. Today the app only
knows the **direct** method: all the yeast goes into one dough. A preferment
moves part of the flour, water and leavening into an earlier, separate
fermentation, and the final dough is built on top of it.

Everything here is in baker's percentages. Two percentages need keeping apart:

* **preferment share** — flour in the preferment ÷ total flour of the recipe
* **preferment yeast** — yeast ÷ flour *in the preferment* (not the total)

The total hydration, salt etc. stay relative to the **total** flour, so the
preferment's flour and water are subtracted from what goes into the final mix.

---

## 1. Overview

| | Biga | Poolish | Sourdough |
|---|---|---|---|
| Hydration of the preferment | 44–45 % classic, 50–60 % cold | 100 % | 100 % (liquid) or 50 % (stiff) |
| Leavening | 1 % fresh yeast | 0.1–2.5 % fresh yeast, by time | the starter itself |
| Share of total flour | 30–100 %, often 30–50 % | 25–35 %, up to 50 % | 5–20 % starter (AVPN), 15–25 % common |
| Classic schedule | 16–18 h at 16–18 °C | 8–16 h at 20–22 °C | starter peaks, then dough 4–24 h |
| Consistency | crumbly, shaggy, not kneaded | batter | depends on hydration |
| Ripe when | ~20 % growth, mildly alcoholic | domed, 2–3×, just before it dips | starter at peak, doubled or more |
| Character | strength, open crumb, crisp | extensibility, mild sweet aroma | acidity, complex flavour |

---

## 2. Biga

Codified by Piergiorgio Giorilli: strong flour (W 300+), **44–45 % water,
1 % fresh yeast** (≈ 0.33–0.4 % dry), mixed only until the water is taken up —
small uniform crumbs, *not* a smooth dough.

### 2.1 Biga schedules

| Variant | Hydration | Fresh yeast (of biga flour) | Mix temp. | Fermentation |
|---|---|---|---|---|
| Classic | 44–45 % | 1 % | ~21 °C | 16–18 h at 17–18 °C |
| Cold (*biga fredda*) | ~50 % (up to 60 %) | 0.7–1 % | 25–26 °C | 24–48 h in the fridge (or ≥ 24 h at 10 °C) |
| Long, controlled | 40–42 % | 0.3–0.7 % | — | 24 h at 4 °C, then 24 h at 18–20 °C |
| Long, room | 50 % | 0.1–0.2 % | — | 24 h at room temperature |
| Short | 60 % | 1.5–2 % | — | 6–10 h at room temperature |

Water temperature to hit the mix temperature (hand mixing, no friction term):

* classic: `water °C = 55 − (room °C + flour °C)`
* cold:    `water °C = 70 − (room °C + flour °C)`

The cold biga is mixed *warm* on purpose: it starts fermenting on the way down,
which is exactly the thermal-lag effect the app already models for the fridge
phase ([fermentation-model.md §6](fermentation-model.md#6-does-it-matter-where-the-warm-time-happens)).

Home-recipe sources quote much less yeast (≈ 0.1 % instant for 18–24 h at
16–18 °C, i.e. ≈ 0.25 % fresh). The professional 1 % figure assumes strong
flour and a cool, controlled 16–18 °C. A warmer kitchen needs much less, so
the calculator should derive the yeast from time and temperature, not hard-code 1 %.

**Ripe biga:** grown by only about 20 %, crumbs visibly puffed, a mild
alcoholic and fruity-sour smell (pH ≈ 5.2–5.3). Doubling in size or a sharp
smell means it is overripe.

### 2.2 Final dough with biga

1. Tear the biga into small pieces (a lump will not incorporate).
2. Mix the biga with most of the remaining water (optionally ~1 % malt),
   slow speed, ~5 min.
3. Add the remaining flour, then the **salt**. Add the last water a little at
   a time (*bassinage*) until the dough is smooth. Aim for a final dough
   temperature of **23–24 °C**.
4. Extra yeast: usually **none at 50–100 % biga**. At 20–30 % biga a small
   dose in the final dough is common.
5. Bulk (*puntata*): **15–60 min**, short, because the biga brings a mature yeast
   population.
6. Divide and ball (*staglio*).
7. Ball proof (*appretto*): **1–2 h at room temperature for 100 % biga**,
   longer with less biga. Alternatively 1 h at room temperature, then into the fridge.

Example, 100 % biga, 66 % total hydration, 6 × 280 g (Gozney):
biga 1000 g flour + 450 g water + 10 g fresh yeast, 16–18 h at 16–18 °C →
add 210 g cold water, 25 g salt, 10 g malt.

---

## 3. Poolish

Equal weights of flour and water (100 % hydration) plus a little yeast. The
yeast amount is set entirely by how long the poolish should take to ripen.

### 3.1 Yeast vs. time at 20–22 °C

Fresh yeast, % of poolish flour (Italian reference table):

| Time to ripe | 1–2 h | 4–5 h | 6–7 h | 8–9 h | 10–12 h | 13–14 h | 15–16 h |
|---|---|---|---|---|---|---|---|
| Fresh yeast | 2.5 % | 1.5 % | 1 % | 0.5 % | 0.3 % | 0.2 % | 0.1 % |

Other sources agree within about a factor of 2. For instant yeast, 0.2 / 0.1 /
0.07 % at 8 / 12 / 16 h is roughly 0.5 / 0.25 / 0.18 % fresh. A 20 °C kitchen
needs about a quarter more, 22 °C about a fifth less.

Overnight in the fridge: 1 h at room temperature, then 12–18 h cold. A ripe
poolish holds up to ~24 h in the fridge; let it warm 30–60 min before mixing.

**Ripe poolish:** domed, very bubbly, 2–3× its volume, fruity and slightly
sweet. Once the dome flattens or dips it is past peak but still usable.
Collapsed, watery and harshly sour means overripe.

### 3.2 Final dough with poolish

1. Loosen the poolish in the remaining water.
2. Add the remaining flour and any extra yeast, mix.
3. Add salt, knead as usual.
4. Ball proof as usual, at room temperature or cold for 24–72 h.

Example, 30 % poolish for 1 kg flour: poolish 300 g flour + 300 g water +
0.3 g instant yeast; main dough 700 g flour + 350 g water + 2.7 g instant yeast.

---

## 4. Sourdough (lievito madre / Sauerteig)

The starter supplies both yeast and lactic acid bacteria. Two decisions need
making: **when to feed the starter** so it peaks at mixing time, and **how much
starter** (inoculation) the dough's schedule needs.

### 4.1 Starter feeding

Ratio = starter : flour : water. Time to peak:

| Ratio | ~21–22 °C | ~24 °C |
|---|---|---|
| 1:1:1 | 4–6 h | 4.5–5 h |
| 1:2:2 | 6–8 h | 5–5.5 h |
| 1:5:5 | 10–14 h | ~10 h |

Rule of thumb: every ~5.5 °C warmer roughly halves the time, every ~5.5 °C
cooler roughly doubles it.

### 4.2 Inoculation vs. time and temperature

Bulk to ~50–75 % rise, white flour, 100 % hydration starter:

| Dough temp. | 10 % starter | 20 % starter | 30 % starter |
|---|---|---|---|
| 18 °C | 10–12 h | 7–9 h | 5–7 h |
| 21 °C | 7–9 h | 5–7 h | 3–5 h |
| 24 °C | 5–6 h | 3–5 h | 2–3 h |
| 27 °C | 3–4 h | 2–3 h | 1.5–2 h |

* Pizza practice: **15–25 % starter** for same-day or overnight cold (20 %
  default). 5–10 % gives a lighter, less bready crust. **~3 %** works for 24 h at
  23 °C. AVPN allows 5–20 %.
* Typical cold schedule: ~4 h at 24 °C, ball, 20–48 h at 4–5 °C, then 60–90 min
  out of the fridge before baking.
* The starter's flour and water count toward the total flour and hydration.

Some charts multiply the bulk time ×2 when halving the starter. That is too
simple. The starter's microbes grow exponentially, so halving the inoculum
costs about **one extra doubling time**, not twice the whole time:

```
t(I) ≈ t(I_ref) + t_double(T) · log2(I_ref / I)
```

The table above fits this form: going from 20 % to 10 % at 21 °C adds ~2 h.

---

## 5. How this maps onto the existing model

### 5.1 The room curve already predicts poolish

The app's room-temperature curve,
`yeast % = A(T) · t^(−1.45) · 1.26`, compared with the poolish table above at 21 °C:

| Time | Model | Poolish table | Ratio |
|---|---|---|---|
| 4.5 h | 1.42 % | 1.5 % | 1.05 |
| 6.5 h | 0.84 % | 1.0 % | 1.20 |
| 8.5 h | 0.57 % | 0.5 % | 0.88 |
| 11 h | 0.39 % | 0.3 % | 0.77 |
| 13.5 h | 0.29 % | 0.2 % | 0.69 |
| 15.5 h | 0.24 % | 0.1 % | 0.42 |

Between 4 and 14 h the model sits within ±25 % of the poolish table, and against
fond.kitchen's instant-yeast figures it is a steady ~0.8×. Beyond ~14 h the
sources diverge by 2× among themselves. So the poolish phase can **reuse
`roomActivity` with a fitted factor of ≈ 0.8**, with no new curve needed.

### 5.2 Biga needs about 3× more

Classic biga (1 % fresh, 17 h at 18 °C) against the same curve: the model gives
0.35 %, so biga needs **≈ 2.8–3.9×** the direct-dough figure. This is expected:
at 44 % hydration yeast is water-limited and ferments much more slowly, and the
ripeness target is earlier. Use a hydration-dependent factor, calibrated to
≈ 2.8 at 45 % and falling towards 1 at 60 %.

### 5.3 Sourdough needs its own solver

The output is not a yeast weight but a **starter share**, and its time
dependence is logarithmic (§4.2), not a power law. The model is:

* doubling time `t_double(T) = t_double(24 °C) · 2^((24 − T) / 5.5)`, with
  `t_double(24 °C)` fitted to the §4.2 table (≈ 2 h)
* solve for the inoculation `I` that brings the room phases to the target rise
* reuse the existing cold-phase/thermal-lag correction, scaled by the same
  temperature law
* and output the feeding plan (§4.1): pick the ratio whose peak time best
  matches the gap between "feed" and "mix"

### 5.4 Two-stage pipeline

Every indirect method becomes two stages that share the existing schedule
building blocks:

```
stage 1: preferment   share %, hydration %, leavening, time, temp, (fridge?)
            ↓ ripe
stage 2: final dough  bulk (short) → [fridge: bulk or balls] → ball proof → bake
```

* Stage 2 reuses the current room/cold/balling logic unchanged. Only the
  minimum bulk time falls, because the preferment brings ripe yeast: biga
  15–60 min instead of 2 h.
* The timeline bar gets a stage-1 segment before the knead.
* Ingredient output splits into two cards: **preferment** and **final dough**.
* Recipe input gains `method: 'direct' | 'biga' | 'poolish' | 'sourdough'` plus
  a small per-method block. Style presets get a sensible default per method,
  e.g. Neapolitan + poolish 30 %, Roman + biga 100 %.

### 5.5 As implemented

The numbers live in [`src/lib/fermentation/methods.ts`](../src/lib/fermentation/methods.ts):

| | Poolish |
|---|---|
| Yeast factor on the room curve | 0.8 |
| Ripe yeast equivalent (fresh %, of preferment flour) | 1.5 |
| Minimum bulk / ball proof of the final dough | 1 h / 3 h |
| Share, default (range) | 30 % (10–50) |
| Ripening, default (range) | 12 h (3–18) at 20 °C (15–28) |

**Final-dough yeast.** The final dough gets whatever its own schedule needs
under the direct model, minus what the ripe preferment brings
(`share × ripe yeast equivalent`), and never less than zero. For poolish,
the published recipes disagree. Some add no yeast at all to a 30 % poolish
dough (≈ 2 %); others add a full direct dough's worth (≈ 0 %). 1.5 % sits
between them. With the defaults (30 % poolish, 24 h fridge), that adds about
0.18 % fresh yeast to the final dough, against 0.63 % for the same schedule
done direct.

**Surplus.** When the preferment alone brings more than 1.15× what the
schedule needs, nothing is added. The page then shows the room time that would
match the preferment (found by bisection on the model), or says that even the
shortest schedule is too long.

---

## 6. Search: one page per method

Each method is a search term in its own right ("biga calculator", "poolish
pizza dough", "Sauerteig Pizza Rechner"). Each gets its own prerendered URL,
in both languages, opening the calculator in that mode with a short
method-specific guide underneath:

| Method | English | German |
|---|---|---|
| Direct (yeast) | `/` | `/de/` |
| Biga | `/biga/` | `/de/biga/` |
| Poolish | `/poolish/` | `/de/poolish/` |
| Sourdough | `/sourdough/` | `/de/sauerteig/` |

The route table lives in [`src/routes.ts`](../src/routes.ts); adding a method
means adding a row there and its texts to the locale files.

---

## Sources

* [Giochi di Gusto — How to make biga at home](https://www.giochidigusto.it/en/how-to-make-biga-at-home-the-complete-and-definitive-method/)
* [Arte Bianca con Rita — biga classica o biga fredda](https://www.artebiancaconrita.com/post/la-biga-caratteristiche-procedura-e-tempi-per-biga-classica-o-biga-fredda)
* [Consultapizza — Gli impasti indiretti con biga](https://www.consultapizza.com/2018/10/08/gli-impasti-indiretti-con-biga/)
* [PizzaBlab — Biga preferment guide](https://www.pizzablab.com/the-encyclopizza/biga-preferment/)
* [Gozney — 100 % biga pizza dough](https://us.gozney.com/blogs/recipes/100-biga-pizza-dough-recipe)
* [Jordo's — Biga pizza dough](https://jordospizzacalculator.com/guides/biga-pizza-dough)
* [fond.kitchen — Poolish](https://fond.kitchen/glossary/poolish/)
* [PizzaBlab — Poolish](https://www.pizzablab.com/the-encyclopizza/poolish/)
* [Weekend Bakery — Poolish & biga](https://www.weekendbakery.com/posts/more-artisan-bread-baking-tips-poolish-biga/)
* [sourdoughratio.com — Proofing time by temperature](https://sourdoughratio.com/blog/proofing-time-by-temperature)
* [sourdoughratio.com — Starter feeding ratios](https://sourdoughratio.com/guides/starter-feeding-ratio)
* [mypizzanight.com — Sourdough pizza calculator guide](https://mypizzanight.com/guides/sourdough-pizza-calculator)
* [fond.kitchen — Neapolitan pizza dough (AVPN)](https://fond.kitchen/guides/pizza-dough/neapolitan-pizza-dough/)
