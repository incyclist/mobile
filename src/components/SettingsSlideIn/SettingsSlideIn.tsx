import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    useWindowDimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { useScreenLayout } from '../../hooks/useScreenLayout';
import { colors } from '../../theme/colors';
import { Props } from './types';

export const SettingsSlideIn = ({ isOpen, onClose, children }: Props) => {
    const layout = useScreenLayout();
    const { width: screenWidth } = useWindowDimensions();

    const isCompact = layout === 'compact';
    const stripWidth = isCompact ? 70 : 150;
    const panelWidth = screenWidth * 0.35;
    const totalWidth = stripWidth + panelWidth;

    const refSlideAnim = useRef(new Animated.Value(totalWidth)).current;

    useEffect(() => {
        Animated.timing(refSlideAnim, {
            toValue: isOpen ? 0 : totalWidth,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isOpen, totalWidth, refSlideAnim]);

    const slideStyle = useMemo(() => ({
        transform: [{ translateX: refSlideAnim }],
        width: totalWidth,
    }), [refSlideAnim, totalWidth]);

    const stripWidthStyle = useMemo(() => ({ width: stripWidth }), [stripWidth]);
    const panelWidthStyle = useMemo(() => ({ width: panelWidth }), [panelWidth]);

    return (
        <>
            {isOpen && (
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}
            <Animated.View style={[styles.container, slideStyle]}>
                {/* Transparent NavBar-width tap zone — tapping calls onClose */}
                <TouchableOpacity
                    style={[styles.stripZone, stripWidthStyle]}
                    onPress={onClose}
                    activeOpacity={1}
                />
                <View style={[styles.panel, panelWidthStyle]}>
                    {children}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 999,
    },
    stripZone: {
        alignSelf: 'stretch',
        // No backgroundColor — fully transparent, NavBar shows through
    },
    panel: {
        backgroundColor: colors.background,
        height: '100%',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
    },
});