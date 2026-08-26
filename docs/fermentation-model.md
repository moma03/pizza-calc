# Fermentation model

How this calculator turns a schedule (time + temperature) into a yeast amount,
and how that relates to the formulas normally used for dough fermentation.

Everything below works in **baker's percentages**: flour is 100 %, every other
ingredient is expressed relative to the flour weight.

---

## 1. From percentages to weights

Flour is 100 % by definition, so the sum of all percentages maps the target
dough weight onto the flour weight:

```
flour = totalDough / (100 + water% + salt% + yeast% + oil% + sugar%) × 100
```

and every other ingredient is `flour × its% / 100`. Implemented in
[`src/lib/recipe.ts`](../src/lib/recipe.ts).

`totalDough = numberOfPizzas × doughBallWeight`. There is no allowance for
handling losses — add a few percent to the ball weight if you want a buffer.

---

## 2. The model this app uses

The model is **empirical**: temperature-dependent coefficients were fitted to
observed dough behaviour rather than derived from first principles. It is
implemented in [`src/lib/fermentation/`](../src/lib/fermentation/).

### 2.1 Room-temperature phase

A power law in time, scaled by a temperature coefficient `A(T)`:

```
roomActivity(T, t) = A(T) · t^(−1.45)
```

* `t` — hours at room temperature
* `A(T)` — tabulated for 14–40 °C (`factors.ts`). It falls from `0.33` at 14 °C
  to `0.00265` at 40 °C, i.e. by a factor of ~125 across 26 K.
* The exponent `−1.45` means **doubling the time cuts the yeast to
  `2^(−1.45) ≈ 37 %`**, not to 50 % — long rises are disproportionately
  efficient, because the yeast population grows while it works.

### 2.2 Cold phase

A saturating (Hill-type) curve rather than a power law, because a fridge rest
stops paying off once the dough is thoroughly cold:

```
                        t^k(T)
coldActivity(T, t) = R(T) · ─────────────────────
                       τ^k(T) + t^k(T)
```

* `τ = 9.8233 h` — half-saturation time, i.e. the point where the dough has
  banked half of what the fridge can give it. Physically this is roughly how
  long a dough ball takes to reach fridge temperature all the way through.
* `R(T)` — scale, `0.044` at 4 °C down to `0.035` at 13 °C
* `k(T)` — exponent, `−1.19` at 4 °C to `−1.29` at 13 °C (negative: activity
  decays with time)

### 2.3 Both phases together

The two phases are not additive: dough that has been in the fridge behaves
differently when it comes back out. The model handles this with a tabulated
**combined factor** `C(t_cold, T_cold)` (`combinedFactors.ts`, a 100 × 10 grid
covering 1–100 h and 4–13 °C) plus a piecewise correction `κ`:

```
freshYeastFraction = roomActivity(T_room, t_room) · C(t_cold, T_cold) · κ(t_cold)
```

| cold time      | κ     |
| -------------- | ----- |
| < 5 h          | 1.20  |
| 5 – 13 h       | 1.30  |
| 13 – 20 h      | 1.50  |
| 20 – 35 h      | 1.48  |
| 35 – 50 h      | 1.51  |
| 50 – 60 h      | 1.49  |
| 60 – 80 h      | 1.467 |
| ≥ 80 h         | 1.457 |

Degenerate cases:

* **no fridge** (`t_cold = 0`) → `roomActivity × 1.26`
* **no room time** (`t_room = 0`) → `coldActivity` alone

### 2.4 Yeast type

The result is a fraction of **fresh (cake) yeast**. Other types are scaled by
their dry-matter equivalent:

| type                                | factor vs. fresh |
| ----------------------------------- | ---------------- |
| Fresh / cake yeast                  | 1.00             |
| Active dry yeast (needs rehydrating)| 0.50             |
| Instant dry yeast                   | 0.40             |

So `yeast% = freshYeastFraction × 100 × factor`.

Fresh yeast is roughly 70 % water, which is most of the difference. Active dry
yeast sits between the two because its coarser granules contain a share of dead
cells that act as a protective coat — that is also why it has to be rehydrated
in warm water before use, whereas instant yeast goes straight into the flour.

Published ratios vary a little (fresh : ADY : IDY is quoted anywhere from
3 : 1.5 : 1 to 2.5 : 1.25 : 1); this app uses **2.5 : 1.25 : 1**.

---

