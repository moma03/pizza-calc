import { clamp, type Range } from '../math';
import { DIRECT_ROOM_MINIMUMS, type RoomMinimums } from './schedule';
import { Q10, effectiveColdHours } from './thermal';
import { YEAST_CONVERSION, freshYeastFraction, type YeastType } from './yeast';

/**
 * How the dough is leavened. `direct` puts all the yeast into one dough; the
 * others ferment part of the flour first, as a preferment the final dough is
 * then built on. Every number below is sourced in `docs/preferments.md`.
 */
export type Method = 'direct' | 'poolish' | 'biga' | 'sourdough';

export const METHODS: readonly Method[] = ['direct', 'poolish', 'biga', 'sourdough'];

/** Preferments leavened with commercial yeast. Sourdough has its own model, in `sourdough.ts`. */
export type PrefermentMethod = 'poolish' | 'biga';

export const isPrefermentMethod = (method: Method): method is PrefermentMethod =>
  method === 'poolish' || method === 'biga';

interface Setting {
  readonly default: number;
  readonly range: Range;
}

/**
 * When and where a preferment ripens: some hours at room temperature, some in
 * the fridge, either way round. A classic biga is all room, a cold biga all
 * fridge, a long biga fridge then room (docs/preferments.md §7.1).
 */
export interface PrefermentSchedule {
  readonly roomHours: number;
  readonly roomTempC: number;
  readonly coldHours: number;
  readonly coldTempC: number;
  /** The fridge phase comes first, straight after mixing. */
  readonly coldFirst: boolean;
}

/** A named starting point for a preferment's schedule, offered as a sub-option. */
export interface PrefermentVariant {
  readonly id: string;
  readonly schedule: PrefermentSchedule;
  /** Preferment hydration this variant is made at, when it differs from the method's default. */
  readonly hydration?: number;
}

export interface PrefermentProfile {
  /** Flour in the preferment, in percent of the recipe's total flour. */
  readonly share: Setting;
  /** One-click shares offered next to the field (docs/preferments.md §8). */
  readonly sharePresets: readonly number[];
  /** Water in the preferment, in percent of the preferment's own flour. */
  readonly hydration: Setting;
  /** Hours at room temperature, and in the fridge. */
  readonly roomHours: Range;
  readonly coldHours: Range;
  /** Shortest total ripening time, in hours. */
  readonly minTotalHours: number;
  readonly roomTemp: Range;
  readonly coldTemp: Range;
  /** Sub-options; the first one is the default. */
  readonly variants: readonly PrefermentVariant[];
  /**
   * Multiplier on the direct-dough room-temperature curve that gives the
   * yeast for ripening the preferment in the same time. Fitted to published
   * yeast-vs-time tables (docs/preferments.md §5.1, §5.2).
   */
  readonly yeastFactor: number;
  /**
   * The leavening a ripe preferment brings into the final dough, as fresh
   * yeast in percent of the preferment's flour. The final dough only gets the
   * yeast its own schedule needs beyond this (docs/preferments.md §5.5).
   */
  readonly ripeYeastEquivalent: number;
  /**
   * Temperature the preferment is mixed to when it goes straight into the
   * fridge; undefined means it is mixed at room temperature.
   */
  readonly coldMixTempC?: number;
  /**
   * Base temperatures for the water rule `water = base − (room + flour)`,
   * room-first and fridge-first; undefined when no water temperature is given
   * (docs/preferments.md §7.4).
   */
  readonly waterTempBase?: { readonly roomFirst: number; readonly coldFirst: number };
  /** Shortest bulk rise and ball proof of the final dough. */
  readonly roomMinimums: RoomMinimums;
  /**
   * The final dough's schedule this method opens with, when the style
   * presets' would not suit it. All hours.
   */
  readonly schedule?: { readonly room: number; readonly bulk: number; readonly cold: number };
  /** Ripening times for the yeast table on the method's page. */
  readonly tableHours: readonly number[];
}

