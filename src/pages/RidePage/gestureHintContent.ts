import type { LoadButtonMode } from 'incyclist-services';
import type { RideGestureHintLegendItem } from '../../components/RideGestureHintOverlay/types';
import { LARGE_LOAD_INCREMENT } from '../../hooks/ride/useRideGestures';

export interface GestureHintContent {
    message: string;
    legendIntro: string;
    legend: RideGestureHintLegendItem[];
}

export interface GestureHintContentProps {
    /** RidePageService.isWorkoutAttached() - true for a Workout ride, or a Video/GPX ride with a
     *  workout attached. */
    workoutAttached?: boolean;
    /** RidePageService.getLoadButtonMode() - what the up/down swipe currently does, independent of
     *  whether a workout is attached (cycling-mode-driven, §4.4.5). */
    loadButtonMode?: LoadButtonMode;
    /** Live `preferences.workouts.loadIncrement` setting. */
    loadIncrementPct: number;
}

// getPowerRangeDeltaVal()'s convention (incyclist-services, WorkoutRideService) for the nominal
// Watt step a plain ERG-mode swipe actually applies (RidePageService.adjustLoad() ->
// RideDisplayService.adjustDevicePower()) - kept in sync manually since it isn't exported.
const nominalErgWatts = (magnitude: number) => (magnitude === 1 ? 5 : 50);

/**
 * Computes the swipe-gesture education overlay's message/legend for the ride's current mode -
 * shared by the Workout, GPX, and Video ride screens so the three don't drift into subtly
 * different copy for what is, per mode, the exact same gesture behaviour
 * (`RidePageService.adjustLoad()`/`onStepBack()`/`onStepForward()` already branch on this same
 * state, not on which screen called them).
 *
 * Returns `null` when there's nothing useful to teach: `loadButtonMode==='hidden'` (SIM/Resistance
 * without virtual shifting) with no workout attached means up/down AND left/right both have no
 * effect at all - showing a hint would just be noise.
 */
export const getGestureHintContent = ({ workoutAttached, loadButtonMode, loadIncrementPct }: GestureHintContentProps): GestureHintContent | null => {
    if (workoutAttached) {
        return {
            message: 'Start pedalling to start the workout',
            legendIntro: 'Swipe the screen to control your workout:',
            legend: [
                {
                    symbol: '◀ ▶',
                    label: 'Step back / forward',
                    description: 'Swipe left or right to step back or forward through the workout',
                },
                {
                    symbol: '▲ ▼',
                    label: `Load ±${loadIncrementPct}%`,
                    description: `Swipe up or down to raise or lower your target load by ${loadIncrementPct}%`,
                },
            ],
        };
    }

    // No workout attached: left/right performs a "big" load adjustment (useRideGestures.ts's
    // LARGE_LOAD_INCREMENT), on top of up/down's fine one - the same two-tier "small"/"big" idea a
    // workout's own inc1/inc5 buttons already offer, just mapped onto swipe direction instead of a
    // separate button, since there's no workout step list here for left/right to mean anything else.
    if (loadButtonMode === 'power') {
        const watts = nominalErgWatts(loadIncrementPct);
        const bigWatts = nominalErgWatts(LARGE_LOAD_INCREMENT);
        return {
            message: 'Start pedalling to start your ride',
            legendIntro: 'Swipe the screen to adjust your resistance:',
            legend: [
                {
                    symbol: '▲ ▼',
                    label: `Power ±${watts}W`,
                    description: `Swipe up or down to raise or lower your ERG power target by ${watts}W`,
                },
                {
                    symbol: '◀ ▶',
                    label: `Power ±${bigWatts}W`,
                    description: `Swipe left or right for a bigger adjustment: ±${bigWatts}W`,
                },
            ],
        };
    }

    if (loadButtonMode === 'gear') {
        return {
            message: 'Start pedalling to start your ride',
            legendIntro: 'Swipe the screen to adjust your resistance:',
            legend: [
                {
                    symbol: '▲ ▼',
                    label: `Gear ±${loadIncrementPct}`,
                    description: `Swipe up or down to shift gear by ${loadIncrementPct}`,
                },
                {
                    symbol: '◀ ▶',
                    label: `Gear ±${LARGE_LOAD_INCREMENT}`,
                    description: `Swipe left or right for a bigger adjustment: ±${LARGE_LOAD_INCREMENT} gears`,
                },
            ],
        };
    }

    return null;
};
