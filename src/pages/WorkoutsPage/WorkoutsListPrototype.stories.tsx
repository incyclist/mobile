import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import type {
    ScheduledWorkoutItemProps,
    UpcomingTrainingProps,
    WorkoutListContentProps,
    WorkoutListItemProps,
} from 'incyclist-services';
import { GroupPicker, MainBackground, TNavigationItem, WorkoutItemView } from '../../components';
import { NavigationBarView } from '../../components/NavigationBar/NavigationBarView';
import { NavigationBarViewCompact } from '../../components/NavigationBar/NavigationBarViewCompact';
import { Icon } from '../../components/Icon';
import { WorkoutGraphPlan } from '../../components/WorkoutGraph';
import { MOCK_PLAN, MOCK_PLAN_SHORT } from '../../components/WorkoutGraph/WorkoutGraph.mock';
import { colors, textSizes } from '../../theme';

/**
 * Session 4.1 — visual layout checkpoint for the Workouts list screen
 * (workout-mobile-hld.md §5, workout-list-page-service-design.md §4).
 *
 * This is a PROTOTYPE assembled inside the story file: it composes the real
 * `WorkoutItemView`/`WorkoutGraph`/`ChipSelect`/`NavigationBar` components into
 * the `WorkoutsPage`/`WorkoutsTable` layout, driven by hand-authored mock data.
 * No real service, no real navigation — the real page wiring is session 5.2
 * (`WorkoutsTable`/`WorkoutsPage` against `WorkoutListPageService`).
 *
 * Mock shapes mirror `WorkoutListContentProps` (design doc §4) with
 * `workout: Workout` replaced by a ready-made `plan: WorkoutGraphPlan` — the
 * same substitution `WorkoutItemDisplayProps` makes (see WorkoutItem/types.ts)
 * while `getWorkoutGraphSeries()` lives in services session 2.2.
 *
 * NOTE (§11.3): today's Upcoming row deliberately has NO direct Start button —
 * that idea was rejected on review (2026-07-19): the post-pairing prompt covers
 * the fast path, and a quick-start button doesn't survive Phase 2's
 * "start with route". Today's row is tapped exactly like any other row.
 */

