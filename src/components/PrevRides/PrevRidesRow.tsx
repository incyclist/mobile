import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { PrevRiderAvatar } from './PrevRiderAvatar';
import { PrevRidesRowComponentProps } from './types';

/**
 * One row of the previous-rides comparison list, rendering the same underlying data differently
 * per screen tier:
 * - `'normal'` (tablet ear): full desktop parity — position, avatar, label, speed/power/heartrate,
 *   and a single gap value (time or distance — a row is never gapped by both, so the stats row
 *   tops out at 4 items: speed, power, heartrate, gap).
 * - `'compact'` (phone corner-slot/expanded panel): position, label, time gap only. Avatar/speed/
 *   power/heartrate/distanceGap are never rendered here even when present on the prop object —
 *   enforcing the tier's field set is this component's job, not a reflection of what happens to be
 *   populated (the caller always populates every field it has, regardless of tier).
 *
 * `isCurrent` gets a left-edge accent + accent-colored label, the same "informational highlight,
 * not a selection state" treatment `WorkoutItemView` already uses for its `isToday` row.
 */
export const PrevRidesRow = (props: PrevRidesRowComponentProps) => {
    const { layout, position, label, timeGap, distanceGap, isCurrent, avatar, speed, power, heartrate } = props;
    // A row is gapped by time OR distance, never both — if a caller ever sets both (it shouldn't),
    // distanceGap wins so the stats row never exceeds its 4-item budget (speed/power/heartrate/gap).
    const gap = distanceGap || timeGap;

    if (layout === 'compact') {
        return (
            <View style={[styles.rowCompact, isCurrent && styles.rowCompactCurrent]} testID="prev-rides-row">
                <Text style={[styles.positionCompact, isCurrent && styles.textCurrent]}>{position}</Text>
                <Text style={[styles.labelCompact, isCurrent && styles.textCurrent]} numberOfLines={1}>
                    {label}
                </Text>
                <Text style={[styles.timeGapCompact, isCurrent && styles.textCurrent]} numberOfLines={1}>
                    {timeGap}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.row, isCurrent && styles.rowCurrent]} testID="prev-rides-row">
            <Text style={[styles.position, isCurrent && styles.textCurrent]}>{position}</Text>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <View style={styles.avatarSlot}>
                        {avatar ? <PrevRiderAvatar avatar={avatar} size={32} /> : null}
                    </View>
                    <Text style={[styles.label, isCurrent && styles.textCurrent]} numberOfLines={1}>
                        {label}
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    {speed !== undefined && (
                        <Text style={styles.stat} numberOfLines={1}>{speed.toFixed(1)} km/h</Text>
                    )}
                    {power !== undefined && (
                        <Text style={styles.stat} numberOfLines={1}>{power.toFixed(0)} W</Text>
                    )}
                    {heartrate !== undefined && (
                        <Text style={styles.stat} numberOfLines={1}>{heartrate} bpm</Text>
                    )}
                    <Text style={[styles.timeGap, isCurrent && styles.textCurrent]} numberOfLines={1}>
                        {gap}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- normal (tablet) tier ---
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        gap: 12,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 8,
        marginBottom: 3,
    },
    rowCurrent: {
        borderLeftColor: colors.buttonPrimary,
    },
    position: {
        width: 30,
        textAlign: 'center',
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        overflow: 'hidden',
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarSlot: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    stat: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        opacity: 0.75,
        flexShrink: 0,
    },
    timeGap: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        fontWeight: '700',
        flexShrink: 0,
    },
    textCurrent: {
        color: colors.buttonPrimary,
    },

    // --- compact (phone) tier ---
    rowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        paddingHorizontal: 4,
        gap: 6,
        borderLeftWidth: 2,
        borderLeftColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        marginBottom: 3,
    },
    rowCompactCurrent: {
        borderLeftColor: colors.buttonPrimary,
    },
    positionCompact: {
        width: 14,
        textAlign: 'center',
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
    },
    labelCompact: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.tinyText,
    },
    timeGapCompact: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
    },
});
