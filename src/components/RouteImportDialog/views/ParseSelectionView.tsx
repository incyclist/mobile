import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ParseSelectionViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const ParseSelectionView = ({
    displayProps,
    selectedIds,
    onToggleRoute,
    onSelectAll,
    onDeselectAll,
}: ParseSelectionViewProps) => {
    const routes = displayProps.routes ?? [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.countText}>{routes.length} routes found</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={onSelectAll}>
                        <Text style={styles.headerAction}>Select All</Text>
                    </TouchableOpacity>
                    <Text style={styles.divider}>|</Text>
                    <TouchableOpacity onPress={onDeselectAll}>
                        <Text style={styles.headerAction}>Deselect All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.list}>
                {routes.map((route) => {
                    const isSelected = selectedIds.includes(route.id);
                    return (
                        <TouchableOpacity
                            key={route.id}
                            style={[styles.item, isSelected && styles.itemSelected]}
                            onPress={() => onToggleRoute(route.id)}
                        >
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]} />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle}>{route.title}</Text>
                                <Text style={styles.itemSub}>
                                    {route.distance ? `${(route.distance / 1000).toFixed(1)} km` : 'No distance'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    countText: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    headerAction: {
        color: colors.buttonPrimary,
        fontSize: textSizes.smallText,
        fontWeight: 'bold',
    },
    divider: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
    },
    list: {
        maxHeight: 400,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    itemSelected: {
        backgroundColor: 'rgba(221, 153, 51, 0.1)',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.disabled,
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: colors.buttonPrimary,
        borderColor: colors.buttonPrimary,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '500',
    },
    itemSub: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
    },
});