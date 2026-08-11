import { useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useScreenLayout, ScreenLayout } from './useScreenLayout'

// Ride-screen-scoped, width-based overlay layout hook.
//
// Implements `mobile/internal/designs/ride-overlay-layout-design.md` (session 1.2's spec, consumed
// by session 3.2 - this file). Layered on top of `useScreenLayout()` (height-based compact/normal,
// ~20 unrelated consumers app-wide) rather than replacing it - see design doc §5.2/§9 and HLD §5.2.
//
// Scope (design doc §2): this hook is only ever used for a route ride with a workout attached and
// the combo toggle on. Route-only rides never call it - they keep today's rendering untouched, by
// construction rather than by proving numeric equivalence with it.

// -----------------------------------------------------------------------------------------------
// §7 - threshold constants. These are v1 hypotheses ("starting hypothesis", design doc §7), meant
// to be tuned by session 4.1 against real renders - kept as named exports, not inline literals, so
// they can be adjusted from outside this file without touching the algorithm.
// -----------------------------------------------------------------------------------------------

/** Below this an ear (2 km elevation preview, or corner map) stops conveying anything. ≈ today's 0.15·1080.
 *  The single most consequential constant - design doc §7.2: decides block-vs-T across the 1024-1230 px band. */
export const SIDE_WIDGET_MIN_WIDTH = 160
/** Same argument, vertically. ≈ today's 0.20·480. */
export const SIDE_WIDGET_MIN_HEIGHT = 96
/** Gutter between the column and an ear, and between an ear and the screen edge. Matches the existing 8 dp rhythm. */
export const SIDE_GUTTER = 8
/** Gap between stacked occupants on the same ear, and between the column and below-arrangement widgets. */
export const SLOT_GAP = 8
/** The narrow-T `WorkoutDashboard` width (step 2 of the cascade, §5.1/§5.5). */
export const WORKOUT_DASH_MIN_WIDTH = 320
/** `WorkoutDashboard` height, as a fraction of screenHeight. */
export const WORKOUT_DASH_HEIGHT_RATIO = 0.30
/** Floor for `WorkoutDashboard`'s height (description + graph + next steps). */
export const WORKOUT_DASH_MIN_HEIGHT = 120
/** Width:height ceiling for the `live` WorkoutGraph - above ~5:1 it is a letterbox. Only affects `t-below`'s reachability (§5.6). */
export const WORKOUT_DASH_MAX_ASPECT = 5
/** `RideDashboard`'s height, as a fraction of screenHeight - the existing `DASHBOARD_HEIGHT` on both pages, reused not invented. */
export const RIDE_DASH_HEIGHT_RATIO = 0.10
/** The full-route elevation strip + Menu button bottom bar, as a fraction of screenHeight - existing `ELEVATION_FULL_HEIGHT`. */
export const BOTTOM_BAR_RATIO = 0.12
/** §8.2 - once an arrangement is in effect, leaving it requires clearing its boundary by this many px. */
export const ARRANGEMENT_HYSTERESIS_PX = 24
/** §8.2 - `dashboardItemCount` changes (the Gear tile) are only accepted after this many ms of stability. */
export const TILE_COUNT_SETTLE_MS = 2000
/** §3.2 - first-frame fallback tile count, before `RideDashboard`'s first `onMetrics` report. Correct for the common case (no virtual shifting). */
export const DEFAULT_ROUTE_RIDE_TILE_COUNT = 7

// -----------------------------------------------------------------------------------------------
// §1.1 / §3.2 - `RideDashboard`'s own analytic width formula, ported (not re-measured - see design
// doc §1.1: onLayout is unreliable under both Jest and the Storybook react-native-web renderer).
// These constants mirror `RideDashboardView.tsx`'s own inline ones exactly; kept separate (and not
// imported from there) because this session is scoped to the new hook only - RideDashboardView.tsx
// is not touched here. If drift is ever suspected, `getRideDashboardWidth()` below and
// `RideDashboardView`'s inline `metricsRowWidth` computation should be pinned against each other in
// a test (design doc §3.2) - a natural follow-up for whichever session extracts the shared module
// the design doc describes at `src/components/RideDashboard/width.ts`.
// -----------------------------------------------------------------------------------------------

