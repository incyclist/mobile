import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { colors, textSizes } from '../../theme';
import { SettingsPageViewProps, SettingsSectionItem } from './types';

export const SettingsPageView = ({ sections, onClose }: SettingsPageViewProps) => {
    const renderItem = ({ item }: { item: SettingsSectionItem }) => (
        <TouchableOpacity style={styles.row} onPress={item.onPress}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={sections}
                renderItem={renderItem}
                keyExtractor={(item) => item.label}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    title: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
        fontWeight: '600',
    },
    closeButton: {
        padding: 5,
    },
    closeIcon: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
    },
    listContent: {
        paddingTop: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
});