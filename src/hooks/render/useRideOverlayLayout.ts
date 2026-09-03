import { useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useScreenLayout, ScreenLayout } from './useScreenLayout'

// Ride-screen-scoped, width-based overlay layout hook.
//
// Implements `mobile/internal/designs/ride-overlay-layout-design.md` (session 1.2's spec, consumed
// by session 3.2 - this file). Layered on top of `useScreenLayout()` (height-based compact/normal,
// ~20 unrelated consumers app-wide) rather than replacing it - see design doc §5.2/§9 and HLD §5.2.
//
// Originally this hook was only ever used for a route ride with a workout attached and the combo
// toggle on. It now also supports a `workoutAttached: false` path - a
// one-member column (`RideDashboard` alone, no `WorkoutDashboard` width negotiation) so a plain
// route ride can also arrange ears (e.g. for a previous-riders overlay). Wiring an actual route-only
// call site up to this hook is a separate, later piece of work - this file only adds the hook's own
// support for the case.

// -----------------------------------------------------------------------------------------------
// §7 - threshold constants.
//
// TUNED BY SESSION 4.1 (2026-08-11) against real renders - see `RideOverlayPrototype.stories.tsx`
// and HLD §8's resolution table. The values below are the resolved ones; each carries the
// hypothesis it replaced and why. Still exported as named constants rather than inlined.
// -----------------------------------------------------------------------------------------------

/** Floor width for an ear occupant (2 km elevation preview, or corner map).
 *
 *  **Tuned 160 → 200 (session 4.1).** `SideWidgetWidthRuler` renders the real elevation preview at
 *  140/160/184/200/220: at 160 the five x-axis tick labels collide into unreadable mush, at 184 the
 *  first two still touch, and 200 is the first width where the preview reads as a distance-to-climb
 *  graph rather than a coloured smear. (Only residual defect at 200: the leading tick carries the
 *  unit - "9.8km" - and touches its neighbour. That is a label-formatting artifact of
 *  `ElevationGraphAxes`, noted as an independent finding, not a reason to demand 220.) */
export const SIDE_WIDGET_MIN_WIDTH = 200
/** Same argument, vertically. ≈ today's 0.20·480. Unchanged - it is rarely the binding test. */
export const SIDE_WIDGET_MIN_HEIGHT = 96
/** Preferred ear-occupant width, as a fraction of screenWidth - today's `screenWidth * 0.15` on both
 *  ride pages. Added by session 4.1: the ear is often much wider than the floor, and the previous
 *  code rendered every widget at exactly `SIDE_WIDGET_MIN_*`, which visibly shrank the elevation
 *  preview compared with today's route-only screen. The widget now renders at today's proportions
 *  where they fit, and only falls back toward the floor when the ear is tight. */
export const SIDE_WIDGET_WIDTH_RATIO = 0.15
/** Preferred ear-occupant height, as a fraction of screenHeight - today's `ELEVATION_PREVIEW_HEIGHT`
 *  (`screenHeight * 0.20`) on both ride pages. Same reasoning as `SIDE_WIDGET_WIDTH_RATIO`. */
export const SIDE_WIDGET_HEIGHT_RATIO = 0.2
/** Gutter between the column and an ear, and between an ear and the screen edge. Matches the existing 8 dp rhythm. */
export const SIDE_GUTTER = 8
/** Gap between stacked occupants on the same ear, and between `RideDashboard` and the ear below it. */
export const SLOT_GAP = 8
/** Floor width for `WorkoutDashboard` - below this the T stops being worth having and the corner
 *  widgets are dropped instead ('column-only').
 *
 *  **Tuned 320 → 480 (session 4.1).** The 320 hypothesis was derived from `WorkoutStepsList`'s
 *  compact width plus a graph Y axis, which predates session 3.1's rework into a three-column bar
 *  (text row, then graph | steps | controls). `WorkoutDashboardWidthRuler` renders that real widget
 *  at 320/400/480/560/640: at 320 the text bar truncates mid-sentence and the steps column collapses
 *  to "2…", at 400 everything fits but the countdown crowds the progress marker, and 480 is the
 *  first width where both rows read cleanly. */
