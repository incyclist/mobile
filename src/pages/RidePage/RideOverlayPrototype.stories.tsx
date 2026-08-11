import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ActivityDashboardItem } from 'incyclist-services';
import { FreeMap } from '../../components/FreeMap';
import { RideDashboardView } from '../../components/RideDashboard/RideDashboardView';
import { WorkoutDashboard } from '../../components/WorkoutDashboard';
import { ElevationGraphView } from '../../components/ElevationGraph/ElevationGraphView';
import { computeGraphPoints } from '../../components/ElevationGraph/utils';
import { WorkoutGraphView } from '../../components/WorkoutGraph/WorkoutGraphView';
import { Icon } from '../../components/Icon';
import {
    computeRideOverlayLayout,
    RideOverlayLayout,
    SIDE_WIDGET_MIN_WIDTH,
    BOTTOM_BAR_RATIO,
} from '../../hooks/render/useRideOverlayLayout';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../../components/WorkoutDashboard/WorkoutDashboard.mock';
import { colors, textSizes } from '../../theme';
import teideRoute from '../../../__tests__/testdata/ES_Teide.json';

/**
 * Session 4.1 — the Wave 4 visual checkpoint for the combined route+workout ride screen
 * (`workout-mobile-hld-phase2.md` §5.3/§5.4/§6.3, `ride-overlay-layout-design.md` §5–§8).
 * Mirrors Phase 1's 4.1/4.2 prototype sessions: a PROTOTYPE assembled inside the story file,
 * not a page. No service, no gestures, no `RideMenu`, no navigation — the real page assembly
 * is session 5.1, the real Stop-Workout control is 5.3.
 *
 * It exists to answer HLD §8's open questions 1–4 and 6 against actual renders — all six are now
 * resolved there, and the constants in `useRideOverlayLayout.ts` were retuned as a result, so these
 * stories are also the regression reference for what "right" looks like:
 *
 * | OQ | What this file shows |
 * |---|---|
 * | 1 — thresholds | every arrangement at the exact screen size that triggers it, with the decision inputs printed on screen (`ride-overlay-layout-design.md` §5.8's `inputs`), plus `SideWidgetWidthRuler` for eyeballing `SIDE_WIDGET_MIN_WIDTH` directly |
 * | 2 — Map/Elevation side | `sideAssignment` arg swaps the two ears |
 * | 3 — Stop-Workout | `stopMechanism` renders the dedicated button and the long-press affordance side by side, in every arrangement including the fallback (§6.5: the fallback is the binding constraint) |
 * | 4 — WorkoutDashboard graph | `graphMode` switches `strip` ↔ `live` at the block width and at the T width — `live` is what ruled itself out here |
 * | 6 — gear-shift room | `showGearGhost` draws a hypothetical shift control in the slot §8.6 settled on (under a corner widget, not beside `RideDashboard` — where it collides), and `workoutAttached: false` gives the route-only variant HLD §6.4 requires it to be judged against |
 *
 * ## Why the layout is computed, not hooked
 *
 * Stories render into fixed dp frames, but `useRideOverlayLayout()` reads the real browser
 * window via `useWindowDimensions()`. So the prototype calls the hook's exported pure core,
 * `computeRideOverlayLayout()`, with the frame's own size — same "computed, not measured"
 * approach `RideDashboardView` uses for its shoutout width, and the same pure-view rule Phase
 * 1's prototypes followed. The arrangement decision is bit-identical to what the hook produces
 * at that window size (`ride-overlay-layout-design.md` §4, invariant 1).
 *
 * Known story-only caveat, inherited from Phase 1's 4.2 prototype: `RideDashboardView` reads
 * `useWindowDimensions()` for its COMPACT column math, so the fallback stories' dashboard only
 * sizes correctly when the browser viewport matches the frame. Non-compact stories are
 * unaffected (their column widths are fixed dp).
 */

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

/** A route ride's 7 always-on tiles (`services` `buildDashboardInfo`: 6 base + Slope). */
const ROUTE_TILES_7: ActivityDashboardItem[] = [
    { title: 'Time', data: [{ value: '0:24:18' }, { value: '-1:05:42' }] },
    { title: 'Distance', data: [{ value: '11.4', unit: 'km' }, { value: '-28.6' }] },
    { title: 'Speed', data: [{ value: '28.6', unit: 'km/h' }, { value: '55.0', label: 'max' }] },
    { title: 'Power', data: [{ value: '243', unit: 'W' }, { value: '218', label: 'avg' }] },
    { title: 'Slope', data: [{ value: '4.2', unit: '%' }, { value: '318', label: 'gain', unit: 'm' }] },
    { title: 'Heartrate', data: [{ value: '156', unit: 'bpm' }, { value: '148', label: 'avg' }] },
    { title: 'Cadence', data: [{ value: '88', unit: 'rpm' }, { value: '86', label: 'avg' }] },
];

/** The 8th tile appears mid-ride, the first time virtual shifting reports a gear string
 *  (`ride-overlay-layout-design.md` §1.2) — the concrete driver of HLD Open Question 5. */
const ROUTE_TILES_8: ActivityDashboardItem[] = [
    ...ROUTE_TILES_7,
    { title: 'Gear', data: [{ value: '10' }] },
];

const ROUTE_DATA = teideRoute as never;

/** Slot height for the two width-ruler stories - the ear-occupant floor, so the ruler judges width
 *  at the height these widgets are actually guaranteed. */
const RULER_SLOT_HEIGHT = 96;

/**
 * `NearbyRiders`/`PrevRides` are **variable-length lists, capped at 10 but usually shorter** on
 * desktop today, and both can be on screen at once (repo owner, 2026-08-11 - e.g. a "ride again"
 * that turns into a group ride). So the reserved slot is not a fixed box, and it is not a
 * worst-case-10 box either: its height is `header + n · row` for whatever `n` currently is, clamped
 * to what the ear can afford. These are stand-in metrics for the ghost - Phase 3 owns the real ones.
 */
