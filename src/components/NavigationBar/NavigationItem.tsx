import React from 'react';
import { TouchableOpacity, View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { TNavigationItem } from './types';
import { colors } from '../../theme/colors';

interface Props {
    item: TNavigationItem;
    selected?: boolean;
    onPress: (item: TNavigationItem) => void;
    children: React.ReactNode;
}

export const NavigationItem = (props: Props) => {
    const { item, selected, onPress, children } = props;

    const {height} = useWindowDimensions()

    const iconSize = Math.min(height/20,64)
    const small = height < 400
    const value = item.toString()
    const displayText = value.charAt(0).toUpperCase() + value.slice(1)

    const styles = StyleSheet.create({
        container: {
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom:4,
            width: '100%',
        },
        selected: {
            height: small ? iconSize+20 :iconSize+32,
            backgroundColor: colors.navigationSelected,
            color: colors.iconSelected,
            borderRadius: 12,
            padding: 4,

        },
        normal: {
            height: small ? iconSize+20 :iconSize+32,
            color: colors.icon,
            padding: 4,
            borderRadius: 4,

        },
        label: {
            color: selected ? colors.iconSelected : colors.icon ,
            fontSize: 16
        }
    });


    return (
        <TouchableOpacity
            style={[
                styles.container,
                selected && styles.selected
            ]}
            onPress={() => onPress(item)}
        >
            <View style={selected ? styles.selected : styles.normal}>
                <View>
                    {children}
                </View>

                {!small && <View >
                    <Text style={styles.label}>{displayText}</Text>
                </View>}
            </View>
        </TouchableOpacity>
    );
};