const RIDE_DASHBOARD_SEPARATOR_WIDTH = 1
const RIDE_DASHBOARD_CONTAINER_H_PADDING = 8
const RIDE_DASHBOARD_COL_WIDTH_ICON_TOP = 90
const RIDE_DASHBOARD_VALUE_SIZE = RIDE_DASHBOARD_COL_WIDTH_ICON_TOP * 0.32
const RIDE_DASHBOARD_ICON_SIZE_LEFT = RIDE_DASHBOARD_VALUE_SIZE
const RIDE_DASHBOARD_COL_WIDTH_ICON_LEFT = RIDE_DASHBOARD_COL_WIDTH_ICON_TOP + RIDE_DASHBOARD_ICON_SIZE_LEFT + 6

/** `RideDashboard.tsx:15` - `confirmedLayout = items.length > 7 ? 'icon-top' : layout`. Both ride
 *  pages request `icon-left`, so this is the tile count above which the layout is force-overridden
 *  to `icon-top` regardless of what was requested. Named here (not inlined) per the "no magic
 *  numbers" rule, even though it is existing/fixed behaviour rather than a §7 tunable. */
export const RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD = 7

export type DashboardLayoutMode = 'icon-left' | 'icon-top'

export interface RideDashboardWidthInput {
    itemCount: number
    layout: DashboardLayoutMode
    compact: boolean
    screenWidth: number
}

/** §3.2's shared pure function. Compact ⇒ `RideDashboard` is `alignSelf: 'stretch'`
 *  (`RideDashboardView.tsx:154`), so `W_rd === screenWidth` exactly, with no side region at all
 *  (§1.1) - this is the structural reason compact always resolves to the phone fallback. */
export const getRideDashboardWidth = ({ itemCount, layout, compact, screenWidth }: RideDashboardWidthInput): number => {
    if (compact) {
        return screenWidth
    }
    const colWidth = layout === 'icon-left' ? RIDE_DASHBOARD_COL_WIDTH_ICON_LEFT : RIDE_DASHBOARD_COL_WIDTH_ICON_TOP
    return itemCount * colWidth + Math.max(0, itemCount - 1) * RIDE_DASHBOARD_SEPARATOR_WIDTH + RIDE_DASHBOARD_CONTAINER_H_PADDING * 2
}

// -----------------------------------------------------------------------------------------------
// §6.2(b) - the phone-fallback corner slot reuses the existing 2 km elevation preview box's compact
// geometry verbatim ("Unchanged geometry"). Named here per the "no magic numbers" rule even though
// they are pre-existing GPX/View.tsx & Video/View.tsx constants, not new §7 thresholds.
// -----------------------------------------------------------------------------------------------

export const FALLBACK_ELEVATION_WIDTH_RATIO = 0.20
export const FALLBACK_ELEVATION_HEIGHT_RATIO = 0.12

// -----------------------------------------------------------------------------------------------
// §5.8 - output shape
// -----------------------------------------------------------------------------------------------

export type RideOverlayArrangement = 'block-side' | 't-side' | 'block-below' | 't-below' | 'fallback'

export interface Rect {
    top: number
    left?: number
    right?: number
    width: number
    height: number
}

/** Decision inputs, echoed back so session 4.1's prototype can render them on screen while tuning
 *  (design doc §5.8: "Phase 1's own prototype sessions found layout issues precisely because the
 *  numbers were visible"). */
export interface RideOverlayLayoutInputs {
    screenWidth: number
    screenHeight: number
    screenLayout: ScreenLayout
    itemCount: number
    mapVisible: boolean
    /** W_rd - the raw analytic width `RideDashboard` renders at (may exceed screenWidth, §5.7). */
    rideDashboardWidth: number
    /** W_rd_eff - `min(W_rd, screenWidth)`, what the algorithm actually reasons about. */
    rideDashboardWidthEffective: number
    /** Whether a block (equal-width) column was geometrically possible at all (aspect ceiling, §5.2). Undefined in 'fallback'. */
    blockPossible?: boolean
    /** The ear/half-screen width actually tested for the winning candidate. Undefined in 'fallback'. */
    earWidth?: number
    /** W_wd - the `WorkoutDashboard` width used by the winning candidate. Undefined in 'fallback'. */
    workoutDashboardWidth?: number
}

