import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppsDialogProps } from './types';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';
import { AppSettingsContext } from '../AppSettingsView/AppSettingsView';
import { OAuthAppSettings } from '../OAuthAppSettings/OAuthAppSettings';
import { KomootSettings } from '../KomootSettings/KomootSettings';

const APP_SECTIONS = [
    { key: 'strava', name: 'Strava' },
    { key: 'intervals', name: 'Intervals.icu' },
    { key: 'komoot', name: 'Komoot' },
];

export const AppsDialog = ({
    visible,
    apps,
    onClose,
    renderApp: renderAppProp,
}: AppsDialogProps) => {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const handleToggle = useCallback((key: string) => {
        setExpandedKey(prev => (prev === key ? null : key));
    }, []);

    const defaultRenderApp = useCallback((key: string, onBack: () => void) => {
        if (key === 'komoot') {
            return <KomootSettings onBack={onBack} />;
        }
        return <OAuthAppSettings appKey={key} onBack={onBack} />;
    }, []);

    const renderApp = renderAppProp || defaultRenderApp;

    const dialogButtons = useMemo(() => [
        { label: 'Close', onClick: onClose, primary: true }
    ], [onClose]);

    return (
        <Dialog
            title="Apps"
            variant="full"
            visible={visible}
            onOutsideClick={onClose}
            buttons={dialogButtons}
        >
            <View style={styles.container}>
                {APP_SECTIONS.map((section) => {
                    const appData = apps.find(a => a.key === section.key);
                    const isConnected = appData?.isConnected ?? false;
                    const isExpanded = expandedKey === section.key;

                    const handlePress = () => handleToggle(section.key);

                    const badgeStyle = [
                        styles.badge,
                        { backgroundColor: isConnected ? colors.success : colors.disabled }
                    ];

                    return (
                        <View key={section.key} style={styles.section}>
                            <TouchableOpacity 
                                style={styles.header} 
                                onPress={handlePress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.headerLeft}>
                                    <Text style={styles.appName}>{section.name}</Text>
                                    <View style={badgeStyle} />
                                </View>
                                <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
                                    {'>'}
                                </Text>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.body}>
                                    <AppSettingsContext.Provider value={{ standalone: false }}>
                                        {renderApp(section.key, onClose, false)}
                                    </AppSettingsContext.Provider>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appName: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 12,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    chevronExpanded: {
        transform: [{ rotate: '90deg' }],
    },
    body: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
});