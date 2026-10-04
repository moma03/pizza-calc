# pizza-calc docs

How the calculator works, why every number in it is what it is, and where it
comes from. The code links back here: comments say `See docs/<file>.md §n`
wherever a function is written the way it is for a reason explained below.

| Page | What it covers |
|---|---|
| [calculation-pipeline.md](calculation-pipeline.md) | **Start here.** Diagrams of the whole calculation: settings, decisions and calculations as nodes, the data passed between them as edges. Also the recipe link, calendar and print export. |
| [fermentation-model.md](fermentation-model.md) | The yeast model for the final dough: room power law, cold Hill curve, combined factors, thermal lag of the fridge phase, cross-checks against Q10 and Arrhenius. |
| [preferments.md](preferments.md) | Biga, poolish and sourdough: the research, schedules and recipes from the sources, and how each was calibrated onto the model — including cold and long preferments, water temperature, share presets and the bake-time planner. |

## Where to look for…

| Question | Section |
|---|---|
| How grams come out of percentages | [fermentation-model §1](fermentation-model.md#1-from-percentages-to-weights) |
| Why yeast falls so fast with time | [fermentation-model §2.1](fermentation-model.md#21-room-temperature-phase) |
| Why bulk vs balls changes the yeast | [fermentation-model §6](fermentation-model.md#6-does-it-matter-where-the-warm-time-happens) |
| Poolish and biga yeast factors | [preferments §5.1–5.2](preferments.md#51-the-room-curve-already-predicts-poolish) |
| How much yeast the final dough still gets | [preferments §5.5](preferments.md#55-as-implemented) |
| Cold biga, fridge poolish, the 48 h biga | [preferments §7](preferments.md#7-cold-and-long-preferments) |
| Sourdough starter amount and feeding | [preferments §5.6](preferments.md#56-sourdough-as-implemented) |
| One page per method and language | [preferments §10](preferments.md#10-search-one-page-per-method) |
| How recipe links survive changes to defaults or the model | [calculation-pipeline §7](calculation-pipeline.md#7-keeping-old-links-working) |
