import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { NavigationBarProps, TNavigationItem } from './types';
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

interface Props extends NavigationBarProps {}

export const NavigationBar = (props: Props) => {
    const { position, selected, onClick } = props;


    const {height} = useWindowDimensions()

    const iconSize = Math.min(height/16,64)


    const renderIcon = (item: TNavigationItem, isSelected:boolean) => {
        const color = isSelected ? colors.iconSelected : colors.icon
        switch (item) {
            case 'user':
                return UserIcon && <UserIcon fill={color} width={iconSize} height={iconSize}/>;
            case 'settings':
                return SettingsIcon && <SettingsIcon fill={color} width={iconSize} height={iconSize} />;
            case 'devices':
                return BikeIcon && <BikeIcon fill={color} width={iconSize} height={iconSize} />;
            case 'search':
                return SearchIcon && <SearchIcon fill={color} width={iconSize} height={iconSize} />;
            case 'routes':
                return RouteIcon && <RouteIcon fill={color} width={iconSize} height={iconSize} />;
            case 'workouts':
                return WorkoutIcon && <WorkoutIcon fill={color} width={iconSize} height={iconSize} />;
            case 'activities':
                return ActivityIcon && <ActivityIcon fill={color} width={iconSize} height={iconSize} />;
            case 'exit':
                return <ExitIcon fill={color} width={iconSize} height={iconSize}/>;
            default:
                return null;
        }
    };

    const onPress = (item:TNavigationItem)=>{
        onClick(item)
    }

    const isVertical = position === 'left';

    return (
        <View
            style={[
                styles.container,
                isVertical ? styles.vertical : styles.horizontal
            ]}
        >
            
            <View style={styles.top}>
                <NavigationItem
                    item="user"
                    selected={selected === 'user'}
                    onPress={onPress}
                >
                    {renderIcon('user',selected==='user')}
                </NavigationItem>
            </View>

            <View
                style={[
                    styles.middle,
                    isVertical && styles.middleVertical
                ]}
            >
                {navigationItemsMiddle.map((item) => (
                    <NavigationItem
                        key={item}
                        item={item}
                        selected={selected === item}
                        onPress={onPress}
                    >
                        {renderIcon(item,selected===item)}
                    </NavigationItem>
                ))}
            </View>

            <View style={styles.bottom}>
                <NavigationItem
                    item="exit"
                    selected={selected === 'exit'}
                    onPress={onPress}
                >
                    {renderIcon('exit',selected==='exit')}
                </NavigationItem>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 8,
    },
    vertical: {
        position:'absolute',
        left:0,
        flex:1,
        width: 150,
        height: '100%',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    horizontal: {
        flex:1,
        width: '100%',
        height: 90,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    top: {
        justifyContent: 'center',
        alignItems: 'center',
        width:'100%'

    },
    bottom: {
        justifyContent: 'center',
        alignItems: 'center',
        width:'100%'

    },
    middle: {
        flex:1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width:'100%'
    },
    middleVertical: {
        flex: 1,
        justifyContent: 'center'
    }
});
