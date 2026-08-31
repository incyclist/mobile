import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { PrevRiderAvatar } from '../PrevRides';
import { NearbyRiderRowProps } from './types';

/**
 * Formats a distance gap exactly like web-ui's `RiderInfo.getDistanceGapText()`
 * (`web-ui/src/components/molecules/Ride/RiderInfo/rider-info.jsx:100-129`), simplified for this
 * component's plain-`number` `diffDistance` (the source `ActiveRideListDisplayItem.diffDistance`
 * can also carry a `{value, unit}` shape, but `NearbyRiderRowProps` (design doc §4) narrows to a
 * plain meters number — the mapping from the richer source shape is a `RidePageService` concern,
 * session 1.1, not this component's).
 */
const formatDistanceGap = (diffDistance: number): string => {
    if (diffDistance === undefined || diffDistance === null || Number.isNaN(diffDistance)) return '';
    if (Math.abs(diffDistance) < 1) return '';

    const prefix = Math.sign(diffDistance) > 0 ? '+' : '';

    if (Math.abs(diffDistance) < 1000) return `${prefix}${diffDistance.toFixed(0)} m`;

    const km = Math.abs(diffDistance) / 1000;
    const kmDecimals = km > 10 ? 0 : 1;
    return `${prefix}${(diffDistance / 1000).toFixed(kmDecimals)} km`;
};

/** Mirrors web-ui's `RiderInfo.getDistance()`. */
const formatDistance = (distance: number): string => {
    if (distance === undefined || distance === null || Number.isNaN(distance)) return '';
    const km = distance / 1000;
    const decimals = km > 100 ? 0 : 1;
    return `${km.toFixed(decimals)} km`;
};

/** Mirrors web-ui's `RiderInfo.getPowerInfo()` — normalized power (`mpower`, W/kg) takes priority
 *  over absolute power (`power`, W) when both are present. */
const formatPower = (power?: number, mpower?: number): string => {
    if (mpower !== undefined && mpower !== null && !Number.isNaN(mpower)) return `${mpower.toFixed(1)} W/kg`;
    if (power !== undefined && power !== null && !Number.isNaN(power)) return `${power.toFixed(0)} W`;
    return '';
};

/** Mirrors web-ui's `RiderInfo.getSpeedInfo()`. */
const formatSpeed = (speed?: number): string => {
    if (speed === undefined || speed === null || Number.isNaN(speed)) return '';
    return `${speed.toFixed(1)} km/h`;
};

/**
 * One row of the nearby-riders (group ride) list, used identically by both the tablet ear and the
 * phone corner panel — no tier-conditional field trimming (design doc §5.2, session plan 2.1: the
 * one deliberate departure from `PrevRidesRow`'s `layout` prop pattern). Every field renders in
 * every context; density/spacing adjustments per tier are the panel container's concern (session
 * 2.2), not this component's.
 *
 * Field treatment mirrors web-ui's `RiderInfo` (the reference implementation, §2.3 of the design
 * doc):
 * - `isUser`: highlighted with a left-edge accent (same "informational highlight" treatment
 *   `PrevRidesRow` uses for `isCurrent`), and — matching `RiderInfo.getDiff()`, which returns `''`
 *   for the current user — no gap value is shown on the user's own row.
 * - `isPaused`: dimmed, with an explicit "PAUSED" indicator (there is nothing to reuse from
 *   web-ui here — it has no paused-row treatment, this ride screen has no web-ui precedent to
 *   diverge from).
 * - `isCoach`: web-ui's `RiderInfo` *does* render coaches with a distinct avatar (`CoachAvatar`,
 *   `rider-info.jsx:243`) — but mobile has no coach avatar asset today (only
 *   `assets/avatars/male-paths.ts`, the figure `PrevRiderAvatar` draws). Building a new coach SVG
 *   asset is out of this session's scope (component + story + tests only), so this row reuses the
 *   existing rider figure for coach rows too and adds a small "COACH" text indicator instead — an
 *   explicit, flagged departure from exact web-ui parity, not an oversight.
 */
export const NearbyRiderRow = (props: NearbyRiderRowProps) => {
    const { isUser, isPaused, isCoach, name, distance, diffDistance, power, mpower, speed, avatar, backgroundColor, textColor } = props;

    const distanceText = formatDistance(distance);
    const gapText = isUser ? '' : formatDistanceGap(diffDistance);
    const powerText = formatPower(power, mpower);
    const speedText = formatSpeed(speed);
    const textColorStyle = textColor ? { color: textColor } : null;

    return (
        <View
            style={[styles.row, isUser && styles.rowUser, isPaused && styles.rowPaused, backgroundColor ? { backgroundColor } : null]}
            testID="nearby-rider-row"
        >
            <View style={styles.avatarSlot}>
                <PrevRiderAvatar avatar={avatar} size={32} />
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.name, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
                        {name}
                    </Text>
                    {isCoach && (
                        <Text style={styles.badge} numberOfLines={1}>
                            COACH
                        </Text>
                    )}
                    {isPaused && (
                        <Text style={styles.badge} numberOfLines={1}>
                            PAUSED
                        </Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    {distanceText ? (
                        <Text style={[styles.stat, textColorStyle]} numberOfLines={1}>
                            {distanceText}
                        </Text>
                    ) : null}
                    {powerText ? (
                        <Text style={[styles.stat, textColorStyle]} numberOfLines={1}>
                            {powerText}
                        </Text>
                    ) : null}
                    {speedText ? (
                        <Text style={[styles.stat, textColorStyle]} numberOfLines={1}>
                            {speedText}
                        </Text>
                    ) : null}
                    <Text style={[styles.gap, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
                        {gapText}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 10,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 8,
        marginBottom: 3,
    },
    rowUser: {
        borderLeftColor: colors.buttonPrimary,
    },
    rowPaused: {
        opacity: 0.55,
    },
    avatarSlot: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '600',
    },
    textUser: {
        color: colors.buttonPrimary,
    },
    badge: {
        color: colors.text,
        fontSize: textSizes.microText,
        fontWeight: '700',
        opacity: 0.75,
        flexShrink: 0,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stat: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        opacity: 0.75,
        flexShrink: 0,
    },
    gap: {
        marginLeft: 'auto',
        minWidth: 56,
        textAlign: 'right',
        color: colors.text,
        fontSize: textSizes.subtitle,
        fontWeight: '700',
        flexShrink: 0,
    },
});
