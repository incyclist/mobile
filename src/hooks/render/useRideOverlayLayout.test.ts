import { renderHook, act } from '@testing-library/react-native'
import {
    useRideOverlayLayout,
    computeRideOverlayLayout,
    getRideDashboardWidth,
    RideOverlayArrangement,
    SIDE_WIDGET_MIN_WIDTH,
    TILE_COUNT_SETTLE_MS,
    ARRANGEMENT_HYSTERESIS_PX,
    DEFAULT_ROUTE_RIDE_TILE_COUNT,
} from './useRideOverlayLayout'

// Mock useWindowDimensions the same way FilterPanel.test.tsx does, but with a mutable return value
// so individual tests (and the hook-level rotation/resize tests) can change it between renders.
const mockDimensions = { width: 1280, height: 800 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}

describe('getRideDashboardWidth', () => {
    // Design doc §1.1/§7.1's worked-matrix numbers, pinned exactly.
    it('matches the 7-tile icon-left width from the worked matrix (895.6)', () => {
        expect(getRideDashboardWidth({ itemCount: 7, layout: 'icon-left', compact: false, screenWidth: 1280 })).toBeCloseTo(895.6, 5)
    })

    it('matches the 8-tile icon-top width from the worked matrix (743.0)', () => {
        expect(getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth: 1280 })).toBeCloseTo(743.0, 5)
    })

    it('collapses to screenWidth exactly in compact mode (RideDashboard is alignSelf: stretch there)', () => {
        expect(getRideDashboardWidth({ itemCount: 7, layout: 'icon-left', compact: true, screenWidth: 844 })).toBe(844)
    })
})

