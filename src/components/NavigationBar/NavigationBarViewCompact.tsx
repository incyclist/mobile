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
} from '../../assets/icons';

// Helper for rendering icons based on the TNavigationItem
const renderIcon = (item: TNavigationItem, isSelected: boolean) => {
    const color = isSelected ? colors.iconSelected : colors.icon;
    const iconProps = { fill: color, width: 24, height: 24 }; // Fixed size 24 as per requirements

    switch (item) {
        case 'user': return <UserIcon {...iconProps} />;
        case 'settings': return <SettingsIcon {...iconProps} />;
        case 'devices': return <BikeIcon {...iconProps} />;
        case 'routes': return <RouteIcon {...iconProps} />;
        case 'workouts': return <WorkoutIcon {...iconProps} />;
        case 'activities': return <ActivityIcon {...iconProps} />;
        default: return null; // 'search' and 'exit' are not shown in compact view
    }
};

interface CompactNavItemProps {
    item: TNavigationItem;
    label?: string; // Optional label for left items
    selected: boolean;
    onPress: (item: TNavigationItem) => void;
}

const CompactNavItem = ({ item, label, selected, onPress }: CompactNavItemProps) => {
    return (
        <TouchableOpacity
            style={[styles.navItemContainer]}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label || item} // For icon-only items, use the item name as label
        >
            <View style={styles.content}>
                <View style={styles.iconWrapper}>{renderIcon(item, selected)}</View>
                {label && (
                    <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]}>
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

const rightItems: TNavigationItem[] = ['settings', 'user'];

export const NavigationBarViewCompact = (props: NavigationBarViewCompactProps) => {
    const { selected, onClick, navHeight } = props;

    return (
        <View style={[styles.container, { height: navHeight || 56 }]}>
            <View style={styles.leftItemsContainer}>
                {leftItems.map(({ item, label }) => (
                    <CompactNavItem
                        key={item}
                        item={item}
                        label={label}
                        selected={selected === item}
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
        backgroundColor: colors.dialogBorder, // Using dialogBorder for lightgrey as per rule
        paddingHorizontal: 8,
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
        paddingVertical: 4,
        paddingHorizontal: 8,
        height: '100%',
        minWidth: 44, // Ensure minimum touch target for icons
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemLabel: {
        color: colors.icon,
        fontSize: textSizes.smallText,
        marginTop: 2,
    },
    itemLabelSelected: {
        color: colors.iconSelected,
    },
});