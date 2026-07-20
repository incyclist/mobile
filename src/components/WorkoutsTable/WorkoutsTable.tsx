import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import {
    Observer,
    getWorkoutGraphSeries,
    getWorkoutListPageService,
    formatDateTime,
    WorkoutGraphPlan,
    ScheduledWorkoutItemProps,
    WorkoutListItemProps,
    Workout,
} from 'incyclist-services';
import { WorkoutItem } from '../WorkoutItem';
import { GroupPicker } from '../GroupPicker';
import { Dynamic } from '../Dynamic';
import { Icon } from '../Icon';
import { useLogging, useUnmountEffect } from '../../hooks';
import { colors, textSizes } from '../../theme';
import { WorkoutsTableProps } from './types';

const LOOKAHEAD = 5;
const ITEM_HEIGHT = 84; // WorkoutItemView height (76) + marginVertical (4 * 2), matches RoutesTable/ActivitiesTable convention
const ALL_GROUPS = 'All';

// No live/selected FTP context at the list-row level (WorkoutDetailsProps.ftp only exists once a
// workout is opened) — matches getStartSettings()'s own fallback default. Bars stay in %FTP
// (absValues:false), so this nominal value only affects zone classification of watt-defined steps
// (%-defined steps, the common case, are unaffected); getZone() needs a defined ftp at all to
// color bars — without one every bar renders uncolored (zone 0).
const PREVIEW_FTP = 200;

/** Preview graph for list rows: zone-colored, no FTP line (mirrors strip mode's defaults). */
const buildPlan = (workout: Workout): WorkoutGraphPlan => {
    const bars = getWorkoutGraphSeries(workout, { ftp: PREVIEW_FTP, absValues: false });
    const lastX = bars.length ? bars[bars.length - 1].x : 0;
    const maxY = bars.length ? Math.max(...bars.map(b => b.y)) : 100;

    return {
        bars,
        ftp: 0,
        ftpLine: 0,
        domain: { x: [0, lastX], y: [0, Math.round(maxY * 1.1)] },
    };
};

/**
 * Slim, graph-less Upcoming row — phone/compact only (HLD §5, session 4.1 review round 2).
 * Tablets keep the full `WorkoutItem` (with the graph) since height isn't scarce there.
 * `isToday` is the informational highlight only (§3.1) — tapped exactly like any other row.
 * Self-contained (calls the page service directly), matching `RouteItem`/`WorkoutItem`'s own
 * pattern rather than taking a callback prop.
 */
interface ScheduledRowProps {
    item: ScheduledWorkoutItemProps;
}