export const WORKOUT_DASH_MIN_WIDTH = 480
/** `WorkoutDashboard` height, as a fraction of screenHeight.
 *
 *  **Tuned 0.30 → 0.15 (session 4.1)**, resolving the open question HLD §6.2 carried forward. 0.30
 *  was ~3x `RIDE_DASH_HEIGHT_RATIO` and allocated ~240 px on a 1280×800 tablet to a widget that
 *  renders at ~95 px - visible in the pre-retune `-below` renders as a ~145 px void between the
 *  column and the widgets. 0.15 is exactly §6.2's "roughly ≤1.5x `RideDashboard`'s own height" rule
 *  expressed as a ratio, so the rule now lives in the constant rather than in prose. */
export const WORKOUT_DASH_HEIGHT_RATIO = 0.15
/** Floor for `WorkoutDashboard`'s height (text bar + graph/steps row). Tuned 120 → 100: the widget's
 *  own intrinsic height is ~78 (compact graph) to ~95 (normal), so 100 is a true floor rather than
 *  an over-allocation. */
export const WORKOUT_DASH_MIN_HEIGHT = 100
/** Ceiling for `WorkoutDashboard`'s height. Added by session 4.1 alongside the ratio change: the
 *  widget's content is fixed-height, so on a tall screen the ratio must stop growing the box. */
export const WORKOUT_DASH_MAX_HEIGHT = 160
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

/**
 * HLD §5.3 names four arrangements. Session 4.1 collapsed `block-below`/`t-below` into a single
 * terminal `'column-only'` that returned `map: null, elevation: null`, on the reasoning that a
 * full-width row of map + elevation under a full-width dashboard column left the Video/GPX main
 * view as a sliver, and that the corner widgets - being auxiliary - were better dropped than
 * relocated.
 *
 * That is wrong, and it is the reason a plain route ride went completely blank (no map, no
 * elevation preview, no nearby-riders list) on any tablet narrower than `W_rd + 416` px as soon as
 * a second rider joined the route: `overlayActive` handed rendering to `RideOverlay`, which then
 * had nothing to place. The corner widgets are **relocated below the dashboard row(s), never
 * dropped**:
 *
 *   ride only     row 1  RideDashboard    + map & elevation if they fit beside it
 *                 row 2  map & elevation, if they did not
 *                 row 3  NearbyRiders & PrevRides
 *
 *   ride+workout  row 1  RideDashboard    + map & elevation if they fit beside it
 *                 row 2  WorkoutDashboard + the remainder of map & elevation if they fit
 *                 row 3  map & elevation, if they did not
 *                 row 4  NearbyRiders & PrevRides
 *
 * `'below'` is that relocated row - the widgets split the full screen width (map left, elevation
 * right) beneath the whole column, restoring HLD §5.3's original intent. `block-below`/`t-below`
 * stay merged into the one name: they only ever differed by `WORKOUT_DASH_MAX_ASPECT`, which is
 * gone, and §5.6 offered exactly this merge.
 *
 * `'column-only'` survives as the genuine terminal case - not enough vertical room for even the
 * below row - which no tablet reaches in practice. `'fallback'` is still reached only via compact,
 * which §6.1 already called its dominant path.
 */
export type RideOverlayArrangement = 'block-side' | 't-side' | 'below' | 'column-only' | 'fallback'

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
    /** Null in `'column-only'`, where both corner widgets are dropped rather than relocated. */
    elevation: Rect | null
    /** True iff `arrangement === 'fallback'` (§6). */
    cornerSlotIsToggle: boolean
    /** The layout mode `RideDashboard` must render in for this arrangement to hold - see
     *  `chooseDashboardLayout()`. Callers pass it straight to `<RideDashboard layout=...>`. */
    dashboardLayout: DashboardLayoutMode
    inputs: RideOverlayLayoutInputs
}

// -----------------------------------------------------------------------------------------------
// §5.3 - per-ear fit check
// -----------------------------------------------------------------------------------------------

