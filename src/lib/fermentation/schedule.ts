import { clampToRange, type Range } from '../math';

/**
 * The room-temperature part of the schedule is split across two phases: a bulk
 * rise straight after kneading, and a final proof once the dough has been
 * balled. Each phase has a minimum below which the dough simply is not ready.
 */
export const MIN_BULK_HOURS = 2;
export const MIN_BALL_PROOF_HOURS = 3;
export const MIN_ROOM_HOURS = MIN_BULK_HOURS + MIN_BALL_PROOF_HOURS;

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
export const bulkHoursRange = (totalRoomHours: number): Range => ({
  min: MIN_BULK_HOURS,
  max: Math.max(MIN_BULK_HOURS, totalRoomHours - MIN_BALL_PROOF_HOURS),
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
  bulkHours?: number
): RoomSchedule => {
  if (bulkHours === undefined) {
    return {
      bulkHours: MIN_BULK_HOURS,
      ballProofHours: MIN_BALL_PROOF_HOURS,
      extraHours: Math.max(0, totalRoomHours - MIN_ROOM_HOURS),
    };
  }

  const bulk = clampToRange(bulkHours, bulkHoursRange(totalRoomHours));

  return {
    bulkHours: bulk,
    ballProofHours: Math.max(MIN_BALL_PROOF_HOURS, totalRoomHours - bulk),
    extraHours: 0,
  };
};