const PHASE3_MAX_ENTRIES = 10;
const PHASE3_TYPICAL_ENTRIES = 4;
const PHASE3_ROW_HEIGHT = 24;
const PHASE3_HEADER_HEIGHT = 22;

/**
 * Rendered heights of `RideDashboardView`, measured in the browser (2026-08-11) rather than assumed.
 * The `icon-top` stack (icon ABOVE value above the secondary row) is 40% taller than `icon-left`'s —
 * which matters because the Gear tile forces `icon-top`, so the dashboard gets both narrower AND
 * taller the moment virtual shifting reports a gear.
 *
 * The real pages already measure this with `onLayout` and feed it to the hook as
 * `measuredRideDashboardHeight` (design doc §4, invariant 2: measured heights refine positions,
 * never the arrangement). The prototype substitutes the observed value for the same reason. Using
 * the algorithm's own `RIDE_DASH_HEIGHT_RATIO` estimate instead puts `WorkoutDashboard` 13 px INTO
 * the dashboard on an 8-tile frame — see HLD §8.7 finding 5.
 */
const OBSERVED_RIDE_DASH_HEIGHT = { 'icon-left': 66, 'icon-top': 93, compact: 41 } as const;

// ---------------------------------------------------------------------------
// Prototype view
// ---------------------------------------------------------------------------

type BackdropKind = 'map' | 'streetview' | 'video';
type StopMechanism = 'none' | 'button' | 'longpress';
type SideAssignment = 'map-left' | 'map-right';

interface RideOverlayPrototypeProps {
    /** Fixed device-frame size (dp) — fed to `computeRideOverlayLayout` in place of the window. */
    frameWidth: number;
    frameHeight: number;
    /** 7 = no virtual shifting, 8 = Gear tile present. Toggling these two is HLD OQ5's live check. */
    itemCount: number;
    /** GPX main view (`map`/`streetview`) or a Video ride. Drives `mapVisible` — a full-screen map
     *  makes the corner orientation map redundant (`ride-overlay-layout-design.md` §1.3.1). */
    backdrop: BackdropKind;
    /** false → the route-only screen exactly as it renders today (HLD §9.1's "identical to today"). */
    workoutAttached: boolean;
    stopMechanism: StopMechanism;
    /** HLD OQ2. */
    sideAssignment: SideAssignment;
    /** HLD OQ4 — the graph inside `WorkoutDashboard`. */
    graphMode: 'strip' | 'live';
    /** The fallback corner slot's state (`ride-overlay-layout-design.md` §6.2(b)). */
    cornerSlot: 'elevation' | 'workout';
    /** HLD OQ6 — a hypothetical (NOT built) gear-shift trigger, to check the arrangement leaves room. */
    showGearGhost: boolean;
    /** HLD §5.5 — the reserved Phase 3 `NearbyRiders`/`PrevRides` slots, drawn as ghosts to check the
     *  ear budget actually holds once occupied. Neither is designed or built in this phase. */
    showPhase3Ghosts: boolean;
    /** Entries per reserved list. Both are capped at 10 but are usually shorter, so the default is
     *  the typical case, not the worst one. */
    phase3Entries: number;
    /** §5.8's `inputs`, rendered on screen: Phase 1 found layout issues precisely because the
     *  numbers were visible. */
    showDebug: boolean;
}