const roomOnly = (hours: number, tempC: number): PrefermentSchedule => ({
  roomHours: hours,
  roomTempC: tempC,
  coldHours: 0,
  coldTempC: 4,
  coldFirst: false,
});

export const PREFERMENTS: Record<PrefermentMethod, PrefermentProfile> = {
  /**
   * Equal flour and water. Against the Italian poolish table and the
   * instant-yeast figures, the direct-dough curve sits at a median ratio of
   * 0.8 between 4 and 16 h (docs/preferments.md §5.1).
   */
  poolish: {
    share: { default: 30, range: { min: 10, max: 50 } },
    sharePresets: [20, 30, 40, 50],
    hydration: { default: 100, range: { min: 100, max: 100 } },
    roomHours: { min: 0, max: 24 },
    coldHours: { min: 0, max: 48 },
    minTotalHours: 3,
    roomTemp: { min: 15, max: 28 },
    coldTemp: { min: 4, max: 13 },
    variants: [
      // The Italian reference table's middle row: 12 h at 20–22 °C.
      { id: 'room', schedule: roomOnly(12, 20) },
      // An hour to get going, then overnight in the fridge (12–18 h).
      {
        id: 'fridge',
        schedule: { roomHours: 1, roomTempC: 20, coldHours: 16, coldTempC: 4, coldFirst: false },
      },
    ],
    yeastFactor: 0.8,
    // Median of four published recipes, which range 0.3–2.0 (docs/preferments.md §5.5).
    ripeYeastEquivalent: 1.1,
    roomMinimums: { bulk: 1, ballProof: 3 },
    tableHours: [4, 6, 8, 10, 12, 16],
  },
  /**
   * Stiff and crumbly. The room curve has to be scaled ×2.8 to reproduce the
   * classic Giorilli biga — 1 % fresh yeast for 16–18 h at 18 °C — which fits
   * yeast being water-limited at 45 % hydration (docs/preferments.md §5.2).
   */
  biga: {
    share: { default: 50, range: { min: 20, max: 100 } },
    sharePresets: [30, 50, 75, 80, 100],
    hydration: { default: 45, range: { min: 40, max: 60 } },
    roomHours: { min: 0, max: 48 },
    coldHours: { min: 0, max: 72 },
    minTotalHours: 8,
    roomTemp: { min: 15, max: 25 },
    coldTemp: { min: 4, max: 13 },
    variants: [
      // Giorilli: 44–45 %, 1 % fresh, 16–18 h at 16–18 °C.
      { id: 'classic', schedule: roomOnly(17, 18) },
      // Biga fredda: ~50 %, closed at 25–26 °C, 24–48 h in the fridge.
      {
        id: 'cold',
        hydration: 50,
        schedule: { roomHours: 0, roomTempC: 18, coldHours: 24, coldTempC: 4, coldFirst: true },
      },
      // Lunga maturazione controllata: 40–42 %, 24 h at 4 °C, then 24 h at 18–20 °C.
      {
        id: 'long',
        hydration: 42,
        schedule: { roomHours: 24, roomTempC: 18, coldHours: 24, coldTempC: 4, coldFirst: true },
      },
    ],
    yeastFactor: 2.8,
    // A 100 % biga dough needs no added yeast for a final rise of 2.5–3 h at
    // 20–22 °C, which the direct model puts at 2.5–2.9 % fresh yeast.
    ripeYeastEquivalent: 3,
    // A cold biga is closed warm so it gets going before the fridge slows it.
    coldMixTempC: 25,
    waterTempBase: { roomFirst: 55, coldFirst: 70 },
    // Puntata of 15–60 min, then an appretto of 1–2 h for a full biga, which
    // may also be 1 h before the balls go into the fridge (docs/preferments.md §2.2).
    roomMinimums: { bulk: 0.5, ballProof: 1 },
    schedule: { room: 3, bulk: 0.5, cold: 24 },
    tableHours: [8, 12, 16, 18, 24],
  },
};

export const roomMinimumsFor = (method: Method): RoomMinimums =>
  isPrefermentMethod(method) ? PREFERMENTS[method].roomMinimums : DIRECT_ROOM_MINIMUMS;

