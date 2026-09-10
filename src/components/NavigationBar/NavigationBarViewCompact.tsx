import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationBarViewCompactProps, TNavigationItem } from './types';
import { colors, textSizes } from '../../theme';
import {
    UserIcon,
    SettingsIcon,
    BikeIcon, // Devices
    RouteIcon,
    WorkoutIcon,
    ActivityIcon,
    ExitIcon,
} from '../../assets/icons';

// Measured (onLayout, real device) content height of this bar - `textSizes.smallText + 16` looks
// like the obvious formula but undercounts the icon+label row's real height once line-height is
// included (28 vs the real 45.33), and was never actually wired up to anything until now. Anyone
// consuming this (ListPageShell's navColumnCompact box, SettingsSlideIn's peek-through strip)
// needs the real number, not a derivation that looks right but isn't - re-measure via onLayout
// if this row's content ever changes rather than adjusting the formula blind.
export const COMPACT_NAV_HEIGHT = 45.33;

// Helper for rendering icons based on the TNavigationItem
const renderIcon = (item: TNavigationItem, isSelected: boolean, disabled:boolean=false) => {
    const colorUnselected = disabled? colors.iconDisabled : colors.background
    const color = isSelected ? colors.iconSelected : colorUnselected;

    const iconProps = { fill: color, width: textSizes.smallText, height: textSizes.smallText };

    switch (item) {
        case 'user': return <UserIcon {...iconProps} />;
        case 'settings': return <SettingsIcon {...iconProps} />;
        case 'devices': return <BikeIcon {...iconProps} />;
        case 'routes': return <RouteIcon {...iconProps} />;
        case 'workouts': return <WorkoutIcon {...iconProps} />;
        case 'activities': return <ActivityIcon {...iconProps} />;
        case 'exit': return <ExitIcon {...iconProps} />;

        default: return null;
    }
};

interface CompactNavItemProps {
    item: TNavigationItem;
    label?: string;
    selected: boolean;
    disabled?: boolean,
    onPress: (item: TNavigationItem) => void;
}

const CompactNavItem = ({ item, label, selected,disabled=false, onPress }: CompactNavItemProps) => {
    return (
        <TouchableOpacity
            style={styles.navItemContainer}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label || item}
        >
            <View style={styles.content}>
                <View style={styles.iconWrapper}>{renderIcon(item, selected,disabled)}</View>
                {label!=null && (
                    <Text style={[styles.itemLabel, disabled && styles.itemLabelDisabled, selected && styles.itemLabelSelected]}>
                        {label}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const leftItems: { item: TNavigationItem; label: string }[] = [
    { item: 'devices', label: 'Devices' },
    { item: 'routes', label: 'Routes' },
    { item: 'workouts', label: 'Workouts' },
    { item: 'activities', label: 'Activities' },
];


export const NavigationBarViewCompact = (props: NavigationBarViewCompactProps) => {
    const { selected, disabled=false, showExit, onClick, style } = props;

    const rightItems: TNavigationItem[] = showExit ? ['exit','settings', 'user' ] : ['settings', 'user' ];

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftItemsContainer}>
                {leftItems.map(({ item, label }) => (
                    <CompactNavItem
                        key={item}
                        item={item}
                        label={label}
                        selected={selected === item}
                        disabled={disabled}
                        onPress={onClick}
                    />
                ))}
            </View>
            <View style={styles.rightItemsContainer}>
                {rightItems.map((item) => (
                    <CompactNavItem
                        key={item}
                        item={item}
                        selected={selected === item}
                        disabled={disabled}
                        onPress={onClick}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'lightgrey',
        paddingHorizontal: 8,
        paddingVertical: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    leftItemsContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    rightItemsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingLeft: 16,
    },
    navItemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: '100%',
        minWidth: 44,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemLabel: {
        color: colors.background,
        fontSize: textSizes.smallText,
        marginLeft: 4,
    },
    itemLabelSelected: {
        color: colors.iconSelected,
    },
    itemLabelDisabled: {
        color: colors.iconDisabled,
    },

});