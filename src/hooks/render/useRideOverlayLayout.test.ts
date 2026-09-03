import { renderHook, act } from '@testing-library/react-native'
import {
    useRideOverlayLayout,
    computeRideOverlayLayout,
    getRideDashboardWidth,
    fitsSideBySide,
    buildSideRects,
    RideOverlayArrangement,
    SIDE_WIDGET_MIN_WIDTH,
    TILE_COUNT_SETTLE_MS,
    ARRANGEMENT_HYSTERESIS_PX,
    DEFAULT_ROUTE_RIDE_TILE_COUNT,
    WORKOUT_DASH_MIN_WIDTH,
    RIDE_DASH_HEIGHT_RATIO,
    SLOT_GAP,
    belowSlotWidthOf,
} from './useRideOverlayLayout'

// Retuned by session 4.1 (the Wave 4 prototype) - see `RideOverlayPrototype.stories.tsx` and HLD
// §8. Two things changed that these tests had to follow:
//  - the constants (SIDE_WIDGET_MIN_WIDTH 160 -> 200, WORKOUT_DASH_MIN_WIDTH 320 -> 480, the
//    WorkoutDashboard height model, and the removal of the aspect ceiling);
//  - the cascade's shape: the T no longer narrows WorkoutDashboard to its floor to buy ear width.
//    Ears get their floor first and the dashboard takes the rest, so the T is shallow rather than
//    narrow, and 'block-below'/'t-below' merged into one arrangement.
//
// Session 4.1 also made that merged arrangement DROP the corner widgets ('column-only') rather than
// relocate them. That was wrong - it blanked map, elevation preview and nearby riders on any tablet
// under the side-fit threshold - and is reverted: the merged arrangement is 'below', and it places
// the widgets beneath the column. 'column-only' remains only as the terminal "no vertical room at
// all" case, which no landscape non-compact frame reaches (see the spec suite at the end).

const mockDimensions = { width: 1280, height: 800 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}

describe('getRideDashboardWidth', () => {
    // Design doc §1.1/§7.1's worked-matrix numbers, pinned exactly. Unaffected by the retune.
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

// Exported post-Wave-6 for VideoRidePageView/GPXTourPageView's route-only (no workout attached)
// corner-widget placement — real-device finding: the old measured-width heuristic kept stacking
// map/elevation below RideDashboard even when there was genuinely room beside it. These reuse the
// exact same fit-check/sizing the combo overlay's block-side arrangement already uses.
describe('fitsSideBySide / buildSideRects - exported for route-only reuse', () => {
    // Worked numbers from the getRideDashboardWidth tests above, at screenWidth 1280: the 7-tile
    // icon-left dashboard (895.6 wide) leaves only a 184.2 ear (below the 200 floor) - the exact
    // non-monotonic-width case ride-overlay-layout-design.md §1.2 documents. The 8-tile icon-top
    // dashboard that replaces it once the Gear tile appears (743.0 wide) leaves a 260.5 ear instead
    // - wide enough. This is the real-device transition the bug report described.
    it('7-tile icon-left dashboard at 1280 width: ear (184.2) is below the floor - does not fit', () => {
        const w = getRideDashboardWidth({ itemCount: 7, layout: 'icon-left', compact: false, screenWidth: 1280 })
        expect(fitsSideBySide(1280, 800, w)).toBe(false)
    })

    it('8-tile icon-top dashboard at 1280 width: ear (260.5) clears the floor - fits', () => {
        const w = getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth: 1280 })
        expect(fitsSideBySide(1280, 800, w)).toBe(true)
    })

    it('buildSideRects positions the map at left:0 and elevation at right:0, both top:0', () => {
        const w = getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth: 1280 })
        const { map, elevation } = buildSideRects(1280, 800, w, 0, true)
        expect(map).toMatchObject({ top: 0, left: 0 })
        expect(elevation).toMatchObject({ top: 0, right: 0 })
        expect(map!.width).toBeGreaterThanOrEqual(SIDE_WIDGET_MIN_WIDTH)
    })

    it('buildSideRects omits the map rect when mapVisible is false', () => {
        const w = getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth: 1280 })
        const { map } = buildSideRects(1280, 800, w, 0, false)
        expect(map).toBeNull()
    })

    it('a very narrow screen: neither tile count leaves room beside the dashboard', () => {
        const w = getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth: 700 })
        expect(fitsSideBySide(700, 500, w)).toBe(false)
    })
})

