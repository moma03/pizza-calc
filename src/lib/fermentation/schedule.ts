import { clampToRange, type Range } from '../math';

/**
 * The room-temperature part of the schedule is split across two phases: a bulk
 * rise straight after kneading, and a final proof once the dough has been
 * balled. Each phase has a minimum below which the dough simply is not ready.
 */
export interface RoomMinimums {
  /** Shortest bulk rise, in hours. */
  readonly bulk: number;
  /** Shortest final proof of the balls, in hours. */
  readonly ballProof: number;
}

/** Minimums for a dough leavened with yeast alone. */
export const DIRECT_ROOM_MINIMUMS: RoomMinimums = { bulk: 2, ballProof: 3 };

export const MIN_BULK_HOURS = DIRECT_ROOM_MINIMUMS.bulk;
export const MIN_BALL_PROOF_HOURS = DIRECT_ROOM_MINIMUMS.ballProof;
export const MIN_ROOM_HOURS = MIN_BULK_HOURS + MIN_BALL_PROOF_HOURS;

export const minRoomHours = (minimums: RoomMinimums): number =>
  minimums.bulk + minimums.ballProof;

export interface RoomSchedule {
  /** Room-temperature hours before the fridge. */
  readonly bulkHours: number;
  /** Room-temperature hours after the fridge, before baking. */
  readonly ballProofHours: number;
  /**
   * Surplus beyond the two minimums that has not been assigned to a phase, and
   * so can go into either. Always 0 once a split has been chosen.
   */
  readonly extraHours: number;
}

/** How far the bulk phase can be pushed given the total room-temperature time. */
export const bulkHoursRange = (
  totalRoomHours: number,
  minimums: RoomMinimums = DIRECT_ROOM_MINIMUMS
): Range => ({
  min: minimums.bulk,
  max: Math.max(minimums.bulk, totalRoomHours - minimums.ballProof),
});

/**
 * Split the total room-temperature time into the two phases.
 *
 * With a `bulkHours` split chosen, the two phases account for the whole room
 * time. Without one — there is no cold phase to plan around — both phases sit
 * at their minimum and the surplus is reported separately, for the caller to
 * offer at either end.
 */
export const splitRoomFermentation = (
  totalRoomHours: number,
  bulkHours?: number,
  minimums: RoomMinimums = DIRECT_ROOM_MINIMUMS
): RoomSchedule => {
  if (bulkHours === undefined) {
    return {
      bulkHours: minimums.bulk,
      ballProofHours: minimums.ballProof,
      extraHours: Math.max(0, totalRoomHours - minRoomHours(minimums)),
    };
  }

  const bulk = clampToRange(bulkHours, bulkHoursRange(totalRoomHours, minimums));

  return {
    bulkHours: bulk,
    ballProofHours: Math.max(minimums.ballProof, totalRoomHours - bulk),
    extraHours: 0,
  };
};
