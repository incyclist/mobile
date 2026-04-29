import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { TNavigationItem } from './types';
import { colors } from '../../theme/colors';
import { useLogging } from '../../hooks';

interface Props {
    item: TNavigationItem;
    selected?: boolean;
    compact?: boolean;
    disabled?: boolean;
    onPress: (item: TNavigationItem) => void;
    children: React.ReactNode;
}

export const NavigationItem = (props: Props) => {
    const { item, selected, compact, onPress, children,disabled=false } = props;
    const {logEvent} = useLogging('Incyclist')

    const value = item.toString();
    const displayText = value.charAt(0).toUpperCase() + value.slice(1);

    const onPressHandler = (next:TNavigationItem)=> {
        logEvent({ message:'button clicked',button:next})
        onPress(next)

    }

    return (
        <TouchableOpacity
            style={[styles.container, selected && styles.selected]}
            onPress={() => onPressHandler(item)}
        >
            <View style={selected ? styles.selectedContent : styles.normalContent}>
                <View>{children}</View>
                {!compact && (
                    <View>
                        <Text style={[styles.label, selected&&disabled && styles.labelDisabled, selected&&!disabled && styles.labelSelected]}>
                            {displayText}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        width: '100%',
    },
    selected: {
        backgroundColor: colors.navigationSelected,
        borderRadius: 12,
    },
    selectedContent: {
        padding: 4,
        alignItems: 'center',
    },
    normalContent: {
        padding: 4,
        alignItems: 'center',
    },
    label: {
        color: colors.icon,
        fontSize: 14,
        marginTop: 2,
    },
    labelSelected: {
        color: colors.iconSelected,
    },
    labelDisabled: {
        color: colors.iconDisabled
    },

});
