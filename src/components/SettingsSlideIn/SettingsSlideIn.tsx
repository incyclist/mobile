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
import { useLogging, useScreenLayout } from '../../hooks'; // Add useScreenLayout

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
    const { width: screenWidth } = useWindowDimensions();
    const { logEvent } = useLogging('SettingsSlideIn');
    const layout = useScreenLayout(); // Get screen layout
    const isCompact = layout === 'compact'; // Determine if compact

    // Calculate widths as per instructions
    const stripWidth = isCompact ? 70 : 150;
    const panelWidth = screenWidth * 0.35; // Unchanged fixed panel width
    const totalWidth = stripWidth + panelWidth; // Total width of the sliding unit
    
    // Start off-screen (left)
    const animTranslateX = useRef(new Animated.Value(-totalWidth)).current; // Use totalWidth for initial position
    
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

        const targetValue = visible ? 0 : -totalWidth; // Use totalWidth for target
        
        if (visible) {
            setIsFullyClosed(false);
        }
        setIsAnimating(true);

        Animated.timing(animTranslateX, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            if (!visible) {
                setIsFullyClosed(true);
            }
        });
    }, [visible, animTranslateX, totalWidth]); // Add totalWidth to deps

    const handleSectionPress = (label: string) => {
        logEvent({ message: 'menu item clicked', item: label, eventSource: 'user' });
        onSectionPress(label);
    };

    // If fully closed and not animating, don't show the backdrop/content
    if (isFullyClosed && !isAnimating) {
        return null;
    }

    const backdropPointerEvents = visible ? 'auto' : 'none';
    const backdropOpacity = visible ? 1 : 0;

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
                    styles.panelContainer, // Container for both strip and panel
                    { width: totalWidth }, // Apply total width to the animated unit
                    { transform: [{ translateX: animTranslateX }] }
                ]}
            >
                {/* Transparent Tap Zone Column */}
                <TouchableOpacity 
                    onPress={onClose} 
                    style={[styles.stripZone, { width: stripWidth }]} 
                    testID="settings-slide-in-tap-zone"
                />

                {/* Sections Panel */}
                <BackgroundContainer
                    colors={gradientColors}
                    style={[panelBackgroundStyle, { width: panelWidth }]} // Explicit panel width
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
    panelContainer: { // New style for the sliding unit wrapper
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        flexDirection: 'row', // Arrange strip and panel side-by-side
    },
    stripZone: {
        alignSelf: 'stretch', // Ensures it takes full height of panelContainer
        // No background color, it should be transparent
    },
    content: {
        flex: 1, // Content needs to flex within its parent BackgroundContainer
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