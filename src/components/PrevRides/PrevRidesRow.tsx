import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { PrevRiderAvatar } from './PrevRiderAvatar';
import { PrevRidesRowComponentProps } from './types';

/**
 * One row of the previous-rides comparison list, rendering the same underlying data differently
 * per screen tier:
 * - `'normal'` (tablet ear): full desktop parity — position, avatar, label, speed/power/heartrate,
 *   time gap, distance gap.
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

            <View style={styles.avatarSlot}>{avatar ? <PrevRiderAvatar avatar={avatar} size={28} /> : null}</View>

            <View style={styles.middle}>
                <Text style={[styles.label, isCurrent && styles.textCurrent]} numberOfLines={1}>
                    {label}
                </Text>
                <View style={styles.statsRow}>
                    {speed !== undefined && <Text style={styles.stat}>{speed.toFixed(1)} km/h</Text>}
                    {power !== undefined && <Text style={styles.stat}>{power.toFixed(0)} W</Text>}
                    {heartrate !== undefined && <Text style={styles.stat}>{heartrate} bpm</Text>}
                </View>
            </View>

            <View style={styles.gaps}>
                <Text style={[styles.timeGap, isCurrent && styles.textCurrent]} numberOfLines={1}>
                    {timeGap}
                </Text>
                {!!distanceGap && (
                    <Text style={styles.distanceGap} numberOfLines={1}>
                        {distanceGap}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- normal (tablet) tier ---
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        gap: 6,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
    },
    rowCurrent: {
        borderLeftColor: colors.buttonPrimary,
    },
    position: {
        width: 18,
        textAlign: 'center',
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
    avatarSlot: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    middle: {
        flex: 1,
        overflow: 'hidden',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 1,
    },
    stat: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        opacity: 0.85,
    },
    gaps: {
        alignItems: 'flex-end',
        minWidth: 52,
    },
    timeGap: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
    distanceGap: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        opacity: 0.85,
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
