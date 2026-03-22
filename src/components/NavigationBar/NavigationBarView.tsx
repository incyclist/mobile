import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationBarViewProps, TNavigationItem } from './types';
import { NavigationItem } from './NavigationItem';
import { navigationItemsMiddle } from './utils';

import {
    UserIcon,
    SettingsIcon,
    BikeIcon,
    RouteIcon,
    WorkoutIcon,
    ActivityIcon,
    ExitIcon,
    SearchIcon
} from '../../assets/icons';
import { colors } from '../../theme';

export const NavigationBarView = (props: NavigationBarViewProps) => {
    const { 
        selected, 
        onClick, 
        compact, 
        iconSize, 
        navWidth, 
        showExit
    } = props;

    // The showBackOnly mode and associated rendering logic have been removed.

    const renderIcon = (item: TNavigationItem, isSelected: boolean) => {
        const color = isSelected ? colors.iconSelected : colors.icon;
        const iconProps = { fill: color, width: iconSize, height: iconSize };

        switch (item) {
            case 'user': return <UserIcon {...iconProps} />;
            case 'settings': return <SettingsIcon {...iconProps} />;
            case 'devices': return <BikeIcon {...iconProps} />;
            case 'search': return <SearchIcon {...iconProps} />;
            case 'routes': return <RouteIcon {...iconProps} />;
            case 'workouts': return <WorkoutIcon {...iconProps} />;
            case 'activities': return <ActivityIcon {...iconProps} />;
            case 'exit': return <ExitIcon {...iconProps} />;
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { width: navWidth }]}>
            <View style={styles.top}>
                <NavigationItem
                    item="user"
                    selected={selected === 'user'}
                    onPress={onClick}
                    compact={compact}
                >
                    {renderIcon('user', selected === 'user')}
                </NavigationItem>
            </View>

            <View style={styles.middle}>
                {navigationItemsMiddle.map((item) => (
                    <NavigationItem
                        key={item}
                        item={item}
                        selected={selected === item}
                        onPress={onClick}
                        compact={compact}
                    >
                        {renderIcon(item, selected === item)}
                    </NavigationItem>
                ))}
            </View>

            {showExit && (
                <View style={styles.bottom}>
                    <NavigationItem
                        item="exit"
                        selected={selected === 'exit'}
                        onPress={onClick}
                        compact={compact}
                    >
                        {renderIcon('exit', selected === 'exit')}
                    </NavigationItem>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 8,
        left: 0,
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    top: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    bottom: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    middle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    // The backButton and backIcon styles have been removed as showBackOnly mode is no longer supported.
});