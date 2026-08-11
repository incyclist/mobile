import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { AttachmentChipProps } from './types';

/**
 * Inline "<Label>: <name> [x]" row (workout-mobile-hld-phase2.md §4.2) - shown on
 * `WorkoutDetailsDialog`/`RouteDetailsDialog`/`ActivityDetailsDialog` when a route/workout is
 * attached elsewhere. Tapping `[x]` clears just that side of the attachment (the dialog's own
 * page service supplies `onClear`, mapped to `onClearRouteSelection()`/`onClearWorkoutSelection()`
 * as appropriate).
 */
export const AttachmentChip = ({ label, name, onClear, testID }: AttachmentChipProps) => (
    <View style={styles.row} testID={testID}>
        <Text style={styles.text} numberOfLines={1}>
            {label}: {name}
        </Text>
        <TouchableOpacity
            onPress={onClear}
            style={styles.clearButton}
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.tileActive,
        borderRadius: 16,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 6,
        marginHorizontal: 10,
        marginTop: 10,
        maxWidth: '90%',
    },
    text: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
        flexShrink: 1,
    },
    clearButton: {
        marginLeft: 8,
        paddingHorizontal: 2,
    },
    clearText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
});
