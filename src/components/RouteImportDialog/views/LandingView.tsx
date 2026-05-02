import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { Icon } from '../../Icon';
import { IconName } from '../../Icon/types';
import { useLogging } from '../../../hooks';

interface LandingViewProps {
    compact: boolean;
    onAddGpx: () => void;
    onAddVideoRoute: () => void;
    onSelectFolder: () => void;
}

const OptionTile = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    compact 
}: { 
    icon: IconName; 
    title: string; 
    subtitle: string; 
    onPress: () => void; 
    compact: boolean;
}) => {
    return (
        <TouchableOpacity 
            style={[styles.tile, compact && styles.tileCompact]} 
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <Icon name={icon} size={compact ? 24 : 32} color={colors.icon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.tileTitle, compact && styles.tileTitleCompact]}>{title}</Text>
                <Text style={[styles.tileSubtitle, compact && styles.tileSubtitleCompact]}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const LandingView = ({ 
    compact, 
    onAddGpx, 
    onAddVideoRoute, 
    onSelectFolder, 
}: LandingViewProps) => {
    const { logEvent } = useLogging('LandingView');

    const handleAddGpx = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'add-gpx', eventSource: 'user' });
        onAddGpx();
    }, [logEvent, onAddGpx]);

    const handleAddVideoRoute = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'add-video-route', eventSource: 'user' });
        onAddVideoRoute();
    }, [logEvent, onAddVideoRoute]);

    const handleSelectFolder = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'import-library', eventSource: 'user' });
        onSelectFolder();
    }, [logEvent, onSelectFolder]);

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            <View style={styles.optionsContainer}>
                <OptionTile 
                    icon='plus' 
                    title='Add GPX' 
                    subtitle='Individual route file' 
                    onPress={handleAddGpx} 
                    compact={compact} 
                />
                {Platform.OS === 'ios' && (
                    <OptionTile 
                        icon='plus' 
                        title='Add Video Route' 
                        subtitle='EPM, RLV or XML file' 
                        onPress={handleAddVideoRoute} 
                        compact={compact} 
                    />
                )}
                <OptionTile 
                    icon='import-route' 
                    title='Import Video Library' 
                    subtitle='Scan folder for videos' 
                    onPress={handleSelectFolder} 
                    compact={compact} 
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    containerCompact: {
        padding: 10,
    },
    optionsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    tile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
    },
    tileCompact: {
        padding: 12,
        marginVertical: 4,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    tileTitle: {
        fontSize: textSizes.listEntry,
        color: colors.text,
        fontWeight: '700',
    },
    tileTitleCompact: {
        fontSize: textSizes.normalText,
    },
    tileSubtitle: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
        marginTop: 2,
    },
    tileSubtitleCompact: {
        fontSize: textSizes.smallText,
    },
});