export interface RideOverlayLayout {
    arrangement: RideOverlayArrangement
    /** Informational - `RideDashboard` sizes itself; this is what it is expected to render at. */
    rideDashboard: { width: number }
    workoutDashboard: Rect | null
    map: Rect | null
    elevation: Rect
    /** True iff `arrangement === 'fallback'` (§6). */
    cornerSlotIsToggle: boolean
    inputs: RideOverlayLayoutInputs
}

// -----------------------------------------------------------------------------------------------
// §5.3 - per-ear fit check
// -----------------------------------------------------------------------------------------------

const earWidthOf = (screenWidth: number, columnWidth: number): number => (screenWidth - columnWidth) / 2 - SIDE_GUTTER

const availableHeight = (top: number, screenHeight: number): number => screenHeight - top - BOTTOM_BAR_RATIO * screenHeight - SLOT_GAP

/** Both v1 ear occupants (corner map, elevation preview) share `SIDE_WIDGET_MIN_WIDTH`/`_HEIGHT`
 *  (design doc §7.1: "Because both v1 occupants share the same SIDE_WIDGET_MIN_WIDTH, an empty left
 *  ear ... never changes the width verdict"), so a single width/height pair fit-checks either ear.
 *  `relaxed` implements §8's hysteresis: the minimum is relaxed by `ARRANGEMENT_HYSTERESIS_PX` when
 *  the candidate under test is the one currently in effect. */
const earFits = (earWidth: number, availableHeightPx: number, relaxed: boolean): boolean => {
    const effectiveMinWidth = SIDE_WIDGET_MIN_WIDTH - (relaxed ? ARRANGEMENT_HYSTERESIS_PX : 0)
    return earWidth >= effectiveMinWidth && availableHeightPx >= SIDE_WIDGET_MIN_HEIGHT
}

const fitsSide = (
    columnWidth: number,
    decisionTop: number,
    candidate: RideOverlayArrangement,
    previous: RideOverlayArrangement | null | undefined,
    screenWidth: number,
    screenHeight: number,
    mapVisible: boolean,
): boolean => {
    const ear = earWidthOf(screenWidth, columnWidth)
    const avail = availableHeight(decisionTop, screenHeight)
    const relaxed = candidate === previous
    const leftOk = !mapVisible || earFits(ear, avail, relaxed) // an empty ear imposes no requirement (§5.3)
    const rightOk = earFits(ear, avail, relaxed) // the elevation preview is always present (§1.3)
    return leftOk && rightOk
}

const fitsBelow = (
    decisionTop: number,
    candidate: RideOverlayArrangement,
    previous: RideOverlayArrangement | null | undefined,
    screenWidth: number,
    screenHeight: number,
    mapVisible: boolean,
): boolean => {
    const half = screenWidth / 2 - SIDE_GUTTER
    const avail = availableHeight(decisionTop, screenHeight)
    const relaxed = candidate === previous
    const leftOk = !mapVisible || earFits(half, avail, relaxed)
    const rightOk = earFits(half, avail, relaxed)
    return leftOk && rightOk
}

// -----------------------------------------------------------------------------------------------
// Rect builders
// -----------------------------------------------------------------------------------------------

const buildWorkoutDashboardRect = (screenWidth: number, width: number, top: number, height: number): Rect => ({
    top,
    left: (screenWidth - width) / 2,
    width,
    height,
})

const buildSideRects = (
    screenWidth: number,
    columnWidth: number,
    top: number,
    mapVisible: boolean,
): { map: Rect | null; elevation: Rect } => {
    const ear = earWidthOf(screenWidth, columnWidth)
    return {
        map: mapVisible ? { top, left: 0, width: ear, height: SIDE_WIDGET_MIN_HEIGHT } : null,
        elevation: { top, right: 0, width: ear, height: SIDE_WIDGET_MIN_HEIGHT },
    }
}