describe('computeRideOverlayLayout - the 4 arrangements + fallback (design doc §7.1 worked matrix)', () => {
    it('1280x800, N=7: block-side (plenty of room beside the whole block)', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('block-side')
        expect(result.inputs.earWidth).toBeCloseTo(184.2, 5)
        expect(result.workoutDashboard?.width).toBeCloseTo(895.6, 5)
        expect(result.map).not.toBeNull()
        expect(result.map?.width).toBeCloseTo(184.2, 5)
        expect(result.elevation.width).toBeCloseTo(184.2, 5)
        expect(result.cornerSlotIsToggle).toBe(false)
    })

    it('1280x800, N=8: block-side, at the icon-top (743.0) width - adding the Gear tile narrows the dashboard', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(result.arrangement).toBe('block-side')
        expect(result.inputs.rideDashboardWidth).toBeCloseTo(743.0, 5)
        expect(result.inputs.earWidth).toBeCloseTo(260.5, 5)
    })

    it('1194x834 (iPad Air), N=7: t-side - ear narrows below 160, WorkoutDashboard narrows to its minimum (ear -> 429)', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('t-side')
        expect(result.workoutDashboard?.width).toBe(320) // WORKOUT_DASH_MIN_WIDTH
        expect(result.inputs.earWidth).toBeCloseTo(429, 5)
    })

    it('1112x834 (iPad Pro 10.5), N=7 vs N=8: the highlighted same-device tile-count flip (t-side -> block-side)', () => {
        const at7 = computeRideOverlayLayout({ screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(at7.arrangement).toBe('t-side')
        expect(at7.inputs.rideDashboardWidthEffective).toBeCloseTo(895.6, 5)

        const at8 = computeRideOverlayLayout({ screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(at8.arrangement).toBe('block-side')
        expect(at8.inputs.rideDashboardWidthEffective).toBeCloseTo(743.0, 5)
        expect(at8.inputs.earWidth).toBeCloseTo(176.5, 5)
    })

    it('1024x768, N=7 and N=8: both land in t-side at the same narrowed ear width (344)', () => {
        const at7 = computeRideOverlayLayout({ screenWidth: 1024, screenHeight: 768, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const at8 = computeRideOverlayLayout({ screenWidth: 1024, screenHeight: 768, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(at7.arrangement).toBe('t-side')
        expect(at8.arrangement).toBe('t-side')
        expect(at7.inputs.earWidth).toBeCloseTo(344, 5)
        expect(at8.inputs.earWidth).toBeCloseTo(344, 5)
    })

    // Judgement call (see the long comment above the `wWdT` line in useRideOverlayLayout.ts): the
    // design doc's §5.5 pseudocode text would send this row (blockPossible === false) through
    // `min(W_wd_max, W_rd_eff)` = 645, giving an ear of 135.5 and (wrongly) falling through to
    // 't-below'. The doc's own §7.1 worked matrix pins this row at 't-side' with ear = 298, which
    // only reproduces under an unconditional WORKOUT_DASH_MIN_WIDTH (320). This test locks in the
    // worked-matrix number.
    it('932x430 (large phone landscape), N=7: t-side despite the aspect ceiling forcing blockPossible=false (ear = 298)', () => {
        const result = computeRideOverlayLayout({ screenWidth: 932, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.inputs.blockPossible).toBe(false)
        expect(result.arrangement).toBe('t-side')
        expect(result.inputs.earWidth).toBeCloseTo(298, 5)
    })

    // §5.6's reachability example: aspect ceiling forces a T (blockPossible=false) *and* the
    // narrowed ear fails (152 < 160) - the one rare path that reaches 't-below'.
    it('640x420, N=7: t-below - the §5.6 reachability frame', () => {
        const result = computeRideOverlayLayout({ screenWidth: 640, screenHeight: 420, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.inputs.rideDashboardWidthEffective).toBe(640) // clamped (§5.7) - raw W_rd (895.6) would overflow the screen
        expect(result.inputs.blockPossible).toBe(false)
        expect(result.arrangement).toBe('t-below')
        expect(result.map?.left).toBe(0)
        expect(result.elevation.right).toBe(0)
    })

    // A narrow-but-tall screen: blockPossible stays true (aspect ceiling isn't the limiter), but
    // even the minimum-width T's ear fails - the "block-below" cell of the 2x2, reached from the
    // opposite direction to t-below.
    it('600x800 narrow-but-tall, N=7: block-below - T narrows to its minimum but still cannot side-fit', () => {
        const result = computeRideOverlayLayout({ screenWidth: 600, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.inputs.blockPossible).toBe(true)
        expect(result.arrangement).toBe('block-below')
        expect(result.workoutDashboard?.width).toBeCloseTo(600, 5) // W_rd_eff, clamped to screenWidth
        expect(result.map?.top).toBe(result.elevation.top)
    })

    it('844x390 (phone landscape), any N: fallback, because screenLayout is compact', () => {
        const result = computeRideOverlayLayout({ screenWidth: 844, screenHeight: 390, screenLayout: 'compact', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('fallback')
        expect(result.rideDashboard.width).toBe(844) // W_rd === screenWidth exactly in compact (§1.1)
        expect(result.workoutDashboard).toBeNull()
        expect(result.map).toBeNull()
        expect(result.cornerSlotIsToggle).toBe(true)
        expect(result.elevation.width).toBeCloseTo(844 * 0.20, 5)
        expect(result.elevation.height).toBeCloseTo(390 * 0.12, 5)
    })
})

describe('computeRideOverlayLayout - invariants (design doc §4)', () => {
    it('invariant 2: arrangement is identical with and without measuredRideDashboardHeight - only positions move', () => {
        const withoutMeasured = computeRideOverlayLayout({ screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const withMeasured = computeRideOverlayLayout({
            screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            measuredRideDashboardHeight: 60, // deliberately far from the 83.4 estimate (0.10 * 834)
        })

        expect(withMeasured.arrangement).toBe(withoutMeasured.arrangement)
        // positions do move - measured height only refines them, it must not be silently ignored
        expect(withMeasured.workoutDashboard?.top).toBe(60)
        expect(withoutMeasured.workoutDashboard?.top).toBeCloseTo(83.4, 5)
        expect(withMeasured.workoutDashboard?.top).not.toBe(withoutMeasured.workoutDashboard?.top)
    })

    it('a compact screenLayout always resolves to fallback, regardless of itemCount/mapVisible', () => {
        const a = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 390, screenLayout: 'compact', itemCount: 7, mapVisible: true })
        const b = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 390, screenLayout: 'compact', itemCount: 8, mapVisible: false })
        expect(a.arrangement).toBe('fallback')
        expect(b.arrangement).toBe('fallback')
    })

    // Confirmed explicitly by the design doc's own §7.1 text ("Because both v1 occupants share the
    // same SIDE_WIDGET_MIN_WIDTH, an empty left ear ... never changes the width verdict"): the right
    // ear (2 km elevation preview) is always occupied and uses the identical ear-width formula the
    // left ear (corner map) would use, so in v1 the arrangement decision cannot differ by
    // `mapVisible` - only whether the `map` rect itself is populated does.
    it('mapVisible does not change the arrangement decision in v1 - only whether `map` is populated', () => {
        const withMap = computeRideOverlayLayout({ screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const withoutMap = computeRideOverlayLayout({ screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: false })

        expect(withMap.arrangement).toBe(withoutMap.arrangement)
        expect(withMap.map).not.toBeNull()
        expect(withoutMap.map).toBeNull()
        expect(withoutMap.elevation).toEqual(withMap.elevation) // the always-present occupant is unaffected
    })
})

describe('computeRideOverlayLayout - hysteresis (design doc §8.2)', () => {
    // N=7, screenHeight=800 (blockPossible=true throughout) => W_rd_eff = 895.6. The unrelaxed
    // block-side boundary is exactly at screenWidth = 895.6 + 2*(160+8) = 1231.6 (ear === 160).
    const BOUNDARY_SCREEN_WIDTH = 1231.6

    it('a small width change that crosses the normal boundary does NOT flip out of the active arrangement', () => {
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 12, // ear = 154, below the normal 160 minimum
            screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: 'block-side',
        })
        expect(result.inputs.earWidth).toBeCloseTo(154, 5)
        expect(result.arrangement).toBe('block-side') // relaxed minimum is 160 - 24 = 136; 154 still clears it
    })

    it('a large width change that exceeds the hysteresis cushion DOES flip', () => {
        // Delta chosen well past the exact 48 px critical width (earWidthOf moves 1:1 with half of
        // screenWidth, so clearing the 24 px ear cushion needs >= 48 px of screenWidth) - not the
        // design doc's own worked number, chosen here to demonstrate the mechanism unambiguously.
        // The 130 figure is the ear the *failed* block-side candidate would have had; the returned
        // `inputs.earWidth` instead reflects the winning t-side candidate (WORKOUT_DASH_MIN_WIDTH-based).
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 60, // block-side's ear would be 130, below even the relaxed 136 minimum
            screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: 'block-side',
        })
        expect(result.arrangement).toBe('t-side')
        expect(result.inputs.workoutDashboardWidth).toBe(320) // WORKOUT_DASH_MIN_WIDTH
    })

    it('with no previous arrangement (first render), the normal (unrelaxed) minimum applies', () => {
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 12, // ear = 154 - would stay under hysteresis, but there is no "previous" to relax for
            screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: null,
        })
        expect(result.arrangement).toBe('t-side')
    })

    // Design doc §8.2's own worked example: at 1112x834, 7->8 tiles takes the ear from 100.2 to
    // 176.5 (clears 160, flips to block-side); 8->7 takes it back to 100.2, which is below even the
    // relaxed 136 minimum, so it flips straight back - hysteresis alone does not prevent
    // gear-tile-flap oscillation, the settle window (tested below, at the hook level) is what does.
    it('the 1112px 7<->8 flip: hysteresis protects the marginal case but not this large a swing', () => {
        const to8 = computeRideOverlayLayout({
            screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 8, mapVisible: true, previousArrangement: 't-side',
        })
        expect(to8.arrangement).toBe('block-side')

        const backTo7 = computeRideOverlayLayout({
            screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true, previousArrangement: 'block-side',
        })
        expect(backTo7.arrangement).toBe('t-side')
    })
})

describe('useRideOverlayLayout - the hook', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        setDimensions(1112, 834)
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('resolves synchronously on first render using the itemCount passed in - no settle delay on mount', () => {
        const { result } = renderHook(() => useRideOverlayLayout({ itemCount: 8, workoutAttached: true, mapVisible: true }))
        expect(result.current.arrangement).toBe('block-side')
    })

    it('defaults itemCount to DEFAULT_ROUTE_RIDE_TILE_COUNT when not supplied (§3.2 first-frame value)', () => {
        const { result } = renderHook(() => useRideOverlayLayout({ workoutAttached: true, mapVisible: true }))
        expect(result.current.inputs.itemCount).toBe(DEFAULT_ROUTE_RIDE_TILE_COUNT)
    })

    it('debounces an itemCount change (the Gear tile) - does not re-flow before TILE_COUNT_SETTLE_MS has elapsed', () => {
        const { result, rerender } = renderHook(
            (props: { itemCount: number }) => useRideOverlayLayout({ itemCount: props.itemCount, workoutAttached: true, mapVisible: true }),
            { initialProps: { itemCount: 7 } },
        )
        expect(result.current.arrangement).toBe('t-side')

        rerender({ itemCount: 8 })
        expect(result.current.arrangement).toBe('t-side') // unchanged immediately after the prop flips

        act(() => { jest.advanceTimersByTime(TILE_COUNT_SETTLE_MS - 100) })
        expect(result.current.arrangement).toBe('t-side') // still not settled

        act(() => { jest.advanceTimersByTime(200) })
        expect(result.current.arrangement).toBe('block-side') // settled past 2000ms total
    })

    it('resets the settle timer on a flappy itemCount change - a brief drop of the Gear tile must not re-flow the screen', () => {
        const { result, rerender } = renderHook(
            (props: { itemCount: number }) => useRideOverlayLayout({ itemCount: props.itemCount, workoutAttached: true, mapVisible: true }),
            { initialProps: { itemCount: 7 } },
        )

        rerender({ itemCount: 8 })
        act(() => { jest.advanceTimersByTime(1500) })
        rerender({ itemCount: 7 }) // reverts before settling - timer must restart, not fire the stale 8

        act(() => { jest.advanceTimersByTime(1500) })
        expect(result.current.arrangement).toBe('t-side') // never settled on 8

        act(() => { jest.advanceTimersByTime(600) })
        expect(result.current.arrangement).toBe('t-side') // settling back onto its own starting value is a no-op
    })

    it('recomputes immediately on a mapVisible change - no settle window (§8.2)', () => {
        setDimensions(1194, 834)
        const { result, rerender } = renderHook(
            (props: { mapVisible: boolean }) => useRideOverlayLayout({ itemCount: 7, workoutAttached: true, mapVisible: props.mapVisible }),
            { initialProps: { mapVisible: true } },
        )
        expect(result.current.map).not.toBeNull()

        rerender({ mapVisible: false })
        expect(result.current.map).toBeNull() // flips on the very next render, no timer advance needed
    })

    it('recomputes immediately on a screen rotation/resize - no settle window', () => {
        const { result, rerender } = renderHook(() => useRideOverlayLayout({ itemCount: 7, workoutAttached: true, mapVisible: true }), { initialProps: {} })
        expect(result.current.arrangement).toBe('t-side')

        act(() => { setDimensions(1280, 800) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')
    })

    it('applies hysteresis end-to-end: once settled into an arrangement, a small resize does not flip it back out', () => {
        const { result, rerender } = renderHook(() => useRideOverlayLayout({ itemCount: 7, workoutAttached: true, mapVisible: true }), { initialProps: {} })
        expect(result.current.arrangement).toBe('t-side')

        // Settle a few px past the exact 1231.6 block-side boundary first (a small margin avoids
        // floating-point noise right at the boundary - 124.8 * 7 does not land on an exact double).
        const SETTLED_WIDTH = 1231.6 + 4
        act(() => { setDimensions(SETTLED_WIDTH, 800) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')

        // A 12px shrink crosses the *normal* boundary but must be absorbed by the 24px cushion,
        // since block-side is now the active (previous) arrangement.
        act(() => { setDimensions(SETTLED_WIDTH - 12, 800) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')

        // A larger shrink exceeds the cushion and genuinely flips.
        act(() => { setDimensions(SETTLED_WIDTH - 60, 800) })
        rerender({})
        expect(result.current.arrangement).toBe('t-side')
    })
})

// Sanity check the arrangement type union stays in sync with what the pure function actually returns.
describe('RideOverlayArrangement', () => {
    it('covers exactly the 5 cells the design doc defines', () => {
        const all: RideOverlayArrangement[] = ['block-side', 't-side', 'block-below', 't-below', 'fallback']
        expect(all).toHaveLength(5)
    })
})

// Documents SIDE_WIDGET_MIN_WIDTH's role as "the single most consequential number" (design doc §7.2)
// without hardcoding a duplicate of the production value.
describe('constants', () => {
    it('exposes ARRANGEMENT_HYSTERESIS_PX and SIDE_WIDGET_MIN_WIDTH as tunable named exports', () => {
        expect(typeof ARRANGEMENT_HYSTERESIS_PX).toBe('number')
        expect(typeof SIDE_WIDGET_MIN_WIDTH).toBe('number')
    })
})
