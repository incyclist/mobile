import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { Icon } from '../Icon';
import { AppDisplayProps, AppsSettingsViewProps } from './types';

const AppRow = ({ 
    app, 
    onSelect 
}: { 
    app: AppDisplayProps; 
    onSelect?: (key: string) => void; 
    compact?: boolean 
}) => {
    const handlePress = useCallback(() => onSelect?.(app.key), [app.key, onSelect]);
    const isSvg = app.iconUrl.toLowerCase().endsWith('.svg');
    const dotStyle = [
        styles.dot, 
        { backgroundColor: app.isConnected ? colors.success : colors.disabled }
    ];

    return (
        <TouchableOpacity style={styles.row} onPress={handlePress}>
            <View style={styles.iconContainer}>
                {isSvg ? (
                    <SvgUri uri={app.iconUrl} width="100%" height="100%" />
                ) : (
                    <Image source={{ uri: app.iconUrl }} style={styles.image} />
                )}
            </View>
            <Text style={styles.name}>{app.name}</Text>
            <View style={dotStyle} />
            <Icon name="chevron-right" size={20} color={colors.text} />
        </TouchableOpacity>
    );
};

export const AppsSettingsView = ({ apps = [], onSelect, compact }: AppsSettingsViewProps) => {
    return (
        <ScrollView style={styles.container}>
            {apps.map((app) => (
                <AppRow 
                    key={app.key} 
                    app={app} 
                    onSelect={onSelect} 
                    compact={compact} 
                />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    iconContainer: {
        width: 32,
        height: 32,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    name: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 16,
    },
});