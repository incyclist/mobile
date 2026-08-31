import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Avatar } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { PrevRiderAvatar } from '../PrevRides';
import { NearbyRiderRowComponentProps } from './types';

/**
 * distance/diffDistance/speed arrive already unit-converted to the user's display preference
 * (km/mi, km/h/mph) by ActiveRidesService.getDistance()/getDistanceDiff()/getSpeed() — the
 * {value,unit} object is rendered as-is, no further conversion (see Correction 2,
 * nearby-riders-mobile-design.md §4; mirrors web-ui's `RiderInfo.formatted()`,
 * `rider-info.jsx:90-97`).
 */
type UnitValue = { value: number, unit: string };

/**
 * Formats a distance gap exactly like web-ui's `RiderInfo.formatted(v, true)`
 * (`web-ui/src/components/molecules/Ride/RiderInfo/rider-info.jsx:90-97`) — value already in the
 * right unit, just prefix + render.
 */
const formatDistanceGap = (diffDistance?: UnitValue): string => {
    if (diffDistance === undefined || diffDistance === null) return '';
    const { value, unit } = diffDistance;
    if (value === undefined || value === null || Number.isNaN(value)) return '';

    const prefix = Math.sign(value) > 0 ? '+' : '';
    return `${prefix}${value} ${unit}`;
};

/** Mirrors web-ui's `RiderInfo.formatted()` (no prefix) for distance. */
const formatDistance = (distance?: UnitValue): string => {
    if (distance === undefined || distance === null) return '';
    const { value, unit } = distance;
    if (value === undefined || value === null || Number.isNaN(value)) return '';
    return `${value} ${unit}`;
};

/** Mirrors web-ui's `RiderInfo.getPowerInfo()` — normalized power (`mpower`, W/kg) takes priority
 *  over absolute power (`power`, W) when both are present. Not unit-converted (plain Watts/W-kg). */
const formatPower = (power?: number, mpower?: number): string => {
    if (mpower !== undefined && mpower !== null && !Number.isNaN(mpower)) return `${mpower.toFixed(1)} W/kg`;
    if (power !== undefined && power !== null && !Number.isNaN(power)) return `${power.toFixed(0)} W`;
    return '';
};

/** Mirrors web-ui's `RiderInfo.formatted()` (no prefix) for speed. */
const formatSpeed = (speed?: UnitValue): string => {
    if (speed === undefined || speed === null) return '';
    const { value, unit } = speed;
    if (value === undefined || value === null || Number.isNaN(value)) return '';
    return `${value} ${unit}`;
};

/**
 * One row of the nearby-riders (group ride) list. Two genuinely different layouts share this
 * component, not one shape with a density tweak — a row must never exceed 2 lines on tablet or 1
 * line on phone, and that cap is a structural guarantee (which elements exist in the tree), not a
 * CSS wrapping trick:
 *
 * - **Tablet ear** (`compact` false/default, set by `NearbyRidersTabletList`): every field renders
 *   — avatar, name, distance, power, speed, gap — across exactly 2 lines, and the COACH/PAUSED
 *   badge (a small label, not part of either text line) is moved out of both lines entirely: it
 *   stacks directly below the avatar in the avatar column instead. That keeps the badge from
 *   competing with the name/gap or the stats for horizontal room in the text column. Line 1 (text
 *   column) is name + the distance gap, pinned to the row's right edge with `marginLeft: 'auto'`
 *   so its position doesn't drift with the name's own text width (same fixed-right-column
 *   technique `PrevRidesRow`'s tablet-tier gap column uses). Line 2 is distance/power/speed, laid
 *   out without wrapping — 3 short values that comfortably fit the tablet ear's fixed width on one
 *   line.
 * - **Phone corner panel** (`compact` true, set by `NearbyRidersExpandedPanel`): content
 *   compromise, not just smaller fonts. Only avatar + name + gap render — distance, power, speed
 *   and the COACH/PAUSED badges are omitted from the tree entirely, not merely styled small or
 *   hidden, matching `PrevRidesRow`'s own phone tier (position/label/time-gap only). The avatar is
 *   kept (unlike `PrevRidesRow`'s phone tier, which has no avatar) because this list has no
 *   position-ranking number to anchor identity on the way `PrevRidesRow` does, but it is shrunk to
 *   cost no more row-width than `PrevRidesRow`'s phone position column (`width: 14`). `isPaused`
 *   still dims the row (shared `rowPaused` style, opacity) and `isUser` still gets the left-edge
 *   accent — those don't cost extra width — but the COACH/PAUSED text badges themselves are
 *   dropped on this tier: there isn't room for them next to name + gap without risking a wrap.
 */
