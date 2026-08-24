import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '../Icon';
import { colors } from '../../theme';

export interface PrevRidesExpandChevronProps {
    expanded: boolean;
    onPress: () => void;
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
 */
export const PrevRidesExpandChevron = ({ expanded, onPress }: PrevRidesExpandChevronProps) => (
    <Pressable
        testID="prev-rides-expand-chevron"
        onPress={onPress}
        hitSlop={8}
        style={styles.chevron}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse previous rides' : 'Expand previous rides'}
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