const buildBelowRects = (
    screenWidth: number,
    top: number,
    mapVisible: boolean,
): { map: Rect | null; elevation: Rect } => {
    const half = screenWidth / 2 - SIDE_GUTTER
    return {
        map: mapVisible ? { top, left: 0, width: half, height: SIDE_WIDGET_MIN_HEIGHT } : null,
        elevation: { top, right: 0, width: half, height: SIDE_WIDGET_MIN_HEIGHT },
    }
}

// -----------------------------------------------------------------------------------------------
// §5.5 - the cascade itself
// -----------------------------------------------------------------------------------------------

export interface ComputeRideOverlayLayoutInput {
    screenWidth: number
    screenHeight: number
    screenLayout: ScreenLayout
    /** Defaults to `DEFAULT_ROUTE_RIDE_TILE_COUNT` (§3.2's first-frame value). */
    itemCount?: number
    mapVisible: boolean
    /** Invariant 2 (§4) - refines positions only, never the arrangement decision. */
    measuredRideDashboardHeight?: number
    /** The arrangement currently in effect, for §8's hysteresis. `null`/`undefined` on first render. */
    previousArrangement?: RideOverlayArrangement | null
}

const buildFallback = (
    screenWidth: number,
    screenHeight: number,
    screenLayout: ScreenLayout,
    itemCount: number,
    mapVisible: boolean,
    rideDashboardWidth: number,
    measuredRideDashboardHeight: number | undefined,
): RideOverlayLayout => {
    const dashboardHeight = measuredRideDashboardHeight ?? RIDE_DASH_HEIGHT_RATIO * screenHeight
    return {
        arrangement: 'fallback',
        rideDashboard: { width: rideDashboardWidth },
        workoutDashboard: null, // null only for 'fallback' (§5.8)
        map: null, // no corner map in compact (§1.3), and 'fallback' collapses the "nothing fits" case the same way
        elevation: {
            top: dashboardHeight,
            right: 0,
            width: FALLBACK_ELEVATION_WIDTH_RATIO * screenWidth,
            height: FALLBACK_ELEVATION_HEIGHT_RATIO * screenHeight,
        },
        cornerSlotIsToggle: true,
        inputs: {
            screenWidth,
            screenHeight,
            screenLayout,
            itemCount,
            mapVisible,
            rideDashboardWidth,
            rideDashboardWidthEffective: Math.min(rideDashboardWidth, screenWidth),
        },
    }
}

/**
 * Pure decision function - design doc §4 invariant 1: a pure function of
 * `(screenWidth, screenHeight, screenLayout, itemCount, mapVisible)`, all synchronous. No measured
 * value (besides the position-only refinement of invariant 2), no async value, no device query.
 * Exported separately from the hook (§9/`useRideOverlayLayout` below) so it is directly unit
 * testable without React rendering machinery.
 */