const RideOverlayPrototypeView = (props: RideOverlayPrototypeProps) => {
    const {
        frameWidth,
        frameHeight,
        itemCount,
        backdrop,
        workoutAttached,
        stopMechanism,
        sideAssignment,
        graphMode,
        cornerSlot,
        showGearGhost,
        showPhase3Ghosts,
        phase3Entries,
        showDebug,
    } = props;

    const compact = frameHeight < 420; // useScreenLayout()'s own rule
    const mapVisible = !compact && backdrop !== 'map';

    const items = itemCount > 7 ? ROUTE_TILES_8 : ROUTE_TILES_7;
    // `RideDashboard.tsx:15` overrides the requested layout to 'icon-top' above 7 tiles; the
    // prototype uses the pure View (which has no such override) so it has to apply it itself -
    // otherwise the 8-tile frame renders 1006 px wide while the layout algorithm reasons about 743.
    const dashboardLayout = itemCount > 7 ? 'icon-top' : 'icon-left';
    const dashboardHeight = compact ? OBSERVED_RIDE_DASH_HEIGHT.compact : OBSERVED_RIDE_DASH_HEIGHT[dashboardLayout];
    const bottomBarHeight = BOTTOM_BAR_RATIO * frameHeight;

    const layout = computeRideOverlayLayout({
        screenWidth: frameWidth,
        screenHeight: frameHeight,
        screenLayout: compact ? 'compact' : 'normal',
        itemCount,
        mapVisible,
        measuredRideDashboardHeight: dashboardHeight,
    });

    return (
        <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
            <Backdrop kind={backdrop} />

            {/* --- RideDashboard: top, centered, unchanged from today ------------------- */}
            <View style={[styles.dashboardContainer, compact ? styles.dashboardCompact : styles.dashboardTablet]}>
                <RideDashboardView items={items} layout={dashboardLayout} compact={compact} />
            </View>

            {workoutAttached ? (
                <WorkoutOverlay
                    layout={layout}
                    frameWidth={frameWidth}
                    frameHeight={frameHeight}
                    compact={compact}
                    graphMode={graphMode}
                    cornerSlot={cornerSlot}
                    sideAssignment={sideAssignment}
                    stopMechanism={stopMechanism}
                    showGearGhost={showGearGhost}
                    showPhase3Ghosts={showPhase3Ghosts}
                    phase3Entries={phase3Entries}
                    dashboardHeight={dashboardHeight}
                />
            ) : (
                <RouteOnlyOverlay
                    frameWidth={frameWidth}
                    frameHeight={frameHeight}
                    compact={compact}
                    mapVisible={mapVisible}
                    showGearGhost={showGearGhost}
                    showPhase3Ghosts={showPhase3Ghosts}
                    phase3Entries={phase3Entries}
                />
            )}

            {/* --- Bottom bar: Menu + full-route elevation strip. Untouched by this phase. */}
            <View style={[styles.bottomBar, { height: bottomBarHeight }]}>
                <View style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>Menu</Text>
                </View>
                <ElevationGraphView
                    width={frameWidth - 90}
                    height={bottomBarHeight}
                    showLine
                    showColors
                    showXAxis={false}
                    showYAxis={false}
                    {...computeGraphPoints(ROUTE_DATA, frameWidth - 90, bottomBarHeight, {})}
                />
            </View>

            {showDebug && <DebugPanel layout={layout} bottom={bottomBarHeight + 4} />}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Overlay pieces
// ---------------------------------------------------------------------------

interface WorkoutOverlayProps {
    layout: RideOverlayLayout;
    frameWidth: number;
    frameHeight: number;
    compact: boolean;
    graphMode: 'strip' | 'live';
    cornerSlot: 'elevation' | 'workout';
    sideAssignment: SideAssignment;
    stopMechanism: StopMechanism;
    showGearGhost: boolean;
    showPhase3Ghosts: boolean;
    /** How many entries each reserved list currently holds (capped at `PHASE3_MAX_ENTRIES`). */
    phase3Entries: number;
    /** Observed, not estimated - see `OBSERVED_RIDE_DASH_HEIGHT`. */
    dashboardHeight: number;
}

const WorkoutOverlay = (props: WorkoutOverlayProps) => {
    const { layout, frameWidth, frameHeight, compact, graphMode, cornerSlot, sideAssignment, stopMechanism, showGearGhost, showPhase3Ghosts, phase3Entries, dashboardHeight } = props;
    const { arrangement, workoutDashboard, map, elevation } = layout;

    // OQ2 — the two ears are geometrically identical, so swapping is purely which occupant goes
    // where. `map-right` mirrors both rects rather than re-running the algorithm.
    const mapRect = map && (sideAssignment === 'map-left' ? map : mirror(map));
    const elevationRect = elevation && (arrangement === 'fallback' || sideAssignment === 'map-left' ? elevation : mirror(elevation));

    return (
        <>
            {/* --- WorkoutDashboard ------------------------------------------------------ */}
            {workoutDashboard && (
                <View
                    testID="proto-workout-dashboard"
                    style={[
                        styles.absolute,
                        {
                            top: workoutDashboard.top,
                            left: workoutDashboard.left,
                            width: workoutDashboard.width,
                            maxHeight: workoutDashboard.height,
                        },
                    ]}
                >
                    <WorkoutDashboard
                        {...MOCK_DASHBOARD_MID_INTERVAL}
                        graphMode={graphMode}
                        compact={compact}
                        controls={stopMechanism === 'button' ? <StopWorkoutButton compact={compact} /> : undefined}
                    />
                </View>
            )}

            {/* --- Corner map ------------------------------------------------------------ */}
            {mapRect && (
                <View testID="proto-corner-map" style={[styles.cornerWidget, rectStyle(mapRect)]}>
                    <FreeMap points={(ROUTE_DATA as { points: never[] }).points} draggable={false} followPosition />
                </View>
            )}

            {/* --- 2 km elevation preview, or the fallback's 2-way toggle slot. Absent entirely in
                    'column-only', where both corner widgets are dropped so the Video/GPX main view
                    keeps the screen (repo-owner review, 2026-08-11). -------------------------- */}
            {elevationRect && (
            <View testID="proto-elevation" style={[styles.cornerWidget, rectStyle(elevationRect)]}>
                {layout.cornerSlotIsToggle && cornerSlot === 'workout' ? (
                    <WorkoutGraphView
                        width={elevationRect.width}
                        height={elevationRect.height}
                        mode="live"
                        plan={MOCK_DASHBOARD_MID_INTERVAL.graph}
                        actuals={MOCK_DASHBOARD_MID_INTERVAL.actuals}
                        showAxes={false}
                        showFtpLine
                    />
                ) : (
                    <ElevationGraphView
                        width={elevationRect.width}
                        height={elevationRect.height}
                        showLine
                        showColors
                        showXAxis={!compact}
                        showYAxis={!compact}
                        {...computeGraphPoints(ROUTE_DATA, elevationRect.width, elevationRect.height, {
                            range: 2000,
                            position: 10000,
                        })}
                    />
                )}
            </View>
            )}

            {/* --- §5.4's unconditional single-line current-step description (fallback only) */}
            {arrangement === 'fallback' && (
                <View style={[styles.absolute, styles.fallbackShoutout, { top: dashboardHeight }]}>
                    <Text style={styles.fallbackShoutoutText} numberOfLines={1}>
                        {MOCK_DASHBOARD_MID_INTERVAL.line.text}
                    </Text>
                </View>
            )}

            {/* --- Stop-Workout, mechanism B: no persistent control, a long-press hint ---- */}
            {stopMechanism === 'longpress' && <LongPressAffordance frameHeight={frameHeight} compact={compact} />}

            {/* --- Stop-Workout, mechanism A, in the fallback: there is no WorkoutDashboard
                    to host the button (§6.5), so it needs its own slot mirroring the corner one. */}
            {stopMechanism === 'button' && arrangement === 'fallback' && (
                <View style={[styles.absolute, styles.fallbackStopSlot, { top: dashboardHeight + 26 }]}>
                    <StopWorkoutButton compact={compact} />
                </View>
            )}

            {/* --- §5.5's reserved Phase 3 occupants, NOT designed or built here. Informational
                    occupants stack DOWNWARD from under each ear's corner widget: NearbyRiders under
                    the Map (left), PrevRides under the Elevation (right). */}
            {showPhase3Ghosts && mapRect && (
                <SlotGhost
                    label="NearbyRiders"
                    side={sideAssignment === 'map-left' ? 'left' : 'right'}
                    top={mapRect.top + mapRect.height + 8}
                    width={mapRect.width}
                    availableHeight={earFreeBand(frameHeight, mapRect.top + mapRect.height)}
                    entries={phase3Entries}
                />
            )}
            {showPhase3Ghosts && elevationRect && arrangement !== 'fallback' && (
                <SlotGhost
                    label="PrevRides"
                    side={sideAssignment === 'map-left' ? 'right' : 'left'}
                    top={elevationRect.top + elevationRect.height + 8}
                    width={elevationRect.width}
                    availableHeight={earFreeBand(frameHeight, elevationRect.top + elevationRect.height)}
                    entries={phase3Entries}
                />
            )}

            {/* --- OQ6: hypothetical gear-shift trigger, NOT part of this phase. BOTTOM-anchored in
                    the right ear, not stacked under the corner widget: it is the only interactive
                    occupant, so it must not shift position when an informational one appears above
                    it. Bottom-right also keeps it diagonally opposite the Menu button (bottom-left),
                    so the two controls can't be mis-tapped for each other. */}
            {showGearGhost && <GearShiftGhost bottom={BOTTOM_BAR_RATIO * frameHeight + 8} compact={compact} />}

            <ArrangementBadge arrangement={arrangement} width={frameWidth} />
        </>
    );
};

/** The screen exactly as it renders today for a route-only ride — the HLD §6.4 / OQ6 comparison
 *  case, and the "route-only rendering is untouched" reference (HLD §9.1). Reproduces
 *  `GPX/View.tsx`'s own `cornerTopOffset` math verbatim rather than using the new algorithm,
 *  which route-only rides deliberately bypass (`ride-overlay-layout-design.md` §2). */
const RouteOnlyOverlay = ({
    frameWidth,
    frameHeight,
    compact,
    mapVisible,
    showGearGhost,
    showPhase3Ghosts,
    phase3Entries,
}: {
    frameWidth: number;
    frameHeight: number;
    compact: boolean;
    mapVisible: boolean;
    showGearGhost: boolean;
    showPhase3Ghosts: boolean;
    phase3Entries: number;
}) => {
    const elevationPreviewHeight = frameHeight * 0.2;
    const elevationFullHeight = frameHeight * 0.12;
    const dashboardHeight = frameHeight * 0.1;
    const reservedRight = frameWidth * (compact ? 0.2 : 0.15);
    // Today's over-conservative check (`ride-overlay-layout-design.md` §1.4): both widths are
    // reserved on the right even though the map sits left.
    const dashboardRightEdge = frameWidth / 2 + 895.6 / 2;
    const cornerTopOffset = dashboardRightEdge > frameWidth - reservedRight ? dashboardHeight + 2 : 0;
    const previewHeight = compact ? elevationFullHeight : elevationPreviewHeight;

    return (
        <>
            {mapVisible && (
                <View
                    style={[
                        styles.cornerWidget,
                        styles.cornerLeft,
                        { top: cornerTopOffset, width: frameWidth * 0.15, height: elevationPreviewHeight },
                    ]}
                >
                    <FreeMap points={(ROUTE_DATA as { points: never[] }).points} draggable={false} followPosition />
                </View>
            )}
            <View
                style={[
                    styles.cornerWidget,
                    styles.cornerRight,
                    {
                        top: compact ? dashboardHeight : cornerTopOffset,
                        width: reservedRight,
                        height: previewHeight,
                    },
                ]}
            >
                <ElevationGraphView
                    width={reservedRight}
                    height={previewHeight}
                    showLine
                    showColors
                    showXAxis={!compact}
                    showYAxis={!compact}
                    {...computeGraphPoints(ROUTE_DATA, reservedRight, previewHeight, { range: 2000, position: 10000 })}
                />
            </View>
            {/* The same Phase 3 slots on a route-only ride — they are not workout-specific, so the
                budget has to hold here too, where the widgets sit higher (no WorkoutDashboard). */}
            {showPhase3Ghosts && mapVisible && (
                <SlotGhost
                    label="NearbyRiders"
                    side="left"
                    top={cornerTopOffset + elevationPreviewHeight + 8}
                    width={frameWidth * 0.15}
                    availableHeight={earFreeBand(frameHeight, cornerTopOffset + elevationPreviewHeight)}
                    entries={phase3Entries}
                />
            )}
            {showPhase3Ghosts && (
                <SlotGhost
                    label="PrevRides"
                    side="right"
                    top={(compact ? dashboardHeight : cornerTopOffset) + previewHeight + 8}
                    width={reservedRight}
                    availableHeight={earFreeBand(frameHeight, (compact ? dashboardHeight : cornerTopOffset) + previewHeight)}
                    entries={phase3Entries}
                />
            )}
            {showGearGhost && <GearShiftGhost bottom={elevationFullHeight + 8} compact={compact} />}
            <ArrangementBadge arrangement="route-only (today's layout)" width={frameWidth} />
        </>
    );
};

// ---------------------------------------------------------------------------
// Small prototype-only widgets
// ---------------------------------------------------------------------------

/** Mechanism A. Deliberately small and single-purpose — sized against `WorkoutDashboard`'s
 *  reserved third column (session 3.1), not the app's standard `Button` (32/16 dp padding,
 *  far too big for that slot). Hit target is kept ≥44 dp in the tappable axis. */
const StopWorkoutButton = ({ compact }: { compact: boolean }) => (
    <Pressable style={[styles.stopButton, compact && styles.stopButtonCompact]} onPress={noop}>
        <View style={styles.stopGlyph} />
        <Text style={[styles.stopLabel, compact && styles.stopLabelCompact]}>Stop{'\n'}Workout</Text>
    </Pressable>
);

/** Mechanism B. A long-press has no resting visual, so the only thing to judge is the
 *  discoverability affordance it needs — shown here in its most generous form (a persistent
 *  hint strip), plus the confirmation toast the gesture would have to raise. */
const LongPressAffordance = ({ frameHeight, compact }: { frameHeight: number; compact: boolean }) => (
    <>
        <View style={[styles.absolute, styles.longPressHint, { bottom: BOTTOM_BAR_RATIO * frameHeight + 8 }]}>
            <Text style={[styles.longPressHintText, compact && styles.longPressHintTextCompact]}>
                Long-press anywhere to stop the workout
            </Text>
        </View>
        <View style={[styles.absolute, styles.longPressToast, { top: frameHeight * 0.45 }]}>
            <Text style={styles.longPressToastText}>Hold to stop workout… 1.2s</Text>
        </View>
    </>
);

/** HLD OQ6 — NOT built this phase. A plausible two-button shifter, drawn bottom-anchored in the
 *  right ear (see §8.6): the ear's free vertical band is the only place with room, and an
 *  interactive control has to keep a fixed position as informational occupants come and go above it. */
const GearShiftGhost = ({ bottom, compact }: { bottom: number; compact: boolean }) => (
    <View style={[styles.absolute, styles.gearGhost, { bottom }]}>
        <View style={[styles.gearGhostButton, compact && styles.gearGhostButtonCompact]}>
            <Icon name="chevron-up" size={compact ? 16 : 22} color={colors.text} />
        </View>
        <View style={styles.gearGhostLabel}>
            <Icon name="gear" size={compact ? 14 : 18} color={colors.text} />
            <Text style={styles.gearGhostText}>10</Text>
        </View>
        <View style={[styles.gearGhostButton, compact && styles.gearGhostButtonCompact]}>
            <Icon name="chevron-down" size={compact ? 16 : 22} color={colors.text} />
        </View>
    </View>
);

/**
 * The full-screen main view the overlay floats on. Video and StreetView use the same
 * `/screenshot.jpg` placeholder photo `VideoRidePage`'s own story uses (repo-owner request,
 * 2026-08-11) — a flat colour makes every widget look legible, and the real question here is whether
 * the translucent widget backgrounds (`rgba(0,0,0,0.45)`) hold up over actual ride imagery.
 */
/** A reserved-but-unbuilt overlay slot, drawn at the size the ear budget gives it. Deliberately an
 *  empty labelled box: this session answers *where they go*, not what they contain (§5.5 — content
 *  and triggers are Phase 3 and explicitly out of scope). */
const SlotGhost = ({
    label,
    side,
    top,
    width,
    availableHeight,
    entries,
}: {
    label: string;
    side: 'left' | 'right';
    top: number;
    width: number;
    /** The ear's free vertical band below the corner widget, down to the bottom bar. */
    availableHeight: number;
    /** How many entries the list currently HAS - not its cap. The slot sizes to this, clamped. */
    entries: number;
}) => {
    const fits = Math.max(0, Math.floor((availableHeight - PHASE3_HEADER_HEIGHT) / PHASE3_ROW_HEIGHT));
    const visible = Math.min(entries, fits);
    const height = PHASE3_HEADER_HEIGHT + visible * PHASE3_ROW_HEIGHT;

    return (
        <View style={[styles.slotGhost, side === 'left' ? styles.cornerLeft : styles.cornerRight, { top, width, height }]}>
            <Text style={[styles.slotGhostText, visible < entries && styles.slotGhostTextShort]}>
                {label} {visible}/{entries}
            </Text>
            {Array.from({ length: visible }, (_, i) => (
                <View key={i} style={styles.slotGhostRow} />
            ))}
        </View>
    );
};

const Backdrop = ({ kind }: { kind: BackdropKind }) => {
    if (kind === 'map') {
        return (
            <View style={styles.backdrop}>
                <FreeMap points={(ROUTE_DATA as { points: never[] }).points} draggable={false} followPosition />
            </View>
        );
    }
    return (
        <View style={styles.backdrop}>
            <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Text style={styles.backdropText}>{kind === 'video' ? 'Video' : 'StreetView'}</Text>
        </View>
    );
};

const ArrangementBadge = ({ arrangement, width }: { arrangement: string; width: number }) => (
    <View style={[styles.absolute, styles.badge, { maxWidth: width }]}>
        <Text style={styles.badgeText}>{arrangement}</Text>
    </View>
);

/** `ride-overlay-layout-design.md` §5.8 — the decision inputs, on screen, while tuning. */
const DebugPanel = ({ layout, bottom }: { layout: RideOverlayLayout; bottom: number }) => {
    const i = layout.inputs;
    const round = (v?: number) => (v === undefined ? '—' : Math.round(v * 10) / 10);
    return (
        <View style={[styles.absolute, styles.debug, { bottom }]}>
            <Text style={styles.debugText}>
                {i.screenWidth}×{i.screenHeight} ({i.screenLayout}) · N={i.itemCount} · map={String(i.mapVisible)}
            </Text>
            <Text style={styles.debugText}>
                W_rd={round(i.rideDashboardWidth)} → eff {round(i.rideDashboardWidthEffective)}
            </Text>
            <Text style={styles.debugText}>
                ear={round(i.earWidth)} (min {SIDE_WIDGET_MIN_WIDTH}) · W_wd={round(i.workoutDashboardWidth)}
            </Text>
        </View>
    );
};

/** The free vertical band in an ear: from the bottom of its corner widget down to the bottom bar,
 *  less a slot gap at each end.
 *
 *  Deliberately does NOT subtract a standing reserve for §8.6's gear-shift control. An earlier draft
 *  did, and it cost ~220 px of screen-height requirement - enough to take a 430 px-tall landscape
 *  frame from 8 list rows down to 1. The shifter is bottom-anchored and only exists on rides with
 *  virtual shifting, so it should claim its space when it is actually there, not permanently. */
const earFreeBand = (frameHeight: number, cornerWidgetBottom: number): number =>
    frameHeight - BOTTOM_BAR_RATIO * frameHeight - cornerWidgetBottom - 16;

const noop = () => undefined;

const mirror = <T extends { left?: number; right?: number }>(rect: T): T => ({
    ...rect,
    left: rect.right,
    right: rect.left,
});

const rectStyle = (rect: { top: number; left?: number; right?: number; width: number; height: number }) => ({
    top: rect.top,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
});

// ---------------------------------------------------------------------------
// Stories
//
// Frames are chosen by which ARRANGEMENT they trigger, not by device tier — the whole point of
// §5.2's computed fit-check. `ride-overlay-layout-design.md` §7.1's worked matrix is the source
// for each size; the debug panel on each story shows the numbers that produced the verdict.
// ---------------------------------------------------------------------------

const meta: Meta<typeof RideOverlayPrototypeView> = {
    title: 'Pages/RidePage/RideOverlayPrototype',
    component: RideOverlayPrototypeView,
    args: {
        itemCount: 7,
        backdrop: 'video',
        workoutAttached: true,
        stopMechanism: 'none',
        sideAssignment: 'map-left',
        graphMode: 'strip',
        cornerSlot: 'elevation',
        showGearGhost: false,
        showPhase3Ghosts: false,
        phase3Entries: PHASE3_TYPICAL_ENTRIES,
        showDebug: true,
    },
    argTypes: {
        backdrop: { control: 'inline-radio', options: ['map', 'streetview', 'video'] },
        stopMechanism: { control: 'inline-radio', options: ['none', 'button', 'longpress'] },
        sideAssignment: { control: 'inline-radio', options: ['map-left', 'map-right'] },
        graphMode: { control: 'inline-radio', options: ['strip', 'live'] },
        cornerSlot: { control: 'inline-radio', options: ['elevation', 'workout'] },
    },
};

export default meta;

type Story = StoryObj<typeof RideOverlayPrototypeView>;

const frame = (width: number, height: number) => ({ frameWidth: width, frameHeight: height });

/** `block-side` needs `screenWidth ≥ W_rd_eff + 2·(200 + 8)` = 1311.6 at 7 tiles, so a large
 *  landscape tablet: 1400×900, ears 244. The roomiest arrangement. */
export const BlockSide: Story = { args: { ...frame(1400, 900) } };

/** 1194×834 (iPad Air) — the common tablet case. The ears take their 200 px floor and
 *  `WorkoutDashboard` takes the remaining 778: a SHALLOW T, not the narrow 320 one the untuned
 *  cascade produced (that render is what drove the retune — see the file header). */
export const TSide: Story = { args: { ...frame(1194, 834) } };

/** A small landscape tablet: 860×480. Below the `t-side` floor (`2·(200+8) + 480` = 896), so the
 *  corner map and elevation preview are **dropped** — relocating them under the column (the design
 *  doc's original `-below`) left the Video/GPX main view as a sliver, and the main view is the point
 *  of a route ride (repo-owner review, 2026-08-11). Note the `RideDashboard` overflow — a
 *  pre-existing bug (`ride-overlay-layout-design.md` §5.7), left visible rather than hidden. */
export const ColumnOnly: Story = { args: { ...frame(860, 480) } };

/** The same arrangement on the narrowest landscape frame that is still non-compact. */
export const ColumnOnlyNarrow: Story = { args: { ...frame(640, 430) } };

/** §6.1 — a landscape phone (844×390 → compact). No side region exists at all: `RideDashboard`
 *  is `alignSelf:'stretch'`, so the arrangement is the §5.4 fallback by construction. */
export const Fallback: Story = { args: { ...frame(844, 390) } };

/** The same phone with §5.4's corner slot toggled to the workout graph. */
export const FallbackWorkoutSlot: Story = { args: { ...frame(844, 390), cornerSlot: 'workout' } };

/**
 * HLD Open Question 5, live. The Gear tile appears mid-ride and makes `RideDashboard` 152 px
 * NARROWER (it forces `icon-top`). 1280×800 sits inside the only band where that still changes
 * the arrangement — 1159 ≤ screenWidth < 1311.6 — so this pair is the worst case the settle
 * window has to absorb. Compare with `Oq5GearOn`. On 1112×834 (the design doc's own example)
 * the retuned algorithm produces the identical layout at 7 and 8 tiles.
 */
export const Oq5GearOff: Story = { args: { ...frame(1280, 800), itemCount: 7 } };

/** The other half of the OQ5 pair — same screen, Gear tile present: `t-side` → `block-side`. */
export const Oq5GearOn: Story = { args: { ...frame(1280, 800), itemCount: 8 } };

/** OQ2 — the same frame with the ears swapped. */
export const BlockSideMapRight: Story = { args: { ...frame(1400, 900), sideAssignment: 'map-right' } };

/** OQ4 — the `live` graph mode inside `WorkoutDashboard` at the generous block width. */
export const BlockSideLiveGraph: Story = { args: { ...frame(1400, 900), graphMode: 'live' } };

/** OQ4's hard case — `live` mode at the narrow-T width (320 px). */
export const TSideLiveGraph: Story = { args: { ...frame(1194, 834), graphMode: 'live' } };

/** OQ3, mechanism A, roomiest arrangement — the button in `WorkoutDashboard`'s reserved column. */
export const StopButtonBlockSide: Story = { args: { ...frame(1400, 900), stopMechanism: 'button' } };

/** OQ3, mechanism A, tightest non-fallback arrangement — the T, where the reserved column has to
 *  share the width with the graph and the steps list. */
export const StopButtonTSide: Story = { args: { ...frame(1194, 834), stopMechanism: 'button' } };

/** OQ3, mechanism A, at the narrowest width `WorkoutDashboard` is ever asked to render
 *  (`WORKOUT_DASH_MIN_WIDTH` = 480, reached just above the `below` boundary). */
export const StopButtonMinWidth: Story = { args: { ...frame(900, 800), stopMechanism: 'button' } };

/** OQ3, mechanism A, §6.5's binding constraint — the fallback has no `WorkoutDashboard` at all,
 *  so the button needs a slot of its own. */
export const StopButtonFallback: Story = { args: { ...frame(844, 390), stopMechanism: 'button' } };

/** OQ3, mechanism B — long-press, with the discoverability hint it would need. */
export const StopLongPressBlockSide: Story = { args: { ...frame(1400, 900), stopMechanism: 'longpress' } };

/** OQ3, mechanism B on the phone — the same hint competing with the fallback's own additions. */
export const StopLongPressFallback: Story = { args: { ...frame(844, 390), stopMechanism: 'longpress' } };

/** OQ6 — a hypothetical gear-shift trigger on the combined screen, drawn in the slot session 4.1
 *  recommends: bottom-anchored in the right ear. */
export const GearGhostTSide: Story = { args: { ...frame(1194, 834), showGearGhost: true } };

/**
 * §5.5's reserved Phase 3 slots, occupied — the check the arrangement budget was designed for but
 * that nothing had actually rendered. `NearbyRiders` stacks under the corner Map (left ear),
 * `PrevRides` under the Elevation preview (right ear), and the gear-shift trigger sits
 * bottom-anchored below both so an informational occupant appearing never moves a control.
 */
export const Phase3SlotsTSide: Story = {
    args: { ...frame(1194, 834), showPhase3Ghosts: true, showGearGhost: true, backdrop: 'streetview' },
};

/** The same, with the ears at their most generous. */
export const Phase3SlotsBlockSide: Story = {
    args: { ...frame(1400, 900), showPhase3Ghosts: true, showGearGhost: true, backdrop: 'streetview' },
};

/** The tightest ear the side arrangements produce — a large phone in landscape, still non-compact.
 *  If the Phase 3 budget breaks anywhere, it breaks here. */
export const Phase3SlotsTight: Story = {
    args: { ...frame(932, 430), showPhase3Ghosts: true, showGearGhost: true, backdrop: 'streetview' },
};

/** Both lists at their 10-entry cap — the worst case, not the common one. Shown so the clamp is
 *  visible: where the ear runs out, the header reports `visible/total` rather than overflowing. */
export const Phase3SlotsFullLists: Story = {
    args: {
        ...frame(1194, 834),
        showPhase3Ghosts: true,
        showGearGhost: true,
        phase3Entries: PHASE3_MAX_ENTRIES,
        backdrop: 'streetview',
    },
};

/** The 10-entry cap on the tightest ear — where the clamp actually bites. */
export const Phase3SlotsFullListsTight: Story = {
    args: {
        ...frame(932, 430),
        showPhase3Ghosts: true,
        showGearGhost: true,
        phase3Entries: PHASE3_MAX_ENTRIES,
        backdrop: 'streetview',
    },
};

/** Phase 3 slots on a ROUTE-ONLY ride — neither widget is workout-specific, so the budget has to
 *  hold on today's layout too, where the corner widgets sit higher. */
export const Phase3SlotsRouteOnly: Story = {
    args: { ...frame(1194, 834), showPhase3Ghosts: true, showGearGhost: true, workoutAttached: false, backdrop: 'streetview' },
};

/** `column-only` has no ears at all, so there is nowhere for them — the arg is on and nothing
 *  renders. That is the finding, not a bug. */
export const Phase3SlotsColumnOnly: Story = {
    args: { ...frame(860, 480), showPhase3Ghosts: true, showGearGhost: true },
};

/** The phone fallback has exactly one corner slot and it is already a 2-way toggle, so PrevRides is
 *  suppressed here too — extending the existing cycle is the only mechanism that could fit. */
export const Phase3SlotsFallback: Story = {
    args: { ...frame(844, 390), showPhase3Ghosts: true, showGearGhost: true },
};

/** OQ6, the case HLD §6.4 actually requires: the same trigger on a ROUTE-ONLY ride, which is
 *  where a shifter is relevant with or without a workout. */
export const GearGhostRouteOnly: Story = {
    args: { ...frame(1194, 834), showGearGhost: true, workoutAttached: false },
};

/** OQ6 on a phone route-only ride — the tightest case for a shift control. */
export const GearGhostRouteOnlyPhone: Story = {
    args: { ...frame(844, 390), showGearGhost: true, workoutAttached: false, backdrop: 'map' },
};

/** The route-only reference render (HLD §9.1: "must render identically to today"). */
export const RouteOnly: Story = { args: { ...frame(1400, 900), workoutAttached: false } };

/** A GPX ride whose main view IS a map — the corner map is redundant, so the left ear is empty
 *  (`ride-overlay-layout-design.md` §1.3.1/§5.3). */
export const BlockSideNoCornerMap: Story = { args: { ...frame(1400, 900), backdrop: 'map' } };

/** A StreetView GPX ride (session 0.3's corner map) — both ears occupied. */
export const TSideStreetViewGpx: Story = { args: { ...frame(1194, 834), backdrop: 'streetview' } };

/**
 * OQ1's direct instrument. `SIDE_WIDGET_MIN_WIDTH` = 160 is the single most consequential
 * constant (§7.2: it decides block-vs-T across the 1024–1230 px band, where most Incyclist
 * tablet users are). This renders the two real ear occupants at candidate widths so the claim
 * "below this it stops conveying anything" can be checked rather than assumed.
 */
export const SideWidgetWidthRuler = {
    render: () => (
        <View style={styles.ruler}>
            {[140, 160, 184, 200, 220].map(width => (
                <View key={width} style={styles.rulerCol}>
                    <Text style={styles.rulerLabel}>{width} px</Text>
                    <View style={[styles.cornerWidget, styles.rulerSlot, { width }]}>
                        <ElevationGraphView
                            width={width}
                            height={RULER_SLOT_HEIGHT}
                            showLine
                            showColors
                            showXAxis
                            showYAxis
                            {...computeGraphPoints(ROUTE_DATA, width, RULER_SLOT_HEIGHT, { range: 2000, position: 10000 })}
                        />
                    </View>
                    <View style={[styles.cornerWidget, styles.rulerSlot, { width }]}>
                        <FreeMap points={(ROUTE_DATA as { points: never[] }).points} draggable={false} followPosition />
                    </View>
                </View>
            ))}
        </View>
    ),
};

/**
 * The other half of OQ1. `WORKOUT_DASH_MIN_WIDTH` = 320 was derived (§7's table) from
 * `WorkoutStepsList`'s compact width plus room for a graph Y axis — but that predates session
 * 3.1's rework into a three-column bar (text row + graph | steps | controls). This renders the
 * real widget at candidate widths so the floor can be set from what stays readable, not from
 * the superseded composition.
 */
export const WorkoutDashboardWidthRuler = {
    render: () => (
        <View style={styles.rulerColumn}>
            {[320, 400, 480, 560, 640].map(width => (
                <View key={width} style={styles.rulerRow}>
                    <Text style={styles.rulerLabel}>{width}</Text>
                    <View style={{ width }}>
                        <WorkoutDashboard {...MOCK_DASHBOARD_MID_INTERVAL} />
                    </View>
                </View>
            ))}
        </View>
    ),
};

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    frame: {
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: colors.background,
    },
    absolute: {
        position: 'absolute',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 20,
        fontWeight: '700',
    },
    dashboardContainer: {
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    dashboardCompact: {
        left: 0,
        right: 0,
    },
    dashboardTablet: {
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    cornerLeft: {
        left: 0,
    },
    cornerRight: {
        right: 0,
    },
    cornerWidget: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        overflow: 'hidden',
        zIndex: 10,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 5,
    },
    menuButton: {
        width: 82,
        paddingHorizontal: 8,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: colors.buttonPrimary,
        alignItems: 'center',
    },
    menuButtonText: {
        color: colors.text,
        fontWeight: '700',
    },
    fallbackShoutout: {
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 11,
    },
    fallbackShoutoutText: {
        color: colors.text,
        backgroundColor: 'rgba(0,0,0,0.45)',
        fontWeight: '700',
        fontSize: textSizes.subtitle,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    fallbackStopSlot: {
        left: 8,
        zIndex: 11,
    },
    stopButton: {
        minWidth: 56,
        minHeight: 44,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    stopButtonCompact: {
        minWidth: 48,
    },
    stopGlyph: {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: colors.text,
    },
    stopLabel: {
        color: colors.text,
        fontSize: 10,
        lineHeight: 11,
        textAlign: 'center',
    },
    stopLabelCompact: {
        fontSize: 9,
        lineHeight: 10,
    },
    longPressHint: {
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 11,
    },
    longPressHintText: {
        color: colors.text,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    longPressHintTextCompact: {
        fontSize: 10,
    },
    longPressToast: {
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 12,
    },
    longPressToastText: {
        color: colors.text,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 6,
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    slotGhost: {
        position: 'absolute',
        paddingBottom: 4,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.55)',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        zIndex: 10,
    },
    slotGhostText: {
        textAlign: 'center',
        paddingVertical: 3,
        color: colors.text,
        fontWeight: '700',
    },
    slotGhostTextShort: {
        color: '#ffcf70',
    },
    slotGhostRow: {
        alignSelf: 'stretch',
        height: PHASE3_ROW_HEIGHT - 6,
        marginHorizontal: 6,
        marginBottom: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    gearGhost: {
        right: 8,
        alignItems: 'center',
        gap: 4,
        zIndex: 12,
    },
    gearGhostButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.6)',
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gearGhostButtonCompact: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    gearGhostLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    gearGhostText: {
        color: colors.text,
        fontWeight: '700',
    },
    badge: {
        top: 0,
        left: 0,
        backgroundColor: 'rgba(255,180,0,0.85)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        zIndex: 20,
    },
    badgeText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 12,
    },
    debug: {
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        zIndex: 20,
    },
    debugText: {
        color: '#8fe',
        fontSize: 11,
        lineHeight: 14,
    },
    ruler: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        padding: 16,
        backgroundColor: colors.background,
    },
    rulerCol: {
        gap: 8,
    },
    rulerLabel: {
        color: colors.text,
        fontWeight: '700',
    },
    rulerSlot: {
        position: 'relative',
        height: RULER_SLOT_HEIGHT,
    },
    rulerColumn: {
        gap: 12,
        padding: 16,
        backgroundColor: colors.background,
    },
    rulerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