## 3. Standard formulas, for cross-checking

These are the general-purpose relations you will find in the literature. They
are *not* what the app computes, but they are the right sanity check.

### 3.1 Arrhenius

The physical-chemistry baseline. Fermentation rate `k` against absolute
temperature `T` (in kelvin):

```
k(T) = A · exp(−Ea / (R · T))
```

so the ratio of two fermentation times at temperatures `T₁`, `T₂` is

```
t₂ / t₁ = exp( Ea/R · (1/T₂ − 1/T₁) )
```

with `R = 8.314 J·mol⁻¹·K⁻¹`. Reported activation energies for yeast growth in
fermentation are on the order of `Ea ≈ 35 000 J·mol⁻¹`
([Phisalaphong et al., *Biochemical Engineering Journal*](https://www.sciencedirect.com/science/article/abs/pii/S1369703X05002834)),
which corresponds to a Q10 slightly above 1.6 near room temperature. Doughs
behave "faster" than that because the yeast population is also growing.

### 3.2 Q10 / van 't Hoff — the practical version

The rule bakers actually use. `Q10` is the factor by which the rate changes per
10 K:

```
rate(T) = Q10 ^ ((T − T_ref) / 10)

t(T) = t_ref / rate(T) = t_ref · Q10 ^ ((T_ref − T) / 10)
```

`Q10 ≈ 2` over roughly 4–30 °C is the usual choice — equivalent to the common
rules of thumb *"fermentation roughly doubles per 10 °C"* and
*"activity doubles per 5 °C"* (the latter implies `Q10 ≈ 4` and is optimistic;
2–3 is the better range for dough).

Worked consequence: a fridge at 4 °C runs at `2^((4−20)/10) = 0.33×` the speed
of a 20 °C room, so **1 h in a 20 °C room ≈ 3 h in the fridge**.

### 3.3 Reference-point fermentation time

Combining the two gives the formula used by most online dough calculators —
anchor one known-good schedule, then scale:

```
t = t_ref · (yeast_ref% / yeast%) / Q10^((T − T_ref) / 10)
```

A widely used anchor is `t_ref = 24 h`, `T_ref = 20 °C`,
`yeast_ref = 0.10 %` instant dry yeast
([PizzaBlab dough calculator](https://www.pizzablab.com/calculators/pizza-dough-calculator/)).

Note this is **inversely proportional** in yeast (halve the yeast, double the
time), whereas §2.1 uses `t^(−1.45)`. The app's exponent is the more
conservative of the two for long rises.

### 3.4 Mixed schedules

For a schedule with several phases, convert each to "equivalent hours at the
reference temperature" and add them up:

```
t_equiv = Σᵢ tᵢ · Q10^((Tᵢ − T_ref) / 10)
```

then feed `t_equiv` into §3.3.

### 3.5 Desired dough temperature (DDT)

Not a fermentation formula, but it is what makes the numbers above reproducible
— the temperature that matters is the **dough's**, not the room's:

```
water temperature = (DDT × N) − flour_temp − room_temp − friction  [− preferment_temp]
```

`N` is the number of temperature terms you are summing (3 for a straight dough:
flour, room, friction; 4 with a preferment). Friction is the heat added by the
mixer — around 1–2 °C for hand kneading, 5–10 °C for a spiral mixer. A typical
pizza DDT is 23–25 °C.

---

## 4. How the two compare

Cross-check of this app against §3.3 with `Q10 = 2` (instant dry yeast, % of
flour), using §3.4 to fold the fridge time into 20 °C-equivalent hours:

| schedule                    | this app | Q10 reference |
| --------------------------- | -------- | ------------- |
| 24 h @ 20 °C, no fridge      | 0.057 %  | 0.100 %       |
| 8 h @ 20 °C, no fridge       | 0.279 %  | 0.300 %       |
| 6 h @ 22 °C, no fridge       | 0.300 %  | 0.348 %       |
| 12 h @ 4 °C + 5 h @ 20 °C    | 0.304 %  | 0.268 %       |
| 24 h @ 4 °C + 5 h @ 20 °C    | 0.251 %  | 0.186 %       |
| 48 h @ 4 °C + 5 h @ 20 °C    | 0.184 %  | 0.115 %       |
| 72 h @ 4 °C + 5 h @ 20 °C    | 0.148 %  | 0.084 %       |

Same order of magnitude throughout, and both land inside the usual practical
band of 0.1–0.5 % IDY. The app is deliberately more generous on long cold
ferments — the simple Q10 model assumes yeast keeps working at a constant
fraction of its warm rate, while in reality a cold dough spends the first
several hours just cooling down (which is exactly what §2.2's saturation term
represents).

**Treat all of this as a starting point.** Flour strength, salt level, actual
fridge temperature and yeast freshness all move the target, and none of them
are inputs here. Judge the dough, not the clock.

---

## 5. The room-temperature schedule

The total room-temperature time entered in the app is split across two phases,
both of which have a floor (see
[`schedule.ts`](../src/lib/fermentation/schedule.ts)):

| phase                          | minimum |
| ------------------------------ | ------- |
| Bulk rise, after kneading      | 2 h     |
| Final proof, after balling     | 3 h     |
| **Minimum total**              | **5 h** |

Anything entered beyond 5 h is surplus. More time in the bulk develops flavour
and gluten; more time in the final proof gives lighter, easier-to-stretch balls.

How the surplus is presented depends on whether there is a cold phase:

* **With a fridge phase**, the two room-temperature phases sit either side of
  it, so the split matters and a slider assigns it. `bulkHours` is chosen in
  `[2, totalRoom − 3]` and the final proof takes the remainder, so the two
  phases account for the whole room-temperature time.
* **Without one**, there is nothing for the split to sit around. Both phases
  hold at their minimum and the generated instructions offer the surplus at
  both ends, since it can be spent on either.

The split does not affect the yeast calculation — §2 depends only on the
*total* time at each temperature, not on how the warm time is divided.

---

---

## 6. Does it matter *where* the warm time happens?

Short answer: in theory no, in practice yes but modestly — and the mechanism is
not the one usually cited.

### 6.1 Why the theory says it cannot matter

Every model in §3 expresses fermentation as a rate that depends only on the
current temperature, so total activity is

```
∫ k(T(t)) dt
```

and an integral does not care about the order of its intervals. 5 h warm → 24 h
cold and 24 h cold → 5 h warm come out **identical**. That is exactly why the
equivalent-hours trick in §3.4 works, and why §2 keys only on totals.

### 6.2 What breaks it: thermal lag

Dough does not jump to fridge temperature. Published retarder measurements:
1.5 kg of dough in two pieces (~750 g each) took **4 h to fall from 24 °C to
10 °C and about 7 h to reach 5 °C**; ~5 h to reach 3–4 °C is the general figure
quoted for room-temperature dough. On a 24 h retard that is a large share of the
time spent well above the nominal temperature.

Cooling rate depends on surface-area-to-volume, so it depends on whether the
dough is one mass or divided balls — and *that* is decided by the order. Fitting
Newton cooling `T(t) = T_fridge + (T_entry − T_fridge)·e^(−t/τ)` to the figures
above gives `τ ≈ 3.3 h` for a 750 g piece. Weighting the curve by `Q10 = 2`:

```
effectiveColdHours = ∫₀ᵗ Q10^((T(s) − T_fridge)/10) ds
```

| 24 h at 4 °C, entering at 21 °C | τ | worth |
| ------------------------------- | --- | ----- |
| one 920 g bulk mass             | 3.7 h | 30.0 h |
| four 230 g balls                | 1.8 h | 27.0 h |
| instant cooling (idealisation)  | — | 24.0 h |

So bulk-retarding banks ~11 % more fermentation than ball-retarding, and *both*
beat the no-lag idealisation by 13–25 %.

τ is extrapolated across masses as `τ ∝ m^(1/2)`. A lumped body (Biot ≪ 1)
scales as `m^(1/3)` and a conduction-limited one (Biot ≫ 1) as `m^(2/3)`; dough
in a domestic fridge sits near Biot ≈ 1, so this uses the geometric mean of the
two limits.

### 6.3 What does *not* break it: yeast population growth

The usual explanation is that a warm phase first grows the cell count, so more
yeast enters the cold phase. The evidence is against it. Bread doughs are
inoculated at ~300 × 10⁶ cells/g with **little or no yeast growth during
fermentation** — osmotic stress (the yeast spends energy producing glycerol just
to avoid dehydrating) plus anaerobic conditions plus short duration.

Caveat: pizza dough at 0.5 % fresh yeast works out to roughly 3.7 × 10⁷ cells/g,
about an eighth of that density, over 24–72 h rather than 30 min–4 h. That is
outside the regime the finding comes from, so some growth is plausible. No study
covering it was found.

### 6.4 What changes anyway

Amylases keep converting starch to sugar in the cold, proteases keep softening
gluten, lactic acid bacteria keep acidifying, and degassing at the divide resets
the bubble structure. All strongly order-dependent, all affecting flavour,
extensibility and crumb — none of them changing how much yeast to weigh out.

### 6.5 How this app implements it

[`thermal.ts`](../src/lib/fermentation/thermal.ts) computes the lag and returns a
factor **relative to a 1 kg reference batch**, because the empirical tables in §2
were themselves fitted on doughs that had a cooling curve. Only the deviation
from that reference is applied:

```
effectiveColdTime = coldHours × effectiveColdHours(mass) / effectiveColdHours(1 kg)
```

and `effectiveColdTime` then replaces the wall-clock time everywhere §2.2 and
§2.3 use it. The mass is the whole batch when the dough is retarded in bulk, or
one ball when it is shaped first.

Resulting change in the yeast figure, for a 4 × 230 g batch:

| schedule | bulk-retarded | ball-retarded |
| -------- | ------------- | ------------- |
| 12 h @ 6 °C + 8 h @ 24 °C | 0.175 % | 0.191 % (+9 %) |
| 24 h @ 4 °C + 5 h @ 20 °C | 0.632 % | 0.659 % (+4 %) |
| 48 h @ 4 °C + 6 h @ 22 °C | 0.251 % | 0.258 % (+3 %) |
| 72 h @ 4 °C + 5 h @ 20 °C | 0.372 % | 0.379 % (+2 %) |

And by batch size, bulk-retarded at 24 h / 4 °C: a single 230 g ball needs ~4 %
more yeast than the 4-pizza reference, a 50-pizza 11.5 kg mass ~17 % less.

Two things to note. The effect is largest for **short** retards, where the
cooling transient is a big fraction of the total — it washes out past ~48 h.
And it is smaller on the yeast figure than on the fermentation itself, because
the combined-factor curve is fairly flat in the 24 h region: an 11 % change in
effective cold time moves the yeast by only ~4 %.

### 6.6 Limits

* No peer-reviewed study directly comparing warm-before against warm-after at
  fixed totals was found — the practical literature is baker guidance, not data.
* The τ fit rests on **one** published cooling measurement. Container material,
  fridge airflow and packing density all move it and none are inputs here.
* The whole correction is smaller than an hour of room-temperature time (§4), so
  it is a refinement, not a headline. It can be switched off, which restores the
  wall-clock estimate exactly.

## Sources

- [Mathematical modeling to investigate temperature effect on kinetic parameters of ethanol fermentation — *Biochemical Engineering Journal*](https://www.sciencedirect.com/science/article/abs/pii/S1369703X05002834)
- [Measurement and mathematical modeling of the relative volume of wheat dough during proofing — *Journal of Food Engineering*](https://www.sciencedirect.com/science/article/abs/pii/S0260877414000247)
- [PizzaBlab — Pizza Dough Calculator (Q10 reference-point method)](https://www.pizzablab.com/calculators/pizza-dough-calculator/)
- [Jordo's Pizza Calculator — Fermentation timing guide](https://jordospizzacalculator.com/guides/fermentation-timing)
- [Weekend Bakery — The Temperature Equation: Timing Your Fermentation](https://www.weekendbakery.com/posts/the-temperature-equation-timing-your-fermentation/)
- [Baker's Yeast Production — Springer](https://link.springer.com/chapter/10.1007/978-94-011-9771-7_7) (inoculation levels, growth during dough fermentation)
- [Glycerol Production by Fermenting Yeast Cells Is Essential for Optimal Bread Dough Fermentation — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4357469/) (osmotic stress)
- [Pyler — Understanding proofing and retarding, Baking Business](https://www.bakingbusiness.com/articles/39656-pyler-says-understanding-proofing-and-retarding)
- [Cooling and freezing — Class of Foods](http://www.classofoods.com/page2_4.html) (dough cooling rates)
- [Degree of proof before retarding @ 4 °C, an experiment — The Fresh Loaf](https://www.thefreshloaf.com/node/57400/degree-proof-retarding-4-deg-c-experiment) (measured cooling curve)
- [ChainBaker — Cold bulk fermentation](https://www.chainbaker.com/cold-fermentation/)
