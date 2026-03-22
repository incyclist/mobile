import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    LayoutChangeEvent
} from 'react-native';
import { SettingsSlideInProps } from './types';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

export const SettingsSlideIn = ({
    visible,
    sections,
    onClose,
    onSectionPress
}: SettingsSlideInProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const { logEvent } = useLogging('SettingsSlideIn');

    const panelWidth = screenWidth * 0.35;
    
    // Start off-screen (left)
    const animTranslateX = useRef(new Animated.Value(-panelWidth)).current;
    
    // Track animation state to handle backdrop visibility and pointer events
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFullyClosed, setIsFullyClosed] = useState(!visible);

    useEffect(() => {
        const targetValue = visible ? 0 : -panelWidth;
        
        if (visible) {
            setIsFullyClosed(false);
            setIsAnimating(true);
        } else {
            setIsAnimating(true);
        }

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
    }, [visible, animTranslateX, panelWidth]);

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

            {/* Side Panel */}
            <Animated.View
                style={[
                    styles.panel,
                    { 
                        width: panelWidth, 
                        transform: [{ translateX: animTranslateX }] 
                    },
                ]}
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
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panel: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        zIndex: 1000,
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