import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { RouteSourceSublineProps } from './types';
import { getSublineText } from './utils';

/** `• <Name>` / `• Needs <Name>` after the type of a list row; nothing for a route that is not tied to a computer. */
export const RouteSourceSubline = ({ availability, sourceLabel }: RouteSourceSublineProps) => {
    const text = getSublineText({ availability, sourceLabel });
    if (!text)
        return null;

    const style = availability === 'unavailable' ? styles.unavailable : styles.fromLink;
    return <Text style={style} numberOfLines={1}>{`  ${text}`}</Text>;
};

const styles = StyleSheet.create({
    fromLink: { color: colors.tileIdle, fontSize: 12, flexShrink: 1 },
    unavailable: { color: colors.disabled, fontSize: 12, flexShrink: 1 },
});
