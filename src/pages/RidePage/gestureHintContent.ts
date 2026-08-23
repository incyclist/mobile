import type { LoadButtonMode } from 'incyclist-services';
import type { RideGestureHintLegendItem } from '../../components/RideGestureHintOverlay/types';

export interface GestureHintContent {
    message: string;
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
const nominalErgWatts = (loadIncrementPct: number) => (loadIncrementPct === 1 ? 5 : 50);

/**
 * Computes the swipe-gesture education overlay's message/legend for the ride's current mode -
 * shared by the Workout, GPX, and Video ride screens so the three don't drift into subtly
 * different copy for what is, per mode, the exact same gesture behaviour
 * (`RidePageService.adjustLoad()`/`onStepBack()`/`onStepForward()` already branch on this same
 * state, not on which screen called them).
 *
 * Returns `null` when there's nothing useful to teach: `loadButtonMode==='hidden'` (SIM/Resistance
 * without virtual shifting) with no workout attached means up/down has no effect at all, and
 * left/right never does anything without a workout either - showing a hint would just be noise.
 */
export const getGestureHintContent = ({ workoutAttached, loadButtonMode, loadIncrementPct }: GestureHintContentProps): GestureHintContent | null => {
    if (workoutAttached) {
        return {
            message: 'Start pedalling to start the workout',
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

    if (loadButtonMode === 'power') {
        const watts = nominalErgWatts(loadIncrementPct);
        return {
            message: 'Start pedalling to begin your ride',
            legend: [
                {
                    symbol: '▲ ▼',
                    label: `Power ±${watts}W`,
                    description: `Swipe up or down to raise or lower your ERG power target by ${watts}W`,
                },
            ],
        };
    }

    if (loadButtonMode === 'gear') {
        return {
            message: 'Start pedalling to begin your ride',
            legend: [
                {
                    symbol: '▲ ▼',
                    label: `Gear ±${loadIncrementPct}`,
                    description: `Swipe up or down to shift gear by ${loadIncrementPct}`,
                },
            ],
        };
    }

    return null;
};
