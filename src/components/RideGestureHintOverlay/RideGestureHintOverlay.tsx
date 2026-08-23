import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../ButtonBar';
import { BinarySelect } from '../BinarySelect';
import { colors, textSizes } from '../../theme';
import { RideGestureHintOverlayProps } from './types';

/**
 * First-ride education overlay teaching the ride screen's swipe gestures
 * (workout-mobile-hld.md §3.2 "RideGestureHintOverlay", session 5.9).
 *
 * Deliberately NOT a Dialog — no modal chrome, no opaque backing. Renders as an
 * absolutely-positioned, full-bleed, transparent layer stacked on top of the live ride content
 * (RideDashboard/WorkoutGraph/WorkoutStepsList stay visible underneath, unobscured). Only the
 * text/legend block itself gets a translucent scrim, sized to the block, just enough to keep the
 * text legible without meaningfully dimming the rest of the screen. Touches outside the scrim
 * pass through to whatever's underneath (`pointerEvents="box-none"` on the full-bleed wrapper).
 *
 * Visibility is entirely owned by `RidePageService` (`gestureHint` display prop) — this
 * component only renders what it's told (the caller gates rendering on `gestureHint !== null`)
 * and never inspects ride/activity state itself. Message/legend content arrive as props, not
 * hardcoded, so every ride screen that renders this (Workout, GPX, Video) supplies its own copy
 * matched to what its swipe gestures actually do in the rider's current mode.
 */
export const RideGestureHintOverlay = (props: RideGestureHintOverlayProps) => {
    const {
        message,
        legendIntro = 'Swipe the screen to control your workout:',
        legend,
        compact,
        dontShowAgainLabel = "Don't show this again",
        closeLabel = 'Got it',
        onDismiss,
    } = props;

    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = useCallback(() => {
        onDismiss({ dontShowAgain });
    }, [onDismiss, dontShowAgain]);

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            <View style={[styles.scrim, compact ? styles.scrimCompact : styles.scrimNormal]}>
                <Text style={[styles.message, compact ? styles.messageCompact : styles.messageNormal]}>
                    {message}
                </Text>

                <Text style={[styles.legendIntro, compact ? styles.legendIntroCompact : styles.legendIntroNormal]}>
                    {legendIntro}
                </Text>

                <View style={styles.legend}>
                    {legend.map(item => (
                        <View key={item.label} style={[styles.legendRow, compact ? undefined : styles.legendRowNormal]}>
                            <Text style={[styles.legendSymbol, compact ? styles.legendTextCompact : styles.legendTextNormal]}>
                                {item.symbol}
                            </Text>
                            <Text style={[styles.legendLabel, compact ? styles.legendTextCompact : styles.legendTextNormal]}>
                                {compact ? item.label : (item.description ?? item.label)}
                            </Text>
                        </View>
                    ))}
                </View>

                <BinarySelect
                    label={dontShowAgainLabel}
                    value={dontShowAgain}
                    onValueChange={setDontShowAgain}
                />

                <View style={styles.buttonRow}>
                    <Button id="gesture-hint-close" label={closeLabel} primary={true} onClick={handleClose} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    scrim: {
        // Reduced from an earlier 0.72 (2026-07-25 visual review against a simulated ride photo
        // background, RideGestureHintOverlay.stories.tsx's *OverRide stories) — 0.72 read as
        // nearly opaque, hiding far more of the live ride screen behind it than the "stays
        // visible underneath" design intent called for. 0.5 keeps the text legible while letting
        // the dashboard/graph/photo behind it still read through clearly.
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        alignItems: 'center',
    },
    scrimCompact: {
        maxWidth: '86%',
    },
    scrimNormal: {
        // Tablets have plenty of room — let the box grow wide enough for full sentences to wrap
        // comfortably on one or two lines instead of a tall, narrow column.
        maxWidth: 640,
        width: '70%',
    },
    message: {
        color: colors.text,
        textAlign: 'center',
        fontWeight: '700',
    },
    messageNormal: {
        fontSize: textSizes.dialogTitle,
        marginBottom: 8,
    },
    messageCompact: {
        fontSize: textSizes.normalText,
        marginBottom: 6,
    },
    legendIntro: {
        color: colors.text,
        textAlign: 'center',
        fontWeight: '600',
    },
    legendIntroNormal: {
        fontSize: textSizes.normalText,
        marginBottom: 14,
    },
    legendIntroCompact: {
        fontSize: textSizes.smallText,
        marginBottom: 8,
    },
    legend: {
        marginBottom: 12,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 2,
    },
    legendRowNormal: {
        // Full sentences read better left-aligned within the row than centered word-wrap.
        justifyContent: 'flex-start',
        marginVertical: 6,
    },
    legendSymbol: {
        color: colors.text,
        fontWeight: '700',
        marginRight: 8,
    },
    legendLabel: {
        color: colors.text,
        flexShrink: 1,
    },
    legendTextNormal: {
        fontSize: textSizes.normalText,
    },
    legendTextCompact: {
        fontSize: textSizes.subtitle,
    },
    buttonRow: {
        marginTop: 8,
    },
});
