import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { RideViewNoticeProps } from './types';

const DISMISS_AFTER = 8000;

/**
 * One-line, self-dismissing in-ride notice. `notice` is a one-shot prop - the service sets it
 * once (`rideViewNotice` after a Street View start fallback;
 * `svCoverageNotice` on every no-imagery answer) and clears it on the next read, so its presence
 * (never any raw cause/status) is captured into local state here to survive that prop going back
 * to undefined on the very next page update.
 */
export const RideViewNotice = ({ notice, message }: RideViewNoticeProps) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!notice)
            return;

        setVisible(true);
        const to = setTimeout(() => setVisible(false), DISMISS_AFTER);
        return () => clearTimeout(to);
    }, [notice]);

    if (!visible)
        return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.toast}>
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '4%',
        alignItems: 'center',
        zIndex: 20,
    },
    toast: {
        backgroundColor: 'rgba(25,25,25,0.85)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        maxWidth: '90%',
    },
    text: {
        color: colors.text,
        fontSize: 16,
        textAlign: 'center',
    },
});