/** Exported for `Video/View.tsx`/`GPX/View.tsx`'s route-only (no workout attached) corner-widget
 *  placement — the same "does the ear have room" question the combo algorithm's block-side
 *  candidate asks, minus the WorkoutDashboard-fitting concern that doesn't apply there. */
export const earWidthOf = (screenWidth: number, columnWidth: number): number => (screenWidth - columnWidth) / 2 - SIDE_GUTTER

const availableHeight = (top: number, screenHeight: number): number => screenHeight - top - BOTTOM_BAR_RATIO * screenHeight - SLOT_GAP

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

/** §8's hysteresis: the ear floor is relaxed by `ARRANGEMENT_HYSTERESIS_PX` when the candidate under
 *  test is the one currently in effect, so a marginal screen doesn't flip back and forth. Both
 *  boundaries the cascade tests (block↔T and T↔below) are monotonic in this floor, so relaxing it is
 *  all the hysteresis the algorithm needs. */
const earFloorFor = (
    candidate: RideOverlayArrangement,
    previous: RideOverlayArrangement | null | undefined,
): number => SIDE_WIDGET_MIN_WIDTH - (candidate === previous ? ARRANGEMENT_HYSTERESIS_PX : 0)

// -----------------------------------------------------------------------------------------------
// Rect builders
//
// Session 4.1: the widgets render at today's route-only proportions (`SIDE_WIDGET_*_RATIO`) wherever
// those fit, and shrink toward the floor only when the ear is tight. The previous version rendered
// every widget at exactly `SIDE_WIDGET_MIN_*`, which made the elevation preview visibly smaller than
// on today's route-only screen (96 px tall against today's 160 on a 1280×800 tablet).
// -----------------------------------------------------------------------------------------------

const buildWorkoutDashboardRect = (screenWidth: number, width: number, top: number, height: number): Rect => ({
    top,
    left: (screenWidth - width) / 2,
    width,
    height,
})

const sideWidgetSize = (
    screenWidth: number,
    screenHeight: number,
    earWidth: number,
    top: number,
): { width: number; height: number } => ({
    width: clamp(SIDE_WIDGET_WIDTH_RATIO * screenWidth, SIDE_WIDGET_MIN_WIDTH, earWidth),
    height: clamp(SIDE_WIDGET_HEIGHT_RATIO * screenHeight, SIDE_WIDGET_MIN_HEIGHT, availableHeight(top, screenHeight)),
})

/** Exported for the same route-only reuse `earWidthOf` is — the exact rect sizing/positioning
 *  quality session 4.1 tuned for the combo screen (`SIDE_WIDGET_WIDTH_RATIO`/`_HEIGHT_RATIO`,
 *  shrinking toward the floor only when the ear is tight), with no WorkoutDashboard dependency. */
export const buildSideRects = (
    screenWidth: number,
    screenHeight: number,
    columnWidth: number,
    top: number,
    mapVisible: boolean,
): { map: Rect | null; elevation: Rect } => {
    const ear = earWidthOf(screenWidth, columnWidth)
    const { width, height } = sideWidgetSize(screenWidth, screenHeight, ear, top)
    return {
        map: mapVisible ? { top, left: 0, width, height } : null,
        elevation: { top, right: 0, width, height },
    }
}

/** Whether the side widgets fit beside a column of the given effective width, at `top: 0` (the
 *  route-only case's only vertical candidate — there is no WorkoutDashboard band to sit below
 *  first, unlike the combo screen's t-side candidate). */
export const fitsSideBySide = (screenWidth: number, screenHeight: number, columnWidth: number): boolean =>
    earWidthOf(screenWidth, columnWidth) >= SIDE_WIDGET_MIN_WIDTH && availableHeight(0, screenHeight) >= SIDE_WIDGET_MIN_HEIGHT

/** §5.4 - the below row's half-screen slot. Unlike an ear, it is not bounded by the column's width:
 *  the widgets split the full screen beneath the column, so the width test is against half the
 *  screen rather than the leftover side region. */
