import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { Icon } from '../Icon';
import { RouteSourcePillProps } from './types';

export const PILL_WIDTH = 22;

/** Icon-only pill of a list row whose route plays from, or needs, a computer; nothing for any other state. */
export const RouteSourcePill = ({ availability }: RouteSourcePillProps) => {
    if (availability === 'fromLink') {
        return (
            <View style={[styles.pill, styles.pillComputer]}>
                <Icon name="monitor" size={12} color={colors.text} />
            </View>
        );
    }
    if (availability === 'unavailable') {
        return (
            <View style={[styles.pill, styles.pillUnavailable]}>
                <Icon name="monitor-off" size={12} color={colors.background} />
            </View>
        );
    }
    return null;
};

const styles = StyleSheet.create({
    pill: {
        width: PILL_WIDTH,
        alignItems: 'center',
        paddingVertical: 1,
        borderRadius: 4,
    },
    pillComputer: { backgroundColor: colors.tileIdle },
    pillUnavailable: { backgroundColor: colors.disabled },
});
