import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../../Icon';
import { LandingViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const LandingView = ({ onAddGpx, onAddVideoRoute, onSelectFolder }: LandingViewProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                Choose how you want to add routes to your library.
            </Text>

            <View style={styles.tiles}>
                <TouchableOpacity style={styles.tile} onPress={onAddGpx}>
                    <Icon name="plus" size={32} color={colors.text} />
                    <Text style={styles.tileTitle}>Add GPX</Text>
                    <Text style={styles.tileSub}>Single route file</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={onAddVideoRoute}>
                    <Icon name="plus" size={32} color={colors.text} />
                    <Text style={styles.tileTitle}>Add Video</Text>
                    <Text style={styles.tileSub}>Route with video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile} onPress={onSelectFolder}>
                    <Icon name="funnel" size={32} color={colors.text} />
                    <Text style={styles.tileTitle}>Import Folder</Text>
                    <Text style={styles.tileSub}>Scan directory</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    description: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginBottom: 24,
        textAlign: 'center',
    },
    tiles: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    tile: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tileTitle: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    tileSub: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 4,
        textAlign: 'center',
    },
});