type MockScheduledRow = Omit<ScheduledWorkoutItemProps, 'workout'> & { plan: WorkoutGraphPlan };
type MockWorkoutRow = Omit<WorkoutListItemProps, 'workout'> & { plan: WorkoutGraphPlan };
type MockUpcoming = Omit<UpcomingTrainingProps, 'items'> & { items: MockScheduledRow[] };
type MockContent = Omit<WorkoutListContentProps, 'upcoming' | 'workouts'> & {
    upcoming: MockUpcoming | null;
    workouts: MockWorkoutRow[];
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const day = (offset: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
};

/** Story-local stand-in for the smart `WorkoutItem`'s formatDateTime call. */
const dateLabel = (item: MockScheduledRow): string =>
    item.isToday
        ? 'Today'
        : item.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

const mockScheduled = (n: number): MockScheduledRow[] =>
    [
        { id: 'sched-1', title: 'Sweet Spot 3x12', date: day(0), duration: '60min', isToday: true, selected: false, plan: MOCK_PLAN },
        { id: 'sched-2', title: 'VO2 Max Repeats', date: day(2), duration: '35min', isToday: false, selected: false, plan: MOCK_PLAN_SHORT },
        { id: 'sched-3', title: 'Endurance + Bursts', date: day(4), duration: '75min', isToday: false, selected: false, plan: MOCK_PLAN },
        { id: 'sched-4', title: 'Recovery Spin', date: day(6), duration: '30min', isToday: false, selected: false, plan: MOCK_PLAN_SHORT },
    ].slice(0, n);

const mockUpcoming = (entries: number): MockUpcoming => ({
    items: mockScheduled(entries),
    collapsedCount: 2,
    todayId: 'sched-1',
});

const MOCK_WORKOUTS: MockWorkoutRow[] = [
    { id: 'w-1', title: '3x VO2 Max Intervals', group: 'FTP Builder', duration: '35min', selected: false, canDelete: true, plan: MOCK_PLAN },
    { id: 'w-2', title: 'Sweet Spot Base', group: 'FTP Builder', duration: '60min', selected: false, canDelete: true, plan: MOCK_PLAN },
    { id: 'w-3', title: 'Recovery Spin', group: 'My Workouts', duration: '10min', selected: false, canDelete: true, plan: MOCK_PLAN_SHORT },
    { id: 'w-4', title: 'Threshold Progression', group: 'My Workouts', duration: '45min', selected: false, canDelete: true, plan: MOCK_PLAN },
    { id: 'w-5', title: 'Extended Endurance with Cooldown', group: 'Zwift Academy 2021', duration: '90min', selected: false, canDelete: true, plan: MOCK_PLAN },
    { id: 'w-6', title: 'Anaerobic Capacity', group: 'Zwift Academy 2021', duration: '25min', selected: false, canDelete: true, plan: MOCK_PLAN_SHORT },
    { id: 'w-7', title: 'Tempo Blocks', group: 'FTP Builder', duration: '50min', selected: false, canDelete: true, plan: MOCK_PLAN },
    { id: 'w-8', title: 'Openers', group: 'My Workouts', duration: '20min', selected: false, canDelete: true, plan: MOCK_PLAN_SHORT },
];

const MOCK_CONTENT: MockContent = {
    pageType: 'list',
    loading: false,
    upcoming: mockUpcoming(4),
    groups: { available: ['My Workouts', 'FTP Builder', 'Zwift Academy 2021'], selected: null },
    workouts: MOCK_WORKOUTS,
    selectedId: null,
    isEmpty: false,
};

// ---------------------------------------------------------------------------
// Prototype view
// ---------------------------------------------------------------------------

const ALL_GROUPS = 'All';

/**
 * Slim Upcoming-Training row per HLD §5: "compact rows (name, date badge,
 * duration)" — deliberately graph-less and ~half the height of a full
 * `WorkoutItemView` row, so the collapsed section leaves room for library rows
 * even on the phone frame. `isToday` = informational highlight only (§3.1),
 * tap opens details like every other row (§11.3 — no quick-start button).
 */
interface ScheduledRowProps {
    item: MockScheduledRow;
    onOpenDetails: (id: string) => void;
}

const ScheduledRow = ({ item, onOpenDetails }: ScheduledRowProps) => (
    <TouchableOpacity
        style={[styles.slimRow, item.isToday && styles.slimRowToday]}
        onPress={() => onOpenDetails(item.id)}
        activeOpacity={0.9}
    >
        <View style={[styles.dateBadge, item.isToday && styles.dateBadgeToday]}>
            <Text style={[styles.dateBadgeText, item.isToday && styles.dateBadgeTextToday]}>
                {dateLabel(item)}
            </Text>
        </View>
        <Text style={styles.slimTitle} numberOfLines={1}>
            {item.title}
        </Text>
        <Text style={styles.slimDuration}>{item.duration}</Text>
    </TouchableOpacity>
);

interface WorkoutsListPrototypeProps {
    data: MockContent;
    compact: boolean;
    /** Vertical-nav icon size — the smart NavigationBar derives it from the window height (height/16, max 64). */
    navIconSize?: number;
    /** Start with the Upcoming section already expanded past `collapsedCount`. */
    initiallyExpanded?: boolean;
    onNavigate: (item: TNavigationItem) => void;
    onImport: () => void;
    onOpenDetails: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectGroup: (group: string | null) => void;
}

const WorkoutsListPrototypeView = (props: WorkoutsListPrototypeProps) => {
    const { data, compact, navIconSize = 50, initiallyExpanded, onNavigate, onImport, onOpenDetails, onDelete, onSelectGroup } = props;

    // The real service returns `workouts` already filtered by `groups.selected`
    // (design doc §12) — local filter state here only makes the chips
    // interactive inside the story.
    const [group, setGroup] = useState<string | null>(data.groups.selected);
    // Two independent mechanisms per HLD §5: the chevron collapses the whole
    // section to its header; "Show all (N)" expands past `collapsedCount`.
    const [sectionCollapsed, setSectionCollapsed] = useState(false);
    const [expanded, setExpanded] = useState(!!initiallyExpanded);

    const workouts = group ? data.workouts.filter((w) => w.group === group) : data.workouts;

    const upcoming = data.upcoming;
    const upcomingRows = upcoming && !sectionCollapsed
        ? (expanded ? upcoming.items : upcoming.items.slice(0, upcoming.collapsedCount))
        : [];
    const hiddenCount = upcoming ? upcoming.items.length - upcomingRows.length : 0;
    const showToggle = !!upcoming && !sectionCollapsed && upcoming.items.length > upcoming.collapsedCount;

    const handleGroup = (value: string) => {
        const selected = value === ALL_GROUPS ? null : value;
        setGroup(selected);
        onSelectGroup(selected);
    };

    return (
        <MainBackground>
            <View style={[styles.container, compact && styles.containerCompact]}>
                {/* Pure nav views, not the smart NavigationBar — it picks its
                    layout from the real browser window (useScreenLayout), which
                    would ignore the fixed device frame. */}
                <View style={[styles.navColumn, compact ? styles.navColumnCompact : styles.navColumnNormal]}>
                    {compact ? (
                        <NavigationBarViewCompact selected="workouts" onClick={onNavigate} showExit={false} />
                    ) : (
                        <NavigationBarView
                            selected="workouts"
                            onClick={onNavigate}
                            iconSize={navIconSize}
                            navWidth={150}
                            showExit={false}
                        />
                    )}
                </View>

                <View style={styles.contentColumn}>
                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <Text style={styles.headerTitle}>WORKOUTS</Text>
                        <View style={styles.headerSide}>
                            <TouchableOpacity style={styles.importButton} onPress={onImport} activeOpacity={0.7}>
                                <Icon name="import-route" size={20} color={colors.buttonPrimary} />
                                <Text style={styles.importButtonText}>Import Workouts</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {data.isEmpty ? (
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No workouts found</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.listArea}>
                            {upcoming && (
                                <View style={styles.upcomingSection}>
                                    <TouchableOpacity
                                        style={styles.sectionHeader}
                                        onPress={() => setSectionCollapsed(!sectionCollapsed)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon
                                            name={sectionCollapsed ? 'chevron-down' : 'chevron-up'}
                                            size={16}
                                            color={colors.text}
                                        />
                                        <Text style={styles.sectionTitle}>Upcoming Training</Text>
                                        <Text style={styles.sectionCount}>({upcoming.items.length})</Text>
                                    </TouchableOpacity>

                                    {upcomingRows.map((item) => (
                                        <ScheduledRow key={item.id} item={item} onOpenDetails={onOpenDetails} />
                                    ))}

                                    {showToggle && (
                                        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
                                            <Text style={styles.showAllText}>
                                                {hiddenCount > 0 ? `Show ${hiddenCount} more` : 'Show less'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.sectionDivider} />
                                </View>
                            )}

                            {/* Group filter opens the library block — it only
                                filters the flat list (Upcoming is never
                                group-filtered, §12), so it must not sit above
                                the Upcoming section. GroupPicker (not raw
                                ChipSelect): it falls back to a SingleSelect
                                dropdown past 5 options, so many groups can't
                                overflow the chip row. allowNew=false — you
                                can't filter by a group that doesn't exist. */}
                            {data.groups.available.length > 0 && (
                                <View style={styles.filterArea}>
                                    <GroupPicker
                                        label="Group"
                                        groups={[ALL_GROUPS, ...data.groups.available]}
                                        value={group ?? ALL_GROUPS}
                                        allowNew={false}
                                        onValueChange={handleGroup}
                                    />
                                </View>
                            )}

                            {workouts.map((item) => (
                                <WorkoutItemView
                                    key={item.id}
                                    {...item}
                                    onOpenDetails={onOpenDetails}
                                    onDelete={onDelete}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </MainBackground>
    );
};

// ---------------------------------------------------------------------------
// Stories — fixed device frames (app is landscape-locked, see Loader.tsx)
// ---------------------------------------------------------------------------

/**
 * Unlike the usual page-story decorator (`useWindowDimensions` + minHeight /
 * minWidth filling the browser window), the checkpoint needs deterministic
 * sizes — each story renders inside a fixed-dp device frame instead.
 */
const deviceFrame = (width: number, height: number) =>
    function DeviceFrame(Story: React.ComponentType) {
        return (
            <View style={[styles.deviceFrame, { width, height }]}>
                <Story />
            </View>
        );
    };

const TABLET_10 = deviceFrame(1280, 800);
const TABLET_7 = deviceFrame(1024, 600);
const PHONE = deviceFrame(800, 360); // height < 420 -> compact nav (RoutesPage breakpoint)

const meta: Meta<typeof WorkoutsListPrototypeView> = {
    title: 'Pages/WorkoutsPage/ListPrototype',
    component: WorkoutsListPrototypeView,
    args: {
        onNavigate: fn(),
        onImport: fn(),
        onOpenDetails: fn(),
        onDelete: fn(),
        onSelectGroup: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutsListPrototypeView>;

export const Tablet10: Story = {
    decorators: [TABLET_10],
    args: { data: MOCK_CONTENT, compact: false, navIconSize: 50 },
};

export const Tablet7: Story = {
    decorators: [TABLET_7],
    args: { data: MOCK_CONTENT, compact: false, navIconSize: 38 },
};

export const Phone: Story = {
    decorators: [PHONE],
    args: { data: MOCK_CONTENT, compact: true },
};

export const PhoneUpcomingExpanded: Story = {
    decorators: [PHONE],
    args: { data: MOCK_CONTENT, compact: true, initiallyExpanded: true },
};

/** 1 entry <= collapsedCount: the "Show all (N)" toggle must not appear. */
export const SingleUpcomingEntry: Story = {
    decorators: [TABLET_7],
    args: {
        data: { ...MOCK_CONTENT, upcoming: mockUpcoming(1) },
        compact: false,
        navIconSize: 38,
    },
};

/**
 * More than GroupPicker's 5-option chip threshold: the filter row falls back
 * to the SingleSelect dropdown instead of overflowing the chip row.
 */
export const ManyGroups: Story = {
    decorators: [TABLET_7],
    args: {
        data: {
            ...MOCK_CONTENT,
            groups: {
                available: [
                    'My Workouts', 'FTP Builder', 'Zwift Academy 2021',
                    'Climbing Prep', 'Base Season', 'Sprint Work', 'Recovery',
                ],
                selected: null,
            },
        },
        compact: false,
        navIconSize: 38,
    },
};

/** `upcoming: null` = no scheduled workouts -> the whole section is hidden. */
export const NoUpcoming: Story = {
    decorators: [PHONE],
    args: {
        data: { ...MOCK_CONTENT, upcoming: null },
        compact: true,
    },
};

export const EmptyState: Story = {
    decorators: [TABLET_7],
    args: {
        data: {
            ...MOCK_CONTENT,
            upcoming: null,
            groups: { available: [], selected: null },
            workouts: [],
            isEmpty: true,
        },
        compact: false,
        navIconSize: 38,
    },
};

const styles = StyleSheet.create({
    deviceFrame: {
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    containerCompact: {
        flexDirection: 'column',
    },
    navColumn: {
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
    navColumnNormal: {
        width: 150,
    },
    navColumnCompact: {
        height: 56,
        width: '100%',
    },
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    headerTitle: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
        fontWeight: '700',
        textAlign: 'center',
    },
    headerSide: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
    },
    importButtonText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '500',
    },
    filterArea: {
        paddingHorizontal: 12,
    },
    listArea: {
        flex: 1,
    },
    upcomingSection: {},
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionCount: {
        color: colors.text,
        opacity: 0.6,
        fontSize: textSizes.smallText,
    },
    slimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.listItemBackground,
        marginVertical: 2,
        marginHorizontal: 12,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    slimRowToday: {
        borderLeftWidth: 3,
        borderLeftColor: colors.buttonPrimary,
    },
    dateBadge: {
        minWidth: 72,
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dateBadgeToday: {
        backgroundColor: colors.buttonPrimary,
    },
    dateBadgeText: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '600',
    },
    dateBadgeTextToday: {
        color: colors.background,
    },
    slimTitle: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: 'bold',
    },
    slimDuration: {
        color: colors.text,
        opacity: 0.8,
        fontSize: textSizes.smallText,
    },
    showAllText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.smallText,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    sectionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.12)',
        marginHorizontal: 12,
        marginVertical: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
    },
});