describe('computeRideOverlayLayout - the arrangements', () => {
    // `block-side` needs the ears to clear their floor beside the FULL-width dashboard, i.e.
    // screenWidth >= W_rd_eff + 2*(200 + 8): 1311.6 at 7 tiles, 1159.0 at 8.
    it('1400x900, N=7: block-side - the ears clear their floor beside the whole block', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('block-side')
        expect(result.workoutDashboard?.width).toBeCloseTo(895.6, 5)
        expect(result.inputs.earWidth).toBeCloseTo(244.2, 5)
        expect(result.map).not.toBeNull()
        expect(result.map?.top).toBe(0) // beside the whole block, from the top of the screen
        expect(result.cornerSlotIsToggle).toBe(false)
    })

    it('1280x800, N=7: t-side - a SHALLOW T (864 wide), not the old narrow 320 one', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('t-side')
        expect(result.workoutDashboard?.width).toBe(864) // 1280 - 2*(200+8)
        expect(result.inputs.earWidth).toBe(200) // exactly the floor, by construction
        expect(result.workoutDashboard?.width).toBeLessThan(result.inputs.rideDashboardWidthEffective)
    })

    it('1194x834 (iPad Air), N=7: t-side at 778 wide, ears at their floor', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1194, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('t-side')
        expect(result.workoutDashboard?.width).toBe(778)
        expect(result.inputs.earWidth).toBe(200)
        expect(result.map?.top).toBeCloseTo(91.4, 5) // below RideDashboard's bottom edge (0.10*834 + 8)
    })

    it('1024x768, N=7 and N=8: both t-side, and at the same geometry - the tile count cannot reach it', () => {
        const at7 = computeRideOverlayLayout({ screenWidth: 1024, screenHeight: 768, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const at8 = computeRideOverlayLayout({ screenWidth: 1024, screenHeight: 768, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(at7.arrangement).toBe('t-side')
        expect(at8.arrangement).toBe('t-side')
        expect(at7.workoutDashboard?.width).toBe(608)
        expect(at8.workoutDashboard?.width).toBe(608)
    })

    it('932x430 (large phone landscape), N=7: t-side - the old aspect ceiling no longer forces anything', () => {
        const result = computeRideOverlayLayout({ screenWidth: 932, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('t-side')
        expect(result.workoutDashboard?.width).toBe(516)
        expect(result.inputs.earWidth).toBe(200)
    })

    // Below the 't-side' floor: screenWidth < 2*(200+8) + 480 = 896. Every frame here is landscape
    // (width > height) - the app is orientation-locked to landscape (`Loader.tsx`), so a portrait
    // frame is not a state it can be in and must not be used to justify an arrangement.
    it('640x430, N=7: below - no side arrangement fits, so the widgets relocate under the column', () => {
        const result = computeRideOverlayLayout({ screenWidth: 640, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.inputs.rideDashboardWidthEffective).toBe(640) // clamped (§5.7) - raw W_rd (895.6) would overflow
        expect(result.arrangement).toBe('below')
        expect(result.workoutDashboard?.width).toBe(640) // matches the (clamped) dashboard
        // Relocated, NOT dropped: the widgets sit beneath the whole column, splitting the screen.
        expect(result.map).not.toBeNull()
        expect(result.elevation).not.toBeNull()
        expect(result.map?.left).toBe(0)
        expect(result.elevation?.right).toBe(0)
        expect(result.elevation?.top).toBeGreaterThan(result.workoutDashboard!.top)
    })

    it('860x480, N=7: below as well, just under the t-side floor', () => {
        const result = computeRideOverlayLayout({ screenWidth: 860, screenHeight: 480, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('below')
        expect(result.workoutDashboard?.width).toBeCloseTo(860, 5)
        expect(result.elevation).not.toBeNull()
    })

    it('the below row is bounded by half the screen, not by the leftover side region', () => {
        const result = computeRideOverlayLayout({ screenWidth: 640, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        // The column is clamped to the full 640, so there is no ear at all - yet the below row still
        // has room, because it splits the screen rather than the remainder beside the column.
        expect(result.inputs.earWidth).toBe(belowSlotWidthOf(640))
        expect(result.elevation!.width).toBeLessThanOrEqual(belowSlotWidthOf(640))
    })

    it('844x390 (phone landscape), any N: fallback, because screenLayout is compact', () => {
        const result = computeRideOverlayLayout({ screenWidth: 844, screenHeight: 390, screenLayout: 'compact', itemCount: 7, mapVisible: true })
        expect(result.arrangement).toBe('fallback')
        expect(result.rideDashboard.width).toBe(844) // W_rd === screenWidth exactly in compact (§1.1)
        expect(result.workoutDashboard).toBeNull()
        expect(result.map).toBeNull()
        expect(result.cornerSlotIsToggle).toBe(true)
        expect(result.elevation?.width).toBeCloseTo(844 * 0.20, 5)
        expect(result.elevation?.height).toBeCloseTo(390 * 0.12, 5)
    })
})

describe('computeRideOverlayLayout - widget sizing (session 4.1)', () => {
    // Before the retune every ear occupant rendered at exactly SIDE_WIDGET_MIN_*, which made the
    // elevation preview visibly smaller than on today's route-only screen (96 px tall vs 160).
    it('renders ear occupants at today`s route-only proportions when the ear allows it', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.elevation?.width).toBeCloseTo(210, 5) // 0.15 * 1400
        expect(result.elevation?.height).toBeCloseTo(180, 5) // 0.20 * 900
    })

    it('never renders an ear occupant below its floor, or wider than the ear it sits in', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.elevation?.width).toBe(SIDE_WIDGET_MIN_WIDTH) // 0.15*1280 = 192 would be below the floor
        expect(result.elevation?.width as number).toBeLessThanOrEqual(result.inputs.earWidth as number)
    })

    it('keeps WorkoutDashboard`s height budget at ~1.5x RideDashboard`s, not 3x (HLD §6.2)', () => {
        const result = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(result.workoutDashboard?.height).toBe(120) // 0.15 * 800, against RideDashboard's 0.10 * 800 = 80
    })

    it('clamps WorkoutDashboard`s height on very short and very tall screens', () => {
        const short = computeRideOverlayLayout({ screenWidth: 1024, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const tall = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 1200, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        expect(short.workoutDashboard?.height).toBe(100) // floor - the widget's own intrinsic height
        expect(tall.workoutDashboard?.height).toBe(160) // ceiling - its content does not grow with the screen
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

    // The design doc's §5.3 claimed an empty left ear would let a side arrangement fit at widths
    // where it otherwise couldn't. It cannot, and §7.1 says so itself: both v1 occupants share the
    // same floor, and the ears are symmetric, so the right ear alone decides. Session 4.1 dropped
    // `mapVisible` from the fit test entirely (behaviour-identical) - it now only decides whether
    // the `map` rect is populated.
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
    // N=7 => W_rd_eff = 895.6, so the unrelaxed block-side boundary is at
    // 895.6 + 2*(200+8) = 1311.6 (ear === 200 exactly).
    const BOUNDARY_SCREEN_WIDTH = 1311.6

    it('a small width change that crosses the normal boundary does NOT flip out of the active arrangement', () => {
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 12, // ear = 194, below the normal 200 floor
            screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: 'block-side',
        })
        expect(result.inputs.earWidth).toBeCloseTo(194, 5)
        expect(result.arrangement).toBe('block-side') // relaxed floor is 200 - 24 = 176; 194 still clears it
    })

    it('a large width change that exceeds the hysteresis cushion DOES flip', () => {
        // earWidthOf moves at half the rate of screenWidth, so clearing the 24 px ear cushion needs
        // >= 48 px of screenWidth; 60 is comfortably past it.
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 60, // block-side's ear would be 170, below even the relaxed 176
            screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: 'block-side',
        })
        expect(result.arrangement).toBe('t-side')
    })

    it('with no previous arrangement (first render), the normal (unrelaxed) floor applies', () => {
        const result = computeRideOverlayLayout({
            screenWidth: BOUNDARY_SCREEN_WIDTH - 12, // would stay under hysteresis, but there is no "previous" to relax for
            screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true,
            previousArrangement: null,
        })
        expect(result.arrangement).toBe('t-side')
    })

    it('relaxes the t-side/below boundary too, not just block-side/t-side', () => {
        // t-side needs screenWidth >= 2*(floor+8) + WORKOUT_DASH_MIN_WIDTH: 896 unrelaxed, 848 relaxed.
        const cold = computeRideOverlayLayout({ screenWidth: 870, screenHeight: 600, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const warm = computeRideOverlayLayout({
            screenWidth: 870, screenHeight: 600, screenLayout: 'normal', itemCount: 7, mapVisible: true, previousArrangement: 't-side',
        })
        expect(cold.arrangement).toBe('below')
        expect(warm.arrangement).toBe('t-side')
        expect(warm.workoutDashboard?.width).toBe(WORKOUT_DASH_MIN_WIDTH + 22) // 870 - 2*(176+8)
    })

    // Session 4.1's headline OQ5 finding: on most screens the Gear tile can no longer change the
    // arrangement at all, because in a T the geometry is derived from screenWidth, not from W_rd.
    it('the 1112px 7<->8 tile flip no longer changes anything (it flipped t-side<->block-side before)', () => {
        const at7 = computeRideOverlayLayout({ screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const at8 = computeRideOverlayLayout({ screenWidth: 1112, screenHeight: 834, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(at7.arrangement).toBe('t-side')
        expect(at8.arrangement).toBe('t-side')
        expect(at8.workoutDashboard?.width).toBe(at7.workoutDashboard?.width)
    })

    // It is not gone everywhere though - the settle window still earns its keep in the band where
    // the 8-tile dashboard clears the block-side boundary and the 7-tile one doesn't (1159..1311.6).
    it('a tile-count flip can still change the arrangement inside the 1159-1311.6 band', () => {
        const at7 = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const at8 = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 8, mapVisible: true })
        expect(at7.arrangement).toBe('t-side')
        expect(at8.arrangement).toBe('block-side')
    })
})

describe('useRideOverlayLayout - the hook', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        setDimensions(1280, 800)
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

        act(() => { setDimensions(1400, 900) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')
    })

    it('applies hysteresis end-to-end: once settled into an arrangement, a small resize does not flip it back out', () => {
        const { result, rerender } = renderHook(() => useRideOverlayLayout({ itemCount: 7, workoutAttached: true, mapVisible: true }), { initialProps: {} })
        expect(result.current.arrangement).toBe('t-side')

        // Settle a few px past the exact 1311.6 block-side boundary first (a small margin avoids
        // floating-point noise right at the boundary - 124.8 * 7 does not land on an exact double).
        const SETTLED_WIDTH = 1311.6 + 4
        act(() => { setDimensions(SETTLED_WIDTH, 900) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')

        // A 12px shrink crosses the *normal* boundary but must be absorbed by the 24px cushion,
        // since block-side is now the active (previous) arrangement.
        act(() => { setDimensions(SETTLED_WIDTH - 12, 900) })
        rerender({})
        expect(result.current.arrangement).toBe('block-side')

        // A larger shrink exceeds the cushion and genuinely flips.
        act(() => { setDimensions(SETTLED_WIDTH - 60, 900) })
        rerender({})
        expect(result.current.arrangement).toBe('t-side')
    })
})

// Sanity check the arrangement type union stays in sync with what the pure function actually
// returns. Five values: 'below' restores the relocated row session 4.1 had removed, and
// 'column-only' stays on as the terminal "not even that fits" case.
describe('RideOverlayArrangement', () => {
    it('covers exactly the 5 arrangements the algorithm produces', () => {
        const all: RideOverlayArrangement[] = ['block-side', 't-side', 'below', 'column-only', 'fallback']
        expect(all).toHaveLength(5)
    })
})

// A one-member column - RideDashboard alone, no
// WorkoutDashboard - for a plain route ride that still needs ear arrangement (e.g. a previous-riders
// overlay). `workoutAttached: false` reuses the exact same block-side fit-check as the combo screen
// (it was never combo-specific), but there is no second widget to narrow when that check fails, so
// there is no t-side equivalent for a one-member column - the cascade goes straight from block-side
// to column-only. Each case below reuses one of the combo screen sizes from the arrangements suite
// above, at the same itemCount, so the comparison is apples-to-apples.
describe('computeRideOverlayLayout - workoutAttached: false (one-member column)', () => {
    it('1400x900, N=7: block-side, same as the combo case - the block-side test does not depend on WorkoutDashboard', () => {
        const combo = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: true })
        const routeOnly = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: false })

        expect(combo.arrangement).toBe('block-side')
        expect(routeOnly.arrangement).toBe('block-side') // at least as permissive: identical, not worse
        expect(routeOnly.workoutDashboard).toBeNull()
        expect(routeOnly.inputs.earWidth).toBe(combo.inputs.earWidth) // the ear test itself is unchanged
        expect(routeOnly.map).not.toBeNull()
        expect(routeOnly.elevation).not.toBeNull()
        expect(routeOnly.cornerSlotIsToggle).toBe(false)
    })

    // At 1280x800/N=7 the combo screen only reaches ears at all by narrowing WorkoutDashboard down to
    // buy the ears their floor (t-side). A one-member column has no
    // WorkoutDashboard to narrow - RideDashboard's own (unnegotiable) width leaves the ears below
    // their floor here (184.2 < 200, the same number the block-side test already documents above), so
    // this lands on column-only rather than reproducing t-side. This is not "harder to reach" in any
    // meaningful sense: `block-side` - the one arrangement that IS in both cascades - has an
    // identical, unworsened threshold (previous test); column-only is what a one-member column falls
    // to instead of needing a rescue mechanism it structurally cannot have.
    it('1280x800, N=7: falls to below - there is no WorkoutDashboard to narrow for a t-side rescue', () => {
        const combo = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: true })
        const routeOnly = computeRideOverlayLayout({ screenWidth: 1280, screenHeight: 800, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: false })

        expect(combo.arrangement).toBe('t-side')
        expect(routeOnly.arrangement).toBe('below')
        expect(routeOnly.workoutDashboard).toBeNull()
        expect(routeOnly.map).not.toBeNull()
        expect(routeOnly.elevation).not.toBeNull()
        // Row 2 of the ride-only layout: directly under RideDashboard, no WorkoutDashboard band to clear.
        expect(routeOnly.elevation!.top).toBeCloseTo(RIDE_DASH_HEIGHT_RATIO * 800 + SLOT_GAP, 5)
        // RideDashboard itself is never compromised either way - unlike combo's t-side, which narrows
        // WorkoutDashboard, a one-member column always renders RideDashboard at its own full width.
        expect(routeOnly.rideDashboard.width).toBe(combo.rideDashboard.width)
    })

    it('640x430, N=7: below, same as the combo case - neither cascade has a side arrangement that fits here', () => {
        const combo = computeRideOverlayLayout({ screenWidth: 640, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: true })
        const routeOnly = computeRideOverlayLayout({ screenWidth: 640, screenHeight: 430, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: false })

        expect(combo.arrangement).toBe('below')
        expect(routeOnly.arrangement).toBe('below') // at least as permissive: identical, not worse
        expect(routeOnly.workoutDashboard).toBeNull()
        expect(routeOnly.map).not.toBeNull()
        expect(routeOnly.elevation).not.toBeNull()
        // The ride-only below row sits higher than the combo one - no WorkoutDashboard band to clear.
        expect(routeOnly.elevation!.top).toBeLessThan(combo.elevation!.top)
        expect(routeOnly.rideDashboard.width).toBe(combo.rideDashboard.width)
    })

    it('844x390 (phone landscape), any N: fallback, same as the combo case - compact is unaffected by workoutAttached', () => {
        const combo = computeRideOverlayLayout({ screenWidth: 844, screenHeight: 390, screenLayout: 'compact', itemCount: 7, mapVisible: true, workoutAttached: true })
        const routeOnly = computeRideOverlayLayout({ screenWidth: 844, screenHeight: 390, screenLayout: 'compact', itemCount: 7, mapVisible: true, workoutAttached: false })

        expect(combo.arrangement).toBe('fallback')
        expect(routeOnly.arrangement).toBe('fallback') // at least as permissive: identical, not worse
        expect(routeOnly.workoutDashboard).toBeNull()
        expect(routeOnly.map).toBeNull()
        expect(routeOnly.cornerSlotIsToggle).toBe(true)
        expect(routeOnly.elevation).toEqual(combo.elevation) // the fallback corner slot is unaffected
    })

    it('defaults workoutAttached to true when omitted - every pre-existing call site is unaffected', () => {
        const withDefault = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true })
        const explicitTrue = computeRideOverlayLayout({ screenWidth: 1400, screenHeight: 900, screenLayout: 'normal', itemCount: 7, mapVisible: true, workoutAttached: true })
        expect(withDefault).toEqual(explicitTrue)
    })

    it('the hook itself forwards workoutAttached: false through to a one-member column', () => {
        setDimensions(1400, 900)
        const { result } = renderHook(() => useRideOverlayLayout({ itemCount: 7, workoutAttached: false, mapVisible: true }))
        expect(result.current.arrangement).toBe('block-side')
        expect(result.current.workoutDashboard).toBeNull()
        expect(result.current.map).not.toBeNull()
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


// -----------------------------------------------------------------------------------------------
// The layout spec itself, as a property sweep rather than as per-size examples.
//
// Regression cover for the production bug where riding the same route on a second device blanked
// every overlay on the iPad: `overlayActive` handed rendering to RideOverlay, whose layout returned
// null rects, and the page had already unmounted its own standalone map/elevation preview.
//
// The invariant is the whole fix: on a landscape, non-compact frame the corner widgets are always
// PLACED - beside the dashboard where they fit, below it where they don't - and never dropped.
// -----------------------------------------------------------------------------------------------

const LANDSCAPE_FRAMES = [
    { name: 'iPad 9.7/10.2',     width: 1024, height: 768 },
    { name: 'iPad 10.9',         width: 1180, height: 820 },
    { name: 'iPad Pro 11',       width: 1194, height: 834 },
    { name: 'iPad Pro 12.9',     width: 1366, height: 1024 },
    { name: 'Galaxy Tab 1280',   width: 1280, height: 800 },
    { name: 'Galaxy Tab 1000',   width: 1000, height: 625 },
    { name: 'small 7in tablet',  width: 960,  height: 600 },
]

describe('layout spec - corner widgets are placed, never dropped', () => {
    for (const frame of LANDSCAPE_FRAMES) {
        for (const itemCount of [5, 6, 7, 8, 9]) {
            for (const workoutAttached of [false, true]) {
                const what = `${frame.name} ${frame.width}x${frame.height}, N=${itemCount}, ${workoutAttached ? 'ride+workout' : 'ride only'}`

                it(`${what}: places both widgets`, () => {
                    const result = computeRideOverlayLayout({
                        screenWidth: frame.width, screenHeight: frame.height, screenLayout: 'normal',
                        itemCount, mapVisible: true, workoutAttached,
                    })

                    expect(result.arrangement).not.toBe('column-only')
                    expect(result.map).not.toBeNull()
                    expect(result.elevation).not.toBeNull()
                    // Readable at the tuned floor, and inside the slot it was placed in.
                    expect(result.elevation!.width).toBeGreaterThanOrEqual(SIDE_WIDGET_MIN_WIDTH)
                    expect(result.map!.width + result.elevation!.width).toBeLessThanOrEqual(frame.width)
                    // Clear of the bottom bar.
                    expect(result.elevation!.top + result.elevation!.height).toBeLessThanOrEqual(frame.height)
                })
            }
        }
    }

    // The specific production case: a plain route ride on an iPad, which is what a second rider
    // joining switches the page into. Before the fix this returned column-only with null rects.
    it('iPad 1024x768, N=7, ride only: the widgets sit on their own row under RideDashboard', () => {
        const result = computeRideOverlayLayout({
            screenWidth: 1024, screenHeight: 768, screenLayout: 'normal',
            itemCount: 7, mapVisible: true, workoutAttached: false,
        })

        expect(result.arrangement).toBe('below')
        expect(result.map!.left).toBe(0)
        expect(result.elevation!.right).toBe(0)
        expect(result.map!.top).toBeCloseTo(RIDE_DASH_HEIGHT_RATIO * 768 + SLOT_GAP, 5)
        expect(result.map!.top).toBe(result.elevation!.top) // one row, not staggered
        expect(result.map!.height).toBe(result.elevation!.height)
    })

    // Ride+workout, row 2: where the narrowed WorkoutDashboard still leaves the widgets room beside
    // it, they sit BESIDE it on the same row - the spec's "2nd line: WorkoutDashboard + the
    // remainder of map & elevation" - rather than being pushed onto a row of their own.
    it('iPad 1024x768, N=7, ride+workout: the widgets share row 2 with WorkoutDashboard', () => {
        const result = computeRideOverlayLayout({
            screenWidth: 1024, screenHeight: 768, screenLayout: 'normal',
            itemCount: 7, mapVisible: true, workoutAttached: true,
        })

        expect(result.arrangement).toBe('t-side')
        const wd = result.workoutDashboard!
        // Same band as WorkoutDashboard (offset only by SLOT_GAP), not stacked beneath it.
        expect(result.elevation!.top).toBeLessThan(wd.top + wd.height)
        expect(result.elevation!.top).toBeCloseTo(wd.top + SLOT_GAP, 5)
        expect(wd.left! + wd.width).toBeLessThanOrEqual(1024 - result.elevation!.width)
    })

    // Ride+workout, row 3: only once the widgets no longer fit beside the narrowed WorkoutDashboard
    // do they move to a row of their own, clearing the whole column.
    it('860x480, N=7, ride+workout: the below row clears the WorkoutDashboard band', () => {
        const result = computeRideOverlayLayout({
            screenWidth: 860, screenHeight: 480, screenLayout: 'normal',
            itemCount: 7, mapVisible: true, workoutAttached: true,
        })

        expect(result.arrangement).toBe('below')
        const wd = result.workoutDashboard!
        expect(result.elevation!.top).toBeGreaterThanOrEqual(wd.top + wd.height)
    })

    // The Gear tile (N 7 -> 8) flips RideDashboard to icon-top, which makes it NARROWER. That used to
    // decide whether the overlays existed at all on a 1280 tablet; now it only decides which row they
    // land on, which is what made the bug present as "it works with virtual shifting on".
    it('the 7<->8 tile flip changes the row, never whether the widgets exist', () => {
        const frames = LANDSCAPE_FRAMES.map((f) => [7, 8].map((itemCount) =>
            computeRideOverlayLayout({
                screenWidth: f.width, screenHeight: f.height, screenLayout: 'normal',
                itemCount, mapVisible: true, workoutAttached: false,
            })))

        for (const [at7, at8] of frames) {
            expect(at7.map).not.toBeNull()
            expect(at8.map).not.toBeNull()
        }
    })

    // `mapVisible: false` is the normal state whenever the main view is itself a map. The elevation
    // preview must still be placed - and the row it defines is what NearbyRiders anchors to.
    it('mapVisible: false still places the elevation preview, on every frame', () => {
        for (const frame of LANDSCAPE_FRAMES) {
            const result = computeRideOverlayLayout({
                screenWidth: frame.width, screenHeight: frame.height, screenLayout: 'normal',
                itemCount: 7, mapVisible: false, workoutAttached: false,
            })
            expect(result.map).toBeNull()
            expect(result.elevation).not.toBeNull()
        }
    })
})
