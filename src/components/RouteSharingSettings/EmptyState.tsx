import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import type { RouteSharingPlatform } from './types';

const INTRO = "Ride the video routes you've added to Incyclist on your computer — including ones stored on a NAS or an external drive — without copying them to this device.";
const INTRO_PHONE = "Ride the video routes you've added to Incyclist on your computer, without copying them to this device.";
const STEPS = [
    'On your computer, open Incyclist and go to Settings › Routes › Route Sharing.',
    'Click "Connect your phone or tablet".',
    'Here, tap Add Computer.',
];
const IOS_LINE = 'If your device asks to find devices on your network, tap Allow.';
const PRIVACY = 'Routes stay on your computer. Nothing is uploaded anywhere, and this only works while both devices are on the same network.';

/** State M-E: no computer connected yet. */
export const EmptyState = ({ platform, compact }: { platform: RouteSharingPlatform; compact: boolean }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{compact ? INTRO_PHONE : INTRO}</Text>
        {STEPS.map((step, i) => (
            <Text key={step} style={styles.step}>{`${i + 1}. ${step}`}</Text>
        ))}
        {platform === 'ios' && <Text style={styles.text}>{IOS_LINE}</Text>}
        <Text style={styles.text}>{PRIVACY}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 6,
    },
    step: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 3,
    },
});