export const totalHours = ({ roomHours, coldHours }: PrefermentSchedule): number =>
  roomHours + coldHours;

/** Whether the preferment goes into the fridge straight after mixing. */
export const startsCold = ({ coldFirst, roomHours, coldHours }: PrefermentSchedule): boolean =>
  coldHours > 0 && (coldFirst || roomHours <= 0);

/**
 * Temperature the preferment goes into the fridge at: its mix temperature when
 * the fridge comes first, otherwise the room it has been standing in.
 */
const fridgeEntryTemp = (method: PrefermentMethod, schedule: PrefermentSchedule): number =>
  startsCold(schedule)
    ? PREFERMENTS[method].coldMixTempC ?? schedule.roomTempC
    : schedule.roomTempC;

/**
 * Hours at the preferment's room temperature that its whole schedule is worth.
 *
 * The fridge hours are first weighted by the cooling curve (a warm preferment
 * keeps working for hours on the way down), then converted to room-temperature
 * hours with the same Q10 the cooling model uses. The direct dough's combined
 * room/cold tables are not used: they were fitted to doughs with at least 5 h
 * of room time and run away for a preferment with one hour or none
 * (docs/preferments.md §7.2).
 */
export const equivalentRoomHours = (
  method: PrefermentMethod,
  schedule: PrefermentSchedule,
  massG: number
): number => {
  const { roomHours, roomTempC, coldHours, coldTempC } = schedule;
  if (coldHours <= 0) return roomHours;

  const coldAtFridgeTemp = effectiveColdHours(
    coldHours,
    massG,
    coldTempC,
    fridgeEntryTemp(method, schedule)
  );
  return roomHours + coldAtFridgeTemp * Q10 ** ((coldTempC - roomTempC) / 10);
};

/**
 * Yeast for the preferment itself, in percent of the preferment's flour, for
 * the given yeast type: the direct-dough room curve at the schedule's
 * equivalent room time, scaled by the method's fitted factor.
 */
export const prefermentYeastPercent = (
  method: PrefermentMethod,
  yeastType: YeastType,
  schedule: PrefermentSchedule,
  massG: number
): number =>
  freshYeastFraction({
    roomTempC: schedule.roomTempC,
    roomTimeHours: Math.max(equivalentRoomHours(method, schedule, massG), 0.5),
    coldTempC: schedule.coldTempC,
    coldTimeHours: 0,
  }) *
  100 *
  PREFERMENTS[method].yeastFactor *
  YEAST_CONVERSION[yeastType];

/**
 * Water temperature that brings a preferment to its target mix temperature,
 * by the bakers' rule `water = base − (room + flour)` with the flour at room
 * temperature (docs/preferments.md §7.4). Undefined for methods without one.
 */
export const prefermentWaterTemp = (
  method: PrefermentMethod,
  schedule: PrefermentSchedule,
  kitchenTempC: number
): number | undefined => {
  const base = PREFERMENTS[method].waterTempBase;
  if (!base) return undefined;
  return clamp((startsCold(schedule) ? base.coldFirst : base.roomFirst) - 2 * kitchenTempC, 2, 40);
};

/** The variant a schedule matches exactly, or undefined for a custom one. */
export const matchVariant = (
  method: PrefermentMethod,
  schedule: PrefermentSchedule,
  hydration: number
): PrefermentVariant | undefined =>
  PREFERMENTS[method].variants.find(
    ({ schedule: preset, hydration: presetHydration }) =>
      preset.roomHours === schedule.roomHours &&
      preset.coldHours === schedule.coldHours &&
      (schedule.roomHours <= 0 || preset.roomTempC === schedule.roomTempC) &&
      (schedule.coldHours <= 0 || preset.coldTempC === schedule.coldTempC) &&
      (schedule.roomHours <= 0 || schedule.coldHours <= 0 || preset.coldFirst === schedule.coldFirst) &&
      (presetHydration ?? PREFERMENTS[method].hydration.default) === hydration
  );
