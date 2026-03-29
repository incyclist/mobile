import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Platform,
    Text
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SettingsSlideInProps } from './types';
import { colors, textSizes } from '../../theme';
import { useLogging, useScreenLayout } from '../../hooks';

const gradientColors = colors.dialogBackground;
const BackgroundContainer = Platform.OS === 'web' ? View : (LinearGradient as any);
const panelBackgroundStyle = Platform.OS === 'web'
    ? { backgroundColor: gradientColors[gradientColors.length - 1] }
    : { flex: 1 };

export const SettingsSlideIn = ({
    visible,
    sections,
    onClose,
    onSectionPress
}: SettingsSlideInProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { logEvent } = useLogging('SettingsSlideIn');
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const NAV_BAR_HEIGHT = 56;

    // Layout calculations
    const stripSize = isCompact ? NAV_BAR_HEIGHT : 150;
    const panelWidth = screenWidth * 0.35;
    const totalSize = isCompact ? screenHeight : (stripSize + panelWidth);
    
    // Start off-screen
    const animPos = useRef(new Animated.Value(-totalSize)).current;
    
    // Track animation state to handle backdrop visibility and pointer events
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFullyClosed, setIsFullyClosed] = useState(!visible);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            if (!visible) {
                return;
            }
        }

        const targetValue = visible ? 0 : -totalSize;
        
        if (visible) {
            setIsFullyClosed(false);
        }
        setIsAnimating(true);

        Animated.timing(animPos, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            if (!visible) {
                setIsFullyClosed(true);
            }
        });
    }, [visible, animPos, totalSize]);

    const handleSectionPress = (label: string) => {
        logEvent({ message: 'menu item clicked', item: label, eventSource: 'user' });
        onSectionPress(label);
    };

    if (isFullyClosed && !isAnimating) {
        return null;
    }

    const backdropPointerEvents = visible ? 'auto' : 'none';
    const backdropOpacity = visible ? 1 : 0;

    const dynamicContainerStyle = isCompact 
        ? { height: totalSize, width: screenWidth, flexDirection: 'column' as const } 
        : { width: totalSize, flexDirection: 'row' as const };

    const dynamicTransform = isCompact 
        ? { translateY: animPos } 
        : { translateX: animPos };

    const dynamicStripStyle = isCompact 
        ? { height: stripSize, width: '100%' } 
        : { width: stripSize, height: '100%' };

    const dynamicPanelStyle = isCompact 
        ? { flex: 1, width: '100%' } 
        : { width: panelWidth, height: '100%' };

    return (
        <View 
            style={StyleSheet.absoluteFill} 
            pointerEvents={visible || isAnimating ? 'box-none' : 'none'}
            testID="settings-slide-in"
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View 
                    style={[styles.backdrop, { opacity: backdropOpacity }]} 
                    pointerEvents={backdropPointerEvents} 
                    testID="settings-backdrop"
                />
            </TouchableWithoutFeedback>

            {/* Sliding Unit (Tap Zone + Panel) */}
            <Animated.View
                style={[
                    styles.panelContainer,
                    dynamicContainerStyle,
                    { transform: [dynamicTransform] }
                ]}
            >
                {/* Transparent Tap Zone */}
                <TouchableOpacity 
                    onPress={onClose} 
                    style={[styles.stripZone, dynamicStripStyle]} 
                    testID="settings-slide-in-tap-zone"
                />

                {/* Sections Panel */}
                <BackgroundContainer
                    colors={gradientColors}
                    style={[panelBackgroundStyle, dynamicPanelStyle]}
                >
                    <View style={styles.content}>
                        {sections.map((section) => (
                            <TouchableOpacity 
                                key={section.label}
                                style={styles.row} 
                                onPress={() => handleSectionPress(section.label)}
                                testID={`section-${section.label}`}
                            >
                                <Text style={styles.label}>{section.label}</Text>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BackgroundContainer>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panelContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
    },
    stripZone: {
        alignSelf: 'stretch',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
});