export const computeRideOverlayLayout = (input: ComputeRideOverlayLayoutInput): RideOverlayLayout => {
    const {
        screenWidth,
        screenHeight,
        screenLayout,
        mapVisible,
        measuredRideDashboardHeight,
        previousArrangement = null,
    } = input
    const itemCount = input.itemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT

    const dashboardLayout: DashboardLayoutMode = itemCount > RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD ? 'icon-top' : 'icon-left'
    const rideDashboardWidth = getRideDashboardWidth({
        itemCount,
        layout: dashboardLayout,
        compact: screenLayout === 'compact',
        screenWidth,
    })

    // §6.1 - compact is not a heuristic: RideDashboard is `alignSelf: 'stretch'` in compact, so
    // W_rd === screenWidth and there is no side region to arrange at all.
    if (screenLayout === 'compact') {
        return buildFallback(screenWidth, screenHeight, screenLayout, itemCount, mapVisible, rideDashboardWidth, measuredRideDashboardHeight)
    }

    const rideDashboardWidthEffective = Math.min(rideDashboardWidth, screenWidth) // §5.7 clamp
    const hRdEstimate = RIDE_DASH_HEIGHT_RATIO * screenHeight
    const hRd = measuredRideDashboardHeight ?? hRdEstimate // rect positioning only (invariant 2)
    const hWd = Math.max(WORKOUT_DASH_MIN_HEIGHT, WORKOUT_DASH_HEIGHT_RATIO * screenHeight)
    const wWdMax = WORKOUT_DASH_MAX_ASPECT * hWd
    const blockPossible = rideDashboardWidthEffective <= wWdMax

    const baseInputs = {
        screenWidth,
        screenHeight,
        screenLayout,
        itemCount,
        mapVisible,
        rideDashboardWidth,
        rideDashboardWidthEffective,
        blockPossible,
    }

    // 1. block, side-fit
    if (blockPossible && fitsSide(rideDashboardWidthEffective, 0, 'block-side', previousArrangement, screenWidth, screenHeight, mapVisible)) {
        const { map, elevation } = buildSideRects(screenWidth, rideDashboardWidthEffective, 0, mapVisible)
        return {
            arrangement: 'block-side',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: buildWorkoutDashboardRect(screenWidth, rideDashboardWidthEffective, hRd, hWd),
            map,
            elevation,
            cornerSlotIsToggle: false,
            inputs: { ...baseInputs, earWidth: earWidthOf(screenWidth, rideDashboardWidthEffective), workoutDashboardWidth: rideDashboardWidthEffective },
        }
    }

    // 2. T, side-fit - narrow WorkoutDashboard to buy ear width.
    //
    // Judgement call: the design doc's §5.5 pseudocode writes
    // `W_wd_t = blockPossible ? WORKOUT_DASH_MIN_WIDTH : min(W_wd_max, W_rd_eff)`, but that
    // contradicts its own §7.1 worked matrix and §5.6/§7.2 prose. The 932×430 row (blockPossible
    // false there - W_wd_max=645 < W_rd_eff=895.6) is documented as landing in `t-side` with
    // `ear = 298`, which only reproduces under `W_wd_t = WORKOUT_DASH_MIN_WIDTH = 320`
    // (earWidthOf(932, 320) = 298) - the conditional branch would give `ear = 135.5` (not a fit) and
    // wrongly fall through. Likewise §5.6's own worked 640×420 `t-below` example computes
    // "ear at min width = 152" for a blockPossible=false screen, i.e. against 320, not against
    // `min(W_wd_max, W_rd_eff)` = 630. §7.2 independently derives the `t-side` → `-below` boundary
    // ("the narrowed ear fails at screenWidth < 656") by solving earWidthOf(w, 320) = 160, which
    // only holds if W_wd_t is unconditionally WORKOUT_DASH_MIN_WIDTH. All three cross-checks agree
    // with each other and disagree with the literal ternary, so this implementation uses
    // `W_wd_t = WORKOUT_DASH_MIN_WIDTH` unconditionally.
    const wWdT = WORKOUT_DASH_MIN_WIDTH
    const tSideDecisionTop = hRdEstimate + SLOT_GAP // decision uses the estimate (invariant 2)
    if (wWdT < rideDashboardWidthEffective && fitsSide(wWdT, tSideDecisionTop, 't-side', previousArrangement, screenWidth, screenHeight, mapVisible)) {
        const tSideRectTop = hRd + SLOT_GAP // rect uses the measured height when available
        const { map, elevation } = buildSideRects(screenWidth, wWdT, tSideRectTop, mapVisible)
        return {
            arrangement: 't-side',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: buildWorkoutDashboardRect(screenWidth, wWdT, hRd, hWd),
            map,
            elevation,
            cornerSlotIsToggle: false,
            inputs: { ...baseInputs, earWidth: earWidthOf(screenWidth, wWdT), workoutDashboardWidth: wWdT },
        }
    }

    // 3/4. below - no reason to stay narrow unless the aspect ceiling forces it.
    const wWdBelow = blockPossible ? rideDashboardWidthEffective : wWdMax
    const belowLabel: RideOverlayArrangement = blockPossible ? 'block-below' : 't-below'
    const belowDecisionTop = hRdEstimate + hWd + SLOT_GAP // decision uses the estimate (invariant 2)
    if (fitsBelow(belowDecisionTop, belowLabel, previousArrangement, screenWidth, screenHeight, mapVisible)) {
        const belowRectTop = hRd + hWd + SLOT_GAP
        const { map, elevation } = buildBelowRects(screenWidth, belowRectTop, mapVisible)
        return {
            arrangement: belowLabel,
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: buildWorkoutDashboardRect(screenWidth, wWdBelow, hRd, hWd),
            map,
            elevation,
            cornerSlotIsToggle: false,
            inputs: { ...baseInputs, earWidth: screenWidth / 2 - SIDE_GUTTER, workoutDashboardWidth: wWdBelow },
        }
    }

    // 5. fallback
    return buildFallback(screenWidth, screenHeight, screenLayout, itemCount, mapVisible, rideDashboardWidth, measuredRideDashboardHeight)
}

