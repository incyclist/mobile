import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { WorkoutItemViewProps } from './types';
import { colors } from '../../theme';
import { textSizes } from '../../theme/textSizes';
import { WorkoutGraph } from '../WorkoutGraph';
import { useLogging } from '../../hooks';

// Conditional import to prevent Storybook Vite from crashing — same pattern as RouteItemView.
//
// The delete action button below is rendered with react-native-gesture-handler's own
// TouchableOpacity, not React Native's — the row content and the revealed right-actions
// panel both live inside Swipeable's single PanGestureHandler/TapGestureHandler tree, and
// a plain RN TouchableOpacity there is a known-unreliable combination (its tap can be
// swallowed by the native pan/tap recognizers, especially right after the swipe-open
// gesture). RNGH's TouchableOpacity is API-compatible but participates in the same native
// gesture-recognition system Swipeable uses, which is the pattern RNGH's own examples use
// for Swipeable actions.
let Swipeable: any = View;
let ActionTouchableOpacity: any = TouchableOpacity;
try {
    if (Platform.OS !== 'web') {
        const gestureHandler = require('react-native-gesture-handler');
        Swipeable = gestureHandler.Swipeable;
        ActionTouchableOpacity = gestureHandler.TouchableOpacity;
    }
} catch {
    // Storybook (Vite) / any environment without the native gesture-handler module:
    // still render the revealed actions (just inline, unanimated) instead of silently
    // dropping renderRightActions — otherwise the delete button never appears at all in
    // Storybook or in Jest/RTL tests, and its wiring can never be exercised.
    Swipeable = ({ children, renderRightActions }: any) => (
        <View>
            {children}
            {renderRightActions?.()}
        </View>
    );
}

// Same overall row height as RouteItemView (ITEM_HEIGHT=76) — the graph sits
// in its own column next to the text instead of stacked below it, so a
// WorkoutItem takes no more vertical space per row than a RouteItem does.
const ITEM_HEIGHT = 76;
const MARGIN_V = 4;
const CONTAINER_PADDING = 8;
const GRAPH_HEIGHT = ITEM_HEIGHT - CONTAINER_PADDING * 2;

export const WorkoutItemView = (props: WorkoutItemViewProps) => {
    const { id, title, group, duration, canDelete, plan, outsideFold, scheduledLabel, isToday, onOpenDetails, onDelete } = props;
    const { logEvent } = useLogging('WorkoutItem');

    const handlePress = useCallback(() => onOpenDetails(id), [id, onOpenDetails]);

    const handleDelete = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'Delete', component: 'WorkoutItem', eventSource: 'user' });
        onDelete(id);
    }, [id, onDelete, logEvent]);

    if (outsideFold) {
        return <View style={styles.placeholderContainer} />;
    }

    const renderRightActions = () => (
        <ActionTouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
        </ActionTouchableOpacity>
    );

    const content = (
        <TouchableOpacity
            style={[styles.container, isToday && styles.containerToday]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.graphColumn}>
                <WorkoutGraph mode="strip" plan={plan} height={GRAPH_HEIGHT} style={styles.graph} />
            </View>

            <View style={styles.infoColumn}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <View style={styles.groupChip}>
                        <Text style={styles.groupChipText} numberOfLines={1}>
                            {group}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>{duration}</Text>
                    {!!scheduledLabel && (
                        <>
                            <Text style={styles.detailSeparator}>•</Text>
                            <Text style={[styles.detailText, isToday && styles.todayText]} numberOfLines={1}>
                                {scheduledLabel}
                            </Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (!canDelete) return content;

    return <Swipeable renderRightActions={renderRightActions}>{content}</Swipeable>;
};

const styles = StyleSheet.create({
    placeholderContainer: {
        height: ITEM_HEIGHT + MARGIN_V * 2,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    container: {
        height: ITEM_HEIGHT,
        backgroundColor: colors.listItemBackground,
        marginVertical: MARGIN_V,
        marginHorizontal: 12,
        borderRadius: 6,
        padding: CONTAINER_PADDING,
        flexDirection: 'row',
        gap: 8,
    },
    containerToday: {
        borderLeftWidth: 3,
        borderLeftColor: colors.buttonPrimary,
    },
    // Flex-based (not a fixed pixel width) so the graph scales with the row's
    // actual width on wide/tablet layouts instead of a fixed strip that's
    // either too cramped or leaves empty space. 1:3 -> ~25% of row width.
    graphColumn: {
        flex: 1,
        height: GRAPH_HEIGHT,
    },
    graph: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 4,
    },
    infoColumn: {
        flex: 3,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: 'bold',
        flexShrink: 1,
    },
    groupChip: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        // Wide enough for a realistic group name (e.g. "Zwift Academy 2021")
        // without truncating — the graph column shrink freed up room here.
        maxWidth: 160,
    },
    groupChipText: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '600',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    detailText: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
    todayText: {
        color: colors.buttonPrimary,
        fontWeight: '700',
    },
    detailSeparator: {
        color: colors.text,
        marginHorizontal: 6,
        fontSize: textSizes.smallText,
    },
    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: ITEM_HEIGHT,
        marginVertical: MARGIN_V,
        borderRadius: 6,
    },
    deleteText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
