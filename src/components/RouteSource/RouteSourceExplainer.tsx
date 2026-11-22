import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { RouteSourceExplainerProps } from './types';
import { getExplainerText } from './utils';

/** The line under the filter row that says why some routes are greyed out. */
export const RouteSourceExplainer = ({ computerNames, onDismiss }: RouteSourceExplainerProps) => {
    const text = getExplainerText(computerNames);
    if (!text)
        return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text} numberOfLines={2}>{text}</Text>
            <TouchableOpacity onPress={onDismiss} hitSlop={styles.hitSlop} accessibilityLabel="Dismiss">
                <Text style={styles.dismiss}>✕</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 4 },
    text: { flex: 1, color: colors.disabled, fontSize: 12 },
    dismiss: { color: colors.disabled, fontSize: 14 },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
});