// -----------------------------------------------------------------------------------------------
// §9 - the hook
// -----------------------------------------------------------------------------------------------

export interface UseRideOverlayLayoutInput {
    /** From `RideDashboard`'s `onMetrics` report; defaults to `DEFAULT_ROUTE_RIDE_TILE_COUNT` (§3.2). */
    itemCount?: number
    /** Reserved per the design doc's §9 signature. Per §2, this hook is only ever invoked when a
     *  workout is attached (route-only rides bypass it entirely, by construction) - so it does not
     *  participate in the arrangement decision (§4 invariant 1 lists only screenWidth, screenHeight,
     *  screenLayout, itemCount and mapVisible as decision inputs). Kept here for interface parity
     *  with the design doc and as a documented assumption a caller can rely on. */
    workoutAttached: boolean
    mapVisible: boolean
    measuredRideDashboardHeight?: number
}

/**
 * Ride-screen-scoped overlay layout hook (design doc §9). Gathers `screenWidth`/`screenHeight`
 * (`useWindowDimensions`) and `screenLayout` (`useScreenLayout`) itself, and owns:
 *  - the §8.2 settle timer for `itemCount` (debounced 2 s of stability before a Gear-tile change is
 *    allowed to re-flow the screen) - `screenWidth`/`screenHeight`/`mapVisible` changes are applied
 *    immediately, with no debounce, per §8.2's table;
 *  - the previous-arrangement ref §8's hysteresis reads.
 *
 * §8.1: since the arrangement is a pure function of synchronous inputs, "recompute live" is just
 * "compute during render" - no effects or subscriptions are needed for the non-debounced inputs.
 */
export const useRideOverlayLayout = (input: UseRideOverlayLayoutInput): RideOverlayLayout => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions()
    const screenLayout = useScreenLayout()

    const requestedItemCount = input.itemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT
    const [settledItemCount, setSettledItemCount] = useState(requestedItemCount)
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (requestedItemCount === settledItemCount) {
            return undefined
        }
        settleTimerRef.current = setTimeout(() => {
            setSettledItemCount(requestedItemCount)
            settleTimerRef.current = null
        }, TILE_COUNT_SETTLE_MS)
        return () => {
            if (settleTimerRef.current) {
                clearTimeout(settleTimerRef.current)
                settleTimerRef.current = null
            }
        }
    }, [requestedItemCount, settledItemCount])

    const previousArrangementRef = useRef<RideOverlayArrangement | null>(null)

    const layout = computeRideOverlayLayout({
        screenWidth,
        screenHeight,
        screenLayout,
        itemCount: settledItemCount,
        mapVisible: input.mapVisible,
        measuredRideDashboardHeight: input.measuredRideDashboardHeight,
        previousArrangement: previousArrangementRef.current,
    })

    useEffect(() => {
        previousArrangementRef.current = layout.arrangement
    }, [layout.arrangement])

    return layout
}
