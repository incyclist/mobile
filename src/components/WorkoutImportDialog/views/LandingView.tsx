import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../../Icon';
import { colors, textSizes } from '../../../theme';

interface LandingViewProps {
    compact: boolean;
    onPickFile: () => void;
}

export const LandingView = ({ compact, onPickFile }: LandingViewProps) => (
    <View style={[styles.container, compact && styles.containerCompact]}>
        <TouchableOpacity style={[styles.tile, compact && styles.tileCompact]} onPress={onPickFile}>
            <View style={styles.iconContainer}>
                <Icon name="import-route" size={compact ? 24 : 32} color={colors.icon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.tileTitle, compact && styles.tileTitleCompact]}>
                    Choose Workout File
                </Text>
                <Text style={[styles.tileSubtitle, compact && styles.tileSubtitleCompact]}>
                    .zwo or .json
                </Text>
            </View>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    containerCompact: {
        padding: 10,
    },
    tile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        padding: 16,
    },
    tileCompact: {
        padding: 12,
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
