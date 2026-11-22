import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { Icon } from '../Icon';
import { RouteSourceInfoProps } from './types';
import { getHintText, getPlaysFromText, getUnavailableText, getWhatToDoText } from './utils';

/**
 * What Route Details says about where the route plays from: the source and a grey hint for a route
 * that plays from a computer, the reason and what to do for a route that can not be started.
 * Renders only what the page service reported.
 */
export const RouteSourceInfo = (props: RouteSourceInfoProps) => {
    const { availability, sourceLabel, shortHint, reasonShown } = props;

    if (availability === 'fromLink') {
        return (
            <View style={styles.container}>
                <View style={styles.sourceRow}>
                    <Icon name="monitor" size={14} color={colors.tileIdle} />
                    <Text style={styles.source}>{getPlaysFromText(sourceLabel) ?? 'Plays from a computer'}</Text>
                </View>
                <Text style={styles.hint}>{getHintText(sourceLabel, !!shortHint)}</Text>
            </View>
        );
    }

    if (availability === 'unavailable') {
        const reason = getUnavailableText(props);
        const whatToDo = getWhatToDoText(props);
        return (
            <View style={styles.container}>
                {!reasonShown && !!reason && <Text style={styles.reason}>{reason}</Text>}
                {!!whatToDo && <Text style={styles.hint}>{whatToDo}</Text>}
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 15, paddingVertical: 4, gap: 4 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    source: { color: colors.tileIdle, fontSize: 14 },
    hint: { color: colors.disabled, fontSize: 12 },
    reason: { color: colors.error, fontSize: 14 },
});