const ScheduledRow = ({ item }: ScheduledRowProps) => {
    const page = getWorkoutListPageService();
    const handlePress = useCallback(() => page.onOpenDetails(item.id), [item.id, page]);
    const dateLabel = item.isToday ? 'Today' : formatDateTime(item.date, '%d.%m.%Y');

    return (
        <TouchableOpacity
            style={[styles.slimRow, item.isToday && styles.slimRowToday]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={[styles.dateBadge, item.isToday && styles.dateBadgeToday]}>
                <Text style={[styles.dateBadgeText, item.isToday && styles.dateBadgeTextToday]}>
                    {dateLabel}
                </Text>
            </View>
            <Text style={styles.slimTitle} numberOfLines={1}>
                {item.title}
            </Text>
            <Text style={styles.slimDuration}>{item.duration}</Text>
        </TouchableOpacity>
    );
};

export const WorkoutsTable = ({ data, compact, onSelectGroup }: WorkoutsTableProps) => {
    const { upcoming, groups, workouts, isEmpty } = data;
    const { logEvent } = useLogging('WorkoutsTable');

    const [sectionCollapsed, setSectionCollapsed] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [preambleHeight, setPreambleHeight] = useState(0);

    const refInitialized = useRef(false);
    const [workoutsObserver] = useState(() => new Observer());

    // Synchronously compute initial fold state during render, like RoutesTable/ActivitiesTable.
    const estimatedVisible = Math.ceil(600 / ITEM_HEIGHT);
    const initialActiveCount = estimatedVisible + LOOKAHEAD;

    const initialFoldState = useMemo(
        () => workouts?.map((_, i) => i >= initialActiveCount) ?? [],
        [workouts, initialActiveCount]
    );

    const refElementsOutsideFold = useRef<boolean[]>(initialFoldState);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
    }, []);

    useUnmountEffect(() => {
        refElementsOutsideFold.current = [];
        workoutsObserver.stop();
        refInitialized.current = false;
    });

    // The Upcoming section + filter row sit ABOVE the flat list inside the SAME ScrollView
    // (HLD §5: one continuous ScrollView, not a pinned header) — their combined, variable
    // height must be subtracted from scrollY before it's used to index into `workouts`,
    // otherwise the fold math (borrowed from RoutesTable, which has nothing above its list)
    // would treat the preamble's height as if it were already-scrolled-past rows.
    const onPreambleLayout = useCallback((e: LayoutChangeEvent) => {
        setPreambleHeight(e.nativeEvent.layout.height);
    }, []);

    const onScroll = useCallback((event: any) => {
        if (!workoutsObserver || !refElementsOutsideFold.current) return;

        const scrollY = event.nativeEvent.contentOffset.y - preambleHeight;
        const viewportHeight = event.nativeEvent.layoutMeasurement.height;

        const firstVisible = Math.floor(scrollY / ITEM_HEIGHT);
        const lastVisible = Math.ceil((scrollY + viewportHeight) / ITEM_HEIGHT);

        workouts?.forEach((_, i) => {
            const outsideFold = i > lastVisible + LOOKAHEAD || i < firstVisible;
            const prev = refElementsOutsideFold.current[i] ?? true;

            if (prev !== outsideFold) {
                workoutsObserver.emit(`outsideFold-${i}`, outsideFold);
                refElementsOutsideFold.current[i] = outsideFold;
            }
        });
    }, [workouts, workoutsObserver, preambleHeight]);

    const plans = useMemo(() => {
        const map = new Map<string, WorkoutGraphPlan>();
        upcoming?.items.forEach(item => map.set(item.id, buildPlan(item.workout)));
        workouts?.forEach(item => map.set(item.id, buildPlan(item.workout)));
        return map;
    }, [upcoming, workouts]);

    // Two independent toggles (HLD §5): the chevron collapses the whole section to its
    // header; "Show N more" expands past `collapsedCount`.
    const getUpcomingRows = (): ScheduledWorkoutItemProps[] => {
        if (!upcoming || sectionCollapsed) return [];
        return expanded ? upcoming.items : upcoming.items.slice(0, upcoming.collapsedCount);
    };
    const upcomingRows = getUpcomingRows();
    const hiddenCount = upcoming ? upcoming.items.length - upcomingRows.length : 0;
    const showToggle = !!upcoming && !sectionCollapsed && upcoming.items.length > upcoming.collapsedCount;

    const handleSectionToggle = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'upcoming-collapse', eventSource: 'user' });
        setSectionCollapsed(prev => !prev);
    }, [logEvent]);

    const handleExpandToggle = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'upcoming-show-more', eventSource: 'user' });
        setExpanded(prev => !prev);
    }, [logEvent]);

    const handleGroupChange = useCallback((value: string) => {
        onSelectGroup(value === ALL_GROUPS ? null : value);
    }, [onSelectGroup]);

    const buildScheduledItemProps = (item: ScheduledWorkoutItemProps) => ({
        id: item.id,
        title: item.title,
        group: 'Scheduled',
        duration: item.duration,
        selected: item.selected,
        canDelete: false,
        plan: plans.get(item.id) ?? buildPlan(item.workout),
        date: item.date,
        isToday: item.isToday,
        outsideFold: false,
    });

    const buildWorkoutItemProps = (item: WorkoutListItemProps, outsideFold: boolean) => ({
        id: item.id,
        title: item.title,
        group: item.group,
        duration: item.duration,
        selected: item.selected,
        canDelete: item.canDelete,
        plan: plans.get(item.id) ?? buildPlan(item.workout),
        outsideFold,
    });

    const hasObserver = workoutsObserver != null;

    return (
        <View style={styles.container}>
            <ScrollView onScroll={onScroll} scrollEventThrottle={16} style={styles.scroll}>
                {/* zIndex here too, not just on filterArea below: this wrapper is itself a sibling
                    of the workout rows that follow it (both direct children of the ScrollView
                    content) — RN-web's every-View-gets-zIndex:0 rule means filterArea's zIndex:10
                    would otherwise be trapped inside THIS wrapper's own (default 0) stacking
                    context and still paint under those later rows. */}
                <View onLayout={onPreambleLayout} style={styles.preamble}>
                    {upcoming && (
                        <View style={styles.upcomingSection}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={handleSectionToggle}
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

                            {upcomingRows.map(item => (
                                compact ? (
                                    <ScheduledRow key={item.id} item={item} />
                                ) : (
                                    <WorkoutItem key={item.id} {...buildScheduledItemProps(item)} />
                                )
                            ))}

                            {showToggle && (
                                <TouchableOpacity onPress={handleExpandToggle} activeOpacity={0.7}>
                                    <Text style={styles.showAllText}>
                                        {hiddenCount > 0 ? `Show ${hiddenCount} more` : 'Show less'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.sectionDivider} />
                        </View>
                    )}

                    {/* Filter row must not sit above the Upcoming section (it only filters the
                        flat list, never Upcoming — §12). GroupPicker (not raw ChipSelect): falls
                        back to a SingleSelect dropdown past 5 options. allowNew=false — you can't
                        filter by a group that doesn't exist. Hidden entirely on the true-empty
                        (isEmpty) state, since there are no groups to filter by then. */}
                    {!isEmpty && groups.available.length > 0 && (
                        <View style={styles.filterArea}>
                            <GroupPicker
                                label="Group"
                                groups={[ALL_GROUPS, ...groups.available]}
                                value={groups.selected ?? ALL_GROUPS}
                                allowNew={false}
                                onValueChange={handleGroupChange}
                            />
                        </View>
                    )}
                </View>

                {isEmpty ? (
                    <Text style={styles.emptyText}>No workouts found</Text>
                ) : (
                    <>
                        {workouts.map((item, index) => (
                            <Dynamic
                                key={item.id}
                                observer={workoutsObserver}
                                event={`outsideFold-${index}`}
                                prop="outsideFold"
                            >
                                <WorkoutItem
                                    {...buildWorkoutItemProps(item, hasObserver ? initialFoldState[index] ?? true : true)}
                                />
                            </Dynamic>
                        ))}

                        {workouts.length === 0 && (
                            <Text style={styles.noMatchText}>No workouts in this group</Text>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scroll: {
        flex: 1,
    },
    // Must carry the same zIndex as filterArea below — see the comment at its usage site.
    preamble: {
        zIndex: 10,
    },
    // zIndex lifts the filter row above the workout-row siblings that follow it —
    // RN-web gives every View z-index:0, so SingleSelect's dropdown (zIndex 1000) is trapped
    // inside this wrapper's stacking context and would otherwise paint UNDER later rows.
    filterArea: {
        paddingHorizontal: 12,
        zIndex: 10,
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
    noMatchText: {
        color: colors.text,
        opacity: 0.7,
        fontSize: textSizes.normalText,
        textAlign: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
        paddingVertical: 40,
    },
});
