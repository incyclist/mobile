import { getGestureHintContent } from './gestureHintContent';
import { LARGE_LOAD_INCREMENT } from '../../hooks/ride/useRideGestures';

describe('getGestureHintContent', () => {

    test('workoutAttached: workout message/legendIntro + step-back/forward and load-% legend rows',()=>{
        const content = getGestureHintContent({ workoutAttached: true, loadButtonMode: 'power', loadIncrementPct: 1 });

        expect(content?.message).toBe('Start pedalling to start the workout');
        expect(content?.legendIntro).toBe('Swipe the screen to control your workout:');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '◀ ▶', label: 'Step back / forward' }),
            expect.objectContaining({ symbol: '▲ ▼', label: 'Load ±1%' }),
        ]);
    });

    test('workoutAttached wins over loadButtonMode regardless of its value',()=>{
        const content = getGestureHintContent({ workoutAttached: true, loadButtonMode: 'gear', loadIncrementPct: 5 });

        expect(content?.legend[1].label).toBe('Load ±5%');
    });

    // Regression: legendIntro/message previously defaulted to the component's workout-flavoured
    // copy ("Swipe the screen to control your workout") for every mode, including a plain
    // (no-workout) ride, which made no sense there - there is no workout to control.
    test('no workout, ERG mode: resistance message/legendIntro, small (up/down) and big (left/right) legend rows',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'power', loadIncrementPct: 1 });

        expect(content?.message).toBe('Start pedalling to start your ride');
        expect(content?.legendIntro).toBe('Swipe the screen to adjust your resistance:');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '▲ ▼', label: 'Power ±5W' }),
            expect.objectContaining({ symbol: '◀ ▶', label: `Power ±50W` }),
        ]);
    });

    test('no workout, ERG mode: nominal 50W step for any loadIncrement other than 1 (up/down row only)',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'power', loadIncrementPct: 5 });

        expect(content?.legend[0].label).toBe('Power ±50W');
    });

    test('no workout, gear mode: gear legend using the raw loadIncrement for up/down, LARGE_LOAD_INCREMENT for left/right',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'gear', loadIncrementPct: 5 });

        expect(content?.message).toBe('Start pedalling to start your ride');
        expect(content?.legendIntro).toBe('Swipe the screen to adjust your resistance:');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '▲ ▼', label: 'Gear ±5' }),
            expect.objectContaining({ symbol: '◀ ▶', label: `Gear ±${LARGE_LOAD_INCREMENT}` }),
        ]);
    });

    test('no workout, hidden mode: null - nothing useful to teach',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'hidden', loadIncrementPct: 1 });

        expect(content).toBeNull();
    });

    test('no workout, undefined loadButtonMode (e.g. no device yet): null',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: undefined, loadIncrementPct: 1 });

        expect(content).toBeNull();
    });
});
