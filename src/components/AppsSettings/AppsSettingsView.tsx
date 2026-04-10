import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { AppsSettingsViewProps, AppDisplayProps } from './types';

const AppRow = ({ app, onSelect }: { app: AppDisplayProps; onSelect?: (key: string) => void }) => {
    const isSvg = app.iconUrl.toLowerCase().endsWith('.svg');
    
    const handlePress = useCallback(() => {
        onSelect?.(app.key);
    }, [app.key, onSelect]);

    const badgeStyle = [
        styles.badge,
        { backgroundColor: app.isConnected ? colors.success : colors.disabled }
    ];

    return (
        <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.leftContainer}>
                <View style={styles.iconWrapper}>
                    {isSvg ? (
                        <SvgUri uri={app.iconUrl} width="100%" height="100%" />
                    ) : (
                        <Image source={{ uri: app.iconUrl }} style={styles.image} />
                    )}
                </View>
                <Text style={styles.appName}>{app.name}</Text>
            </View>
            <View style={styles.rightContainer}>
                <View style={badgeStyle} />
                <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
};

export const AppsSettingsView = ({ apps, onSelect, compact }: AppsSettingsViewProps) => {
    const containerStyle = [
        styles.container,
        compact && styles.compact
    ];

    return (
        <ScrollView style={containerStyle}>
            {apps?.map((app) => (
                <AppRow key={app.key} app={app} onSelect={onSelect} />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    compact: {
        paddingHorizontal: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    appName: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    chevron: {
        color: colors.disabled,
        fontSize: 24,
        fontWeight: 'bold',
    },
});