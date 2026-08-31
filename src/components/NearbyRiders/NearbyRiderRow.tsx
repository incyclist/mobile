import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Avatar } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { PrevRiderAvatar } from '../PrevRides';
import { NearbyRiderRowComponentProps } from './types';

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
 * phone corner panel — no tier-conditional *field* trimming (design doc §5.2, session plan 2.1: the
 * one deliberate departure from `PrevRidesRow`'s `layout` prop pattern). Every field renders in
 * every context; only *density* (avatar size, font sizes, spacing) varies per tier, via the
 * `compact` prop below — set by `NearbyRidersExpandedPanel` (phone corner panel) only,
 * `NearbyRidersTabletList` (tablet ear) leaves it at its `false` default.
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
 *
 * `statsRow` wraps (`flexWrap: 'wrap'`) rather than staying a fixed non-shrinking single line: with
 * four stat items (distance/power/speed/gap) all `flexShrink: 0` (values must stay legible, never
 * compress), a narrow container's intrinsic content width can exceed the space it's given —
 * previously clipped mid-value (e.g. a gap of "+340 m" cut off as "+34") wherever the row's own
 * container clips overflow (every current caller does: the stories' `panelFrame`, and
 * `NearbyRidersExpandedPanel`'s `overflow: 'hidden'` panel). Wrapping instead of clipping keeps
 * every value fully legible regardless of container width. `compact` (phone corner-panel only, set
 * by `NearbyRidersExpandedPanel` — see `types.ts`) additionally shrinks the avatar/fonts/spacing so
 * more rows fit the corner panel's much narrower band (~169-190dp vs. the tablet ear's fixed
 * 340dp, `NearbyRidersTabletList.NEARBY_RIDERS_TABLET_WIDTH`) without needing to wrap as often.
 */
export const NearbyRiderRow = (props: NearbyRiderRowComponentProps) => {
    const { isUser, isPaused, isCoach, name, distance, diffDistance, power, mpower, speed, avatar, backgroundColor, textColor, compact = false } = props;

    const distanceText = formatDistance(distance);
    const gapText = isUser ? '' : formatDistanceGap(diffDistance);
    const powerText = formatPower(power, mpower);
    const speedText = formatSpeed(speed);
    const textColorStyle = textColor ? { color: textColor } : null;

    return (
        <View
            style={[
                styles.row,
                compact && styles.rowCompact,
                isUser && styles.rowUser,
                isPaused && styles.rowPaused,
                backgroundColor ? { backgroundColor } : null,
            ]}
            testID="nearby-rider-row"
        >
            <View style={[styles.avatarSlot, compact && styles.avatarSlotCompact]}>
                {/* NearbyRiderRowProps.avatar is ActiveRideListAvatar (plain shirt/helmet
                    strings) - PrevRiderAvatar/avatarToConfig are typed for Avatar's Color-enum
                    shape. ActiveRidesService never validates these strings against the Color
                    union either (same looseness RidePageService.mapNearbyRiderRow() already
                    widens past on the services side), so this is a narrowing cast, not a runtime
                    risk. */}
                <PrevRiderAvatar avatar={avatar as Avatar} size={compact ? 18 : 32} />
            </View>

            <View style={[styles.content, compact && styles.contentCompact]}>
                <View style={[styles.topRow, compact && styles.topRowCompact]}>
                    <Text style={[styles.name, compact && styles.nameCompact, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
                        {name}
                    </Text>
                    {isCoach && (
                        <Text style={[styles.badge, compact && styles.badgeCompact]} numberOfLines={1}>
                            COACH
                        </Text>
                    )}
                    {isPaused && (
                        <Text style={[styles.badge, compact && styles.badgeCompact]} numberOfLines={1}>
                            PAUSED
                        </Text>
                    )}
                </View>

                <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
                    {distanceText ? (
                        <Text style={[styles.stat, compact && styles.statCompact, textColorStyle]} numberOfLines={1}>
                            {distanceText}
                        </Text>
                    ) : null}
                    {powerText ? (
                        <Text style={[styles.stat, compact && styles.statCompact, textColorStyle]} numberOfLines={1}>
                            {powerText}
                        </Text>
                    ) : null}
                    {speedText ? (
                        <Text style={[styles.stat, compact && styles.statCompact, textColorStyle]} numberOfLines={1}>
                            {speedText}
                        </Text>
                    ) : null}
                    <Text style={[styles.gap, compact && styles.gapCompact, isUser && styles.textUser, textColorStyle]} numberOfLines={1}>
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
    // --- compact (phone corner-panel) tier — see NearbyRiderRowComponentProps.compact ---
    rowCompact: {
        // marginBottom deliberately left at the shared `row.marginBottom` value (not shrunk) —
        // NearbyRidersExpandedPanel.tsx's NEARBY_ROW_MARGIN_BOTTOM constant assumes it stays in
        // sync across both tiers, the same way PrevRidesRow's two tiers share ROW_MARGIN_BOTTOM.
        paddingVertical: 4,
        paddingHorizontal: 6,
        gap: 6,
        borderRadius: 6,
    },
    avatarSlot: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSlotCompact: {
        width: 18,
    },
    content: {
        flex: 1,
        gap: 4,
    },
    contentCompact: {
        gap: 1,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    topRowCompact: {
        gap: 4,
    },
    name: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '600',
    },
    nameCompact: {
        fontSize: textSizes.tinyText,
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
    badgeCompact: {
        fontSize: 8,
    },
    // flexWrap so a container narrower than the stats' combined intrinsic width (every stat and
    // the gap value are flexShrink:0 — legibility over compression) wraps the overflow onto
    // additional lines instead of relying on the container to clip it (bug: a gap value like
    // "+340 m" was being cut off mid-word wherever the container clips overflow).
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    statsRowCompact: {
        gap: 4,
    },
    stat: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        opacity: 0.75,
        flexShrink: 0,
    },
    statCompact: {
        fontSize: textSizes.microText,
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
    gapCompact: {
        // Unlike the tablet-tier `gap` style, compact mode doesn't force the gap value to the far
        // right of its own line (`marginLeft: 'auto'` on a wrapping row pushes an item to the end
        // of whatever line has room for it — with the other three stats already close to filling
        // the compact width, that reliably bumped the gap onto its own third line). Flowing inline
        // instead lets it share a line with whichever stat(s) fit, so a row is two lines (name,
        // then wrapped stats+gap) rather than three in the common case — directly reduces the
        // panel's per-row height, which is the panel's whole way of fitting more rows in the phone
        // corner-panel's narrow width.
        marginLeft: 0,
        minWidth: 0,
        fontSize: textSizes.tinyText,
    },
});