export const belowSlotWidthOf = (screenWidth: number): number => screenWidth / 2 - SIDE_GUTTER

/** Whether the below row fits at the given vertical origin. Reached only once both side candidates
 *  have failed, so it is deliberately permissive - a tablet never fails it. */
export const fitsBelow = (screenWidth: number, screenHeight: number, top: number): boolean =>
    belowSlotWidthOf(screenWidth) >= SIDE_WIDGET_MIN_WIDTH && availableHeight(top, screenHeight) >= SIDE_WIDGET_MIN_HEIGHT

/** The below row's rects - map left, elevation right, both at the same origin and size, exactly as
 *  `buildSideRects` does for an ear. Sized through the same `sideWidgetSize` the side arrangements
 *  use, so a widget that relocates below does not also change size beyond what the wider slot
 *  allows. */
export const buildBelowRects = (
    screenWidth: number,
    screenHeight: number,
    top: number,
    mapVisible: boolean,
): { map: Rect | null; elevation: Rect } => {
    const { width, height } = sideWidgetSize(screenWidth, screenHeight, belowSlotWidthOf(screenWidth), top)
    return {
        map: mapVisible ? { top, left: 0, width, height } : null,
        elevation: { top, right: 0, width, height },
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
    /** `false` collapses the column to `RideDashboard` alone: no `WorkoutDashboard`, no width
     *  negotiation between two boxes. Defaults to `true` (today's only caller, the combo screen), so
     *  every existing call site is unaffected. */
    workoutAttached?: boolean
}

const buildFallback = (
    screenWidth: number,
    screenHeight: number,
    screenLayout: ScreenLayout,
    itemCount: number,
    mapVisible: boolean,
    rideDashboardWidth: number,
    measuredRideDashboardHeight: number | undefined,
    dashboardLayout: DashboardLayoutMode,
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
        dashboardLayout,
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

/** The cascade itself, for one given dashboard layout mode. Production callers go through
 *  `computeRideOverlayLayout()`, which picks the mode first (`chooseDashboardLayout()`). Kept
 *  mode-parameterised rather than mode-deriving so the chooser can evaluate both without recursing
 *  into itself - and exported so the cascade's own mechanics (arrangement shapes, §8 hysteresis) can
 *  be tested per mode, independently of which mode the chooser would pick for a given screen. */
export const computeRideOverlayLayoutForMode = (input: ComputeRideOverlayLayoutInput, dashboardLayout: DashboardLayoutMode): RideOverlayLayout => {
    const {
        screenWidth,
        screenHeight,
        screenLayout,
        mapVisible,
        measuredRideDashboardHeight,
        previousArrangement = null,
        workoutAttached = true,
    } = input
    const itemCount = input.itemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT

    const rideDashboardWidth = getRideDashboardWidth({
        itemCount,
        layout: dashboardLayout,
        compact: screenLayout === 'compact',
        screenWidth,
    })

    // §6.1 - compact is not a heuristic: RideDashboard is `alignSelf: 'stretch'` in compact, so
    // W_rd === screenWidth and there is no side region to arrange at all.
    if (screenLayout === 'compact') {
        return buildFallback(screenWidth, screenHeight, screenLayout, itemCount, mapVisible, rideDashboardWidth, measuredRideDashboardHeight, dashboardLayout)
    }

    const rideDashboardWidthEffective = Math.min(rideDashboardWidth, screenWidth) // §5.7 clamp
    const hRdEstimate = RIDE_DASH_HEIGHT_RATIO * screenHeight
    const hRd = measuredRideDashboardHeight ?? hRdEstimate // rect positioning only (invariant 2)
    const hWd = clamp(WORKOUT_DASH_HEIGHT_RATIO * screenHeight, WORKOUT_DASH_MIN_HEIGHT, WORKOUT_DASH_MAX_HEIGHT)

    const baseInputs = {
        screenWidth,
        screenHeight,
        screenLayout,
        itemCount,
        mapVisible,
        rideDashboardWidth,
        rideDashboardWidthEffective,
    }

    // -------------------------------------------------------------------------------------------
    // Session 4.1 reshaped steps 1-2. The design doc's cascade tried a full-width block first and,
    // when it didn't fit, narrowed `WorkoutDashboard` all the way to `WORKOUT_DASH_MIN_WIDTH` to buy
    // ear width. Rendered (the `TSide` story at 1194×834, before tuning) that read badly: the widget
    // the rider deliberately attached ended up the NARROWEST thing in its own row, truncated to
    // "…VO2 ma…" and "2…", while the two auxiliary widgets took 429 px each.
    //
    // Replaced by one continuous allocation, evaluated once:
    //
    //     W_wd = min(W_rd_eff, screenWidth - 2·(earFloor + SIDE_GUTTER))
    //
    // i.e. the ears get their floor first, `WorkoutDashboard` takes everything that is left up to
    // `RideDashboard`'s width, and any surplus beyond that goes back to the ears. `block` vs `T` is
    // then a DESCRIPTION of the result (did the dashboard reach `RideDashboard`'s width?) rather
    // than a separate candidate to test - which is also what makes the two share a single code path.
    //
    // Two consequences worth knowing when reading the tests:
    //  - the T is now shallow, not narrow: 1194×834 gives W_wd = 778 rather than 320;
    //  - because W_wd is capped by screenWidth-derived terms in the T, the Gear tile (N 7↔8, which
    //    moves W_rd by 152 px) usually cannot change the layout at all - see §8's note in HLD §8.
    // -------------------------------------------------------------------------------------------

    // 1/2. side arrangements
    //
    // The block-side test itself does not depend on `workoutAttached` at all: block-side always sets
    // W_wd = W_rd_eff (no negotiation), so the column width being tested beside the ears is the same
    // whether or not a WorkoutDashboard actually occupies that width - block-side is reachable at
    // any screen where the ears fit beside RideDashboard's own width, and this existing fits() check
    // already generalizes to the one-member column without changes.
    const blockEarFloor = earFloorFor('block-side', previousArrangement)
    const blockEar = earWidthOf(screenWidth, rideDashboardWidthEffective)
    const blockFits = blockEar >= blockEarFloor && availableHeight(0, screenHeight) >= SIDE_WIDGET_MIN_HEIGHT

    if (blockFits) {
        const { map, elevation } = buildSideRects(screenWidth, screenHeight, rideDashboardWidthEffective, 0, mapVisible)
        return {
            arrangement: 'block-side',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: workoutAttached ? buildWorkoutDashboardRect(screenWidth, rideDashboardWidthEffective, hRd, hWd) : null,
            map,
            elevation,
            cornerSlotIsToggle: false,
            dashboardLayout,
            inputs: workoutAttached
                ? { ...baseInputs, earWidth: blockEar, workoutDashboardWidth: rideDashboardWidthEffective }
                : { ...baseInputs, earWidth: blockEar },
        }
    }

    // A one-member column has no WorkoutDashboard to narrow, so there is nothing analogous to
    // the T-side rescue below - it needs a second box to trade width with the ears, which doesn't
    // exist here. When the ears don't fit beside RideDashboard's own (unnegotiable) width, the only
    // place left to land is `column-only` - dropping the ears rather than relocating them, exactly as
    // the combo screen's own column-only does.
    if (!workoutAttached) {
        // Row 2 of the ride-only layout: the widgets move below RideDashboard rather than being
        // dropped. The decision uses the estimated dashboard height, the rect the measured one
        // (invariant 2), exactly as t-side does.
        if (fitsBelow(screenWidth, screenHeight, hRdEstimate + SLOT_GAP)) {
            const { map, elevation } = buildBelowRects(screenWidth, screenHeight, hRd + SLOT_GAP, mapVisible)
            return {
                arrangement: 'below',
                rideDashboard: { width: rideDashboardWidth },
                workoutDashboard: null,
                map,
                elevation,
                cornerSlotIsToggle: false,
                dashboardLayout,
                inputs: { ...baseInputs, earWidth: belowSlotWidthOf(screenWidth) },
            }
        }

        return {
            arrangement: 'column-only',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: null,
            map: null,
            elevation: null,
            cornerSlotIsToggle: false,
            dashboardLayout,
            inputs: baseInputs,
        }
    }

    const tEarFloor = earFloorFor('t-side', previousArrangement)
    const wWdT = Math.min(rideDashboardWidthEffective, screenWidth - 2 * (tEarFloor + SIDE_GUTTER))
    const tSideDecisionTop = hRdEstimate + SLOT_GAP // decision uses the estimate (invariant 2)
    if (wWdT >= WORKOUT_DASH_MIN_WIDTH && availableHeight(tSideDecisionTop, screenHeight) >= SIDE_WIDGET_MIN_HEIGHT) {
        const tSideRectTop = hRd + SLOT_GAP // rect uses the measured height when available
        const { map, elevation } = buildSideRects(screenWidth, screenHeight, wWdT, tSideRectTop, mapVisible)
        return {
            arrangement: 't-side',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: buildWorkoutDashboardRect(screenWidth, wWdT, hRd, hWd),
            map,
            elevation,
            cornerSlotIsToggle: false,
            dashboardLayout,
            inputs: { ...baseInputs, earWidth: earWidthOf(screenWidth, wWdT), workoutDashboardWidth: wWdT },
        }
    }

    // 3. below - row 3 of the ride+workout layout: neither side candidate had room, so the widgets
    // move beneath the whole column (RideDashboard + WorkoutDashboard) instead of being dropped.
    if (fitsBelow(screenWidth, screenHeight, hRdEstimate + hWd + SLOT_GAP)) {
        const { map, elevation } = buildBelowRects(screenWidth, screenHeight, hRd + hWd + SLOT_GAP, mapVisible)
        return {
            arrangement: 'below',
            rideDashboard: { width: rideDashboardWidth },
            workoutDashboard: buildWorkoutDashboardRect(screenWidth, rideDashboardWidthEffective, hRd, hWd),
            map,
            elevation,
            cornerSlotIsToggle: false,
            dashboardLayout,
            inputs: { ...baseInputs, earWidth: belowSlotWidthOf(screenWidth), workoutDashboardWidth: rideDashboardWidthEffective },
        }
    }

    // 4. column-only - the genuine terminal case: not even the below row has vertical room. No fit
    // test; it is what is left when nothing else fits.
    return {
        arrangement: 'column-only',
        rideDashboard: { width: rideDashboardWidth },
        workoutDashboard: buildWorkoutDashboardRect(screenWidth, rideDashboardWidthEffective, hRd, hWd),
        map: null,
        elevation: null,
        cornerSlotIsToggle: false,
        dashboardLayout,
        inputs: { ...baseInputs, workoutDashboardWidth: rideDashboardWidthEffective },
    }
}

/** Preference order over the arrangements, best first - the layout spec's own row preference made
 *  comparable. Row 1 (`block-side`: widgets beside RideDashboard, from the top of the screen) beats
 *  row 2 (`t-side`: widgets beside WorkoutDashboard, below RideDashboard), which beats a row of
 *  their own (`below`), which beats not placing them at all.
 *
 *  `t-side` is a FALLBACK, not a success: it is what the cascade reaches when the widgets did not
 *  fit beside RideDashboard. So a combo ride sitting on `t-side` must still get the icon-top rescue
 *  - denying it there was a real defect, and left a ride+workout on a 1180 pt tablet stuck on row 2
 *  when row 1 was reachable. The WorkoutDashboard does narrow as a result (864 -> 652 px at
 *  1280x800/N=7, where it matches RideDashboard's own width), but `WORKOUT_DASH_MIN_WIDTH` is 480 -
 *  the width at which both of its rows were tuned to read cleanly - so that is not a cost.
 *
 *  `'fallback'` is not meaningfully ranked: it is reached only through `screenLayout === 'compact'`,
 *  where the mode is irrelevant (RideDashboard is `alignSelf: 'stretch'` and RideDashboardView
 *  forces `icon-left`), and `chooseDashboardLayout` returns before ever comparing it. */
const ARRANGEMENT_RANK: Record<RideOverlayArrangement, number> = {
    'block-side': 0,
    't-side': 1,
    'below': 2,
    'column-only': 3,
    'fallback': 4,
}

/**
 * Which layout mode `RideDashboard` should render in.
 *
 * `RideDashboard` renders each tile far narrower in `'icon-top'` (90 dp) than in `'icon-left'`
 * (~125 dp), so the same tiles occupy a much narrower row - narrow enough, on a mid-size tablet,
 * to free the ears that `'icon-left'` denies. That was previously an accident of the
 * `> 7 tiles` rule: a rider with virtual shifting on got 8 tiles, was forced into `'icon-top'`, and
 * their map and elevation preview fitted beside the dashboard; the same rider with shifting off got
 * 7 tiles, `'icon-left'`, and the widgets dropped to a row below. The tile count decided the
 * layout quality, which is backwards.
 *
 * So the mode is chosen for fit instead: run the cascade under both modes and keep whichever
 * reaches the better-ranked arrangement (`ARRANGEMENT_RANK`), with `'icon-left'` winning ties so it
 * stays the default wherever it already lays the screen out as well. This applies to ride+workout
 * exactly as it does to a plain route ride - `t-side` is a fallback, not a success, so a combo ride
 * that lands there is still a candidate for the rescue.
 *
 * Two constraints bound the choice:
 *  - above `RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD` tiles `RideDashboard` forces `'icon-top'`
 *    regardless of the prop (`RideDashboard.tsx`), so there is nothing to choose - mirroring it here
 *    keeps the layout's assumed width and the rendered width in agreement;
 *  - in compact the dashboard stretches to the full screen width, so the mode cannot buy any room.
 *
 * Pure in exactly the inputs the arrangement is (§4, invariant 1) - `itemCount` does not depend on
 * the mode, so there is no feedback loop between the choice and the thing it is chosen from.
 */
export const chooseDashboardLayout = (input: ComputeRideOverlayLayoutInput): DashboardLayoutMode => {
    if (input.screenLayout === 'compact')
        return 'icon-left'

    const itemCount = input.itemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT
    if (itemCount > RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD)
        return 'icon-top'

    const left = ARRANGEMENT_RANK[computeRideOverlayLayoutForMode(input, 'icon-left').arrangement]
    const top = ARRANGEMENT_RANK[computeRideOverlayLayoutForMode(input, 'icon-top').arrangement]

    // Strictly better, or icon-left stands - so icon-top is only ever a rescue, never a restyle of a
    // screen icon-left already lays out as well.
    return top < left ? 'icon-top' : 'icon-left'
}

/**
 * Pure decision function - design doc §4 invariant 1: a pure function of
 * `(screenWidth, screenHeight, screenLayout, itemCount, mapVisible)`, all synchronous. No measured
 * value (besides the position-only refinement of invariant 2), no async value, no device query.
 * Exported separately from the hook (§9/`useRideOverlayLayout` below) so it is directly unit
 * testable without React rendering machinery.
 */
export const computeRideOverlayLayout = (input: ComputeRideOverlayLayoutInput): RideOverlayLayout =>
    computeRideOverlayLayoutForMode(input, chooseDashboardLayout(input))

// -----------------------------------------------------------------------------------------------
// §9 - the hook
// -----------------------------------------------------------------------------------------------

export interface UseRideOverlayLayoutInput {
    /** From `RideDashboard`'s `onMetrics` report; defaults to `DEFAULT_ROUTE_RIDE_TILE_COUNT` (§3.2). */
    itemCount?: number
    /** `false` collapses the column to `RideDashboard` alone - no `WorkoutDashboard`, no width
     *  negotiation between two boxes. One of the inputs the arrangement decision is a pure
     *  function of, alongside screen size, dashboard width, and item count. */
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
        workoutAttached: input.workoutAttached,
    })

    useEffect(() => {
        previousArrangementRef.current = layout.arrangement
    }, [layout.arrangement])

    return layout
}