export const NearbyRiderRow = (props: NearbyRiderRowComponentProps) => {
    const { isUser, isPaused, isCoach, name, distance, diffDistance, power, mpower, speed, avatar, backgroundColor, textColor, compact = false } = props;

    const gapText = isUser ? '' : formatDistanceGap(diffDistance);
    const textColorStyle = textColor ? { color: textColor } : null;
    const rowStyleBase = [
        isUser && styles.rowUser,
        isPaused && styles.rowPaused,
        backgroundColor ? { backgroundColor } : null,
    ];

    if (compact) {
        return (
            <View style={[styles.rowCompact, ...rowStyleBase]} testID="nearby-rider-row">
                <View style={styles.avatarSlotCompact}>
                    {/* NearbyRiderRowProps.avatar is ActiveRideListAvatar (plain shirt/helmet
                        strings) - PrevRiderAvatar/avatarToConfig are typed for Avatar's Color-enum
                        shape. ActiveRidesService never validates these strings against the Color
                        union either, so this is a narrowing cast, not a runtime risk. */}
                    <PrevRiderAvatar avatar={avatar as Avatar} size={16} />
                </View>
                <Text style={[styles.nameCompact, isUser && styles.textUser, textColorStyle]} numberOfLines={1} ellipsizeMode="tail">
                    {name}
                </Text>
                <Text style={[styles.gapCompact, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
                    {gapText}
                </Text>
            </View>
        );
    }

    const distanceText = formatDistance(distance);
    const powerText = formatPower(power, mpower);
    const speedText = formatSpeed(speed);

    return (
        <View style={[styles.row, ...rowStyleBase]} testID="nearby-rider-row">
            <View style={styles.avatarSlot}>
                <PrevRiderAvatar avatar={avatar as Avatar} size={32} />
                {isCoach && (
                    <Text style={styles.avatarBadge} numberOfLines={1}>
                        COACH
                    </Text>
                )}
                {isPaused && (
                    <Text style={styles.avatarBadge} numberOfLines={1}>
                        PAUSED
                    </Text>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.name, isUser && styles.textUser, textColorStyle]} numberOfLines={1} ellipsizeMode="tail">
                        {name}
                    </Text>
                    <Text style={[styles.gap, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
                        {gapText}
                    </Text>
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
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- tablet-ear (non-compact) tier — 2 lines max ---
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
    // Column, not row: the avatar and its COACH/PAUSED badge (when present) stack vertically here
    // instead of the badge competing with the name/gap for room on the text column's top line.
    // minWidth (not a fixed width) so the column still grows to fit "PAUSED", the wider of the two
    // badge strings, without clipping it.
    avatarSlot: {
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    avatarBadge: {
        color: colors.text,
        fontSize: textSizes.microText,
        fontWeight: '700',
        opacity: 0.75,
        textAlign: 'center',
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
    // Line 2: distance/power/speed only (the gap moved to the top row, see the component doc
    // above) — 3 short values, laid out without wrapping so this line can never itself grow into
    // a 3rd line of the row.
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stat: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        opacity: 0.75,
        flexShrink: 0,
    },
    // Pinned to a fixed-width, right-aligned column at the end of the top row — detached from the
    // name's own text width (marginLeft:'auto' pushes it to the row's end regardless of how long
    // the name is), so its position doesn't shift row-to-row. Same technique PrevRidesRow's
    // tablet-tier gap column uses for the same reason. Matches `name`'s own font size (not a
    // smaller secondary size) and never shrinks: if the two don't both fit, `name` is the one that
    // truncates (its own `numberOfLines`/`ellipsizeMode`) — the gap value always renders in full.
    gap: {
        marginLeft: 'auto',
        minWidth: 80,
        textAlign: 'right',
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '700',
        flexShrink: 0,
    },

    // --- phone corner-panel (compact) tier — exactly 1 line, avatar + name + gap only ---
    rowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        paddingHorizontal: 6,
        gap: 6,
        borderLeftWidth: 2,
        borderLeftColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        // Kept equal to the tablet tier's `row.marginBottom` on purpose —
        // NearbyRidersExpandedPanel.tsx's NEARBY_ROW_MARGIN_BOTTOM constant assumes the two stay
        // in sync (onLayout reports a view's own box, not the margin around it, so external
        // row-spacing math needs this value mirrored, the same way PrevRidesRow's two tiers share
        // its exported ROW_MARGIN_BOTTOM).
        marginBottom: 3,
    },
    // width:14 — no wider than PrevRidesRow's phone position-number column, so this avatar costs
    // no more row-width than the position number it conceptually replaces (PrevRidesRow's phone
    // tier has no avatar at all; this list has no ranking number to anchor identity on instead).
    avatarSlotCompact: {
        width: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameCompact: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.tinyText,
    },
    // Same font size as `nameCompact` (not a smaller secondary size) and non-shrinking — if the
    // two don't both fit on the row's one line, `nameCompact` truncates first (its own
    // `numberOfLines`/`ellipsizeMode`), the gap value always renders in full.
    gapCompact: {
        flexShrink: 0,
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
    },
});
