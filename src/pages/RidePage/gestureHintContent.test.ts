import { getGestureHintContent } from './gestureHintContent';

describe('getGestureHintContent', () => {

    test('workoutAttached: workout message + step-back/forward and load-% legend rows',()=>{
        const content = getGestureHintContent({ workoutAttached: true, loadButtonMode: 'power', loadIncrementPct: 1 });

        expect(content?.message).toBe('Start pedalling to start the workout');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '◀ ▶', label: 'Step back / forward' }),
            expect.objectContaining({ symbol: '▲ ▼', label: 'Load ±1%' }),
        ]);
    });

    test('workoutAttached wins over loadButtonMode regardless of its value',()=>{
        const content = getGestureHintContent({ workoutAttached: true, loadButtonMode: 'gear', loadIncrementPct: 5 });

        expect(content?.legend[1].label).toBe('Load ±5%');
    });

    test('no workout, ERG mode: power legend with the nominal 5W step for loadIncrement=1',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'power', loadIncrementPct: 1 });

        expect(content?.message).toBe('Start pedalling to begin your ride');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '▲ ▼', label: 'Power ±5W' }),
        ]);
    });

    test('no workout, ERG mode: nominal 50W step for any loadIncrement other than 1',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'power', loadIncrementPct: 5 });

        expect(content?.legend[0].label).toBe('Power ±50W');
    });

    test('no workout, gear mode: gear legend using the raw loadIncrement value directly (not the nominal Watt step)',()=>{
        const content = getGestureHintContent({ workoutAttached: false, loadButtonMode: 'gear', loadIncrementPct: 5 });

        expect(content?.message).toBe('Start pedalling to begin your ride');
        expect(content?.legend).toEqual([
            expect.objectContaining({ symbol: '▲ ▼', label: 'Gear ±5' }),
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
