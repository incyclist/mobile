import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { Icon } from '../../Icon';
import { IconName } from '../../Icon/types';
import { ButtonBar } from '../../ButtonBar/ButtonBar';

interface LandingViewProps {
    compact: boolean;
    onAddGpx: () => void;
    onAddVideoRoute: () => void;
    onSelectFolder: () => void;
    onCancel: () => void;
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
    onCancel 
}: LandingViewProps) => {
    const buttons = useMemo(() => [
        { label: 'Cancel', onClick: onCancel }
    ], [onCancel]);

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            <View style={styles.optionsContainer}>
                <OptionTile 
                    icon='plus' 
                    title='Add GPX' 
                    subtitle='Individual route file' 
                    onPress={onAddGpx} 
                    compact={compact} 
                />
                <OptionTile 
                    icon='plus' 
                    title='Add Video Route' 
                    subtitle='EPM, RLV or XML file' 
                    onPress={onAddVideoRoute} 
                    compact={compact} 
                />
                <OptionTile 
                    icon='import-route' 
                    title='Import Video Library' 
                    subtitle='Scan folder for videos' 
                    onPress={onSelectFolder} 
                    compact={compact} 
                />
            </View>
            <ButtonBar buttons={buttons} />
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
        fontSize: 10,
    },
});