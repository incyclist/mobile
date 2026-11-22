import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import type { RouteSharingPlatform } from './types';
import { getStoreName } from './utils';

/** The dead-end screen of an app that is too old for Route Sharing. */
export const UpdatePrompt = ({ platform }: { platform: RouteSharingPlatform }) => (
    <View style={styles.container}>
        <Text style={styles.title}>Update Incyclist to use Route Sharing</Text>
        <Text style={styles.text}>
            {`This version of the Incyclist app can't connect to a computer yet. Update it from the ${getStoreName(platform)}, then come back here.`}
        </Text>
        <Text style={styles.text}>
            Everything else in the app keeps working as usual — only Route Sharing needs the newer version.
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '700',
        paddingBottom: 12,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingBottom: 12,
    },
});
