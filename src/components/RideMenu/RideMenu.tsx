import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Pressable,
    LayoutChangeEvent
} from 'react-native';
import { RideMenuProps } from './types';
import { colors, textSizes } from '../../theme';
import { useScreenLayout, useLogging } from '../../hooks';
import { Icon } from '../Icon';

export const RideMenu = ({
    visible,
    onClose,
    onEndRide,
    onSettings,
    onCustomize
}: RideMenuProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const { logEvent } = useLogging('Incyclist');

    const panelWidth = isCompact ? screenWidth * 0.80 : Math.min(300, screenWidth * 0.35);
    
    // Start off-screen (bottom)
    const refPanelHeight = useRef<number>(1000);
    const animTranslateY = useRef(new Animated.Value(1000)).current;
    
    // Track animation state to handle backdrop visibility and pointer events
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFullyClosed, setIsFullyClosed] = useState(!visible);

const onLayout = (event: LayoutChangeEvent) => {
    refPanelHeight.current = event.nativeEvent.layout.height;
};

    useEffect(() => {
        const targetValue = visible ? 0 : refPanelHeight.current;
        
        if (visible) {
            setIsFullyClosed(false);
            setIsAnimating(true);
        } else {
            setIsAnimating(true);
        }

        Animated.timing(animTranslateY, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            if (!visible) {
                setIsFullyClosed(true);
            }
        });
    }, [visible, animTranslateY]);

    const renderMenuItem = (
        iconName: any, 
        label: string, 
        onPress?: () => void
    ) => {
        const isDisabled = !onPress;

        const handlePress = () => {
            logEvent({ message: 'button clicked', button: label });
            onPress!();
        };

        return (
            <Pressable
                onPress={isDisabled ? undefined : handlePress}
                disabled={isDisabled}
                style={({ pressed }) => [
                    styles.menuItem,
                    pressed && !isDisabled && styles.menuItemPressed,
                    isDisabled && styles.menuItemDisabled
                ]}
            >
                <View style={styles.menuItemIcon}>
                    <Icon 
                        name={iconName} 
                        size={24} 
                        color={isDisabled ? 'rgba(255,255,255,0.35)' : colors.text} 
                    />
                </View>
                <Text style={[
                    styles.menuItemLabel,
                    isDisabled && styles.menuItemLabelDisabled
                ]}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    // If fully closed and not animating, don't show the backdrop/content
    if (isFullyClosed && !isAnimating) {
        return null;
    }

    const backdropPointerEvents = visible ? 'auto' : 'none';
    const backdropOpacity = visible ? 1 : 0;

    const handleEndRide = () => {
        logEvent({ message: 'button clicked', button: 'End Ride' });
        onEndRide();
    };

    const handleResume = () => {
        logEvent({ message: 'button clicked', button: 'Resume' });
        onClose();
    };

    return (
        <View 
            style={StyleSheet.absoluteFill} 
            pointerEvents={visible || isAnimating ? 'box-none' : 'none'}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View 
                    style={[styles.backdrop, { opacity: backdropOpacity }]} 
                    pointerEvents={backdropPointerEvents} 
                />
            </TouchableWithoutFeedback>

            {/* Side Panel */}
            <Animated.View
                onLayout={onLayout}
                style={[
                    styles.panel,
                    { width: panelWidth, transform: [{ translateY: animTranslateY }] },
                    isCompact ? styles.panelCompact : styles.panelTablet,
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MENU</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {renderMenuItem('settings', 'Settings', onSettings)}
                    {renderMenuItem('controller', 'Customize interface', onCustomize)}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        onPress={handleEndRide} 
                        style={[styles.actionButton, styles.endRideButton]}
                    >
                        <Text style={styles.actionButtonText}>End Ride</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.buttonGap} />

                    <TouchableOpacity 
                        onPress={handleResume} 
                        style={[styles.actionButton, styles.resumeButton]}
                    >
                        <Text style={styles.actionButtonText}>Resume</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panel: {
        position: 'absolute',
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        zIndex: 1000,
        paddingBottom: 20,
    },
    panelTablet: {
        bottom: 0,
    },
    panelCompact: {
        top: 0,
        bottom: 0,
    },    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: colors.text,
        fontSize: 20,
        lineHeight: 24,
    },
    content: {
        flex: 1,
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        minHeight: 52,
    },
    menuItemPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    menuItemDisabled: {
        opacity: 1,
    },
    menuItemIcon: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    menuItemLabelDisabled: {
        color: 'rgba(255,255,255,0.35)',
    },
    footer: {
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    actionButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        marginHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    endRideButton: {
        backgroundColor: colors.error,
    },
    resumeButton: {
        backgroundColor: colors.buttonPrimary,
    },
    buttonGap: {
        height: 8,
    },
});
