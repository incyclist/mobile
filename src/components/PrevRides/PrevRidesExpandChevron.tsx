import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '../Icon';
import { colors } from '../../theme';

export interface PrevRidesExpandChevronProps {
    expanded: boolean;
    onPress: () => void;
    /** Accessible label subject, e.g. `'previous rides'` or `'nearby riders'` — produces
     *  `'Expand <label>'`/`'Collapse <label>'`. Defaults to `'previous rides'` so every existing
     *  call site (`PrevRidesCornerPanel`/`PrevRidesExpandedPanel`) keeps its exact accessibility
     *  text unchanged. Added so Nearby Riders' panels (session plan 2.2) can reuse this component
     *  directly instead of forking a near-identical copy — the chevron's visuals/behavior are
     *  already feature-agnostic, only the hardcoded "previous rides" wording wasn't. */
    label?: string;
    /** testID override — defaults to `'prev-rides-expand-chevron'` for existing call sites/tests. */
    testID?: string;
}

/**
 * The phone corner slot's expand/collapse affordance. A small, separate `Pressable` from the
 * slot's own cycle-tap handler (elevation ↔ workout ↔ prevRides) — the caller overlays this on
 * top of the condensed slot, and tapping it must never also advance that cycle, just as tapping
 * the rest of the slot must never open the panel.
 *
 * Reuses the existing `chevron-down`/`chevron-up` glyphs (`Icon`'s `IconName` union already has
 * both) rather than adding a new icon — same collapsed-points-down / expanded-points-up
 * convention already used by `WorkoutsTable`'s section toggle and `RouteImportDialog`'s
 * `CompleteView` error disclosure.
 *
 * Shared across features (PrevRides and, per session plan 2.2, NearbyRiders) — both need
 * exactly the same "one explicit chevron per collapsed/expanded state" affordance, no
 * tap-anywhere backdrop (see this repo's `race-against-yourself-mobile-design.md` §6.3 As-built
 * block for why). `label`/`testID` let each feature keep its own accessible wording/test hook
 * without duplicating this component.
 */
export const PrevRidesExpandChevron = ({
    expanded,
    onPress,
    label = 'previous rides',
    testID = 'prev-rides-expand-chevron',
}: PrevRidesExpandChevronProps) => (
    <Pressable
        testID={testID}
        onPress={onPress}
        hitSlop={8}
        style={styles.chevron}
        accessibilityRole="button"
        accessibilityLabel={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text} />
    </Pressable>
);

const styles = StyleSheet.create({
    chevron: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 12,
    },
});
