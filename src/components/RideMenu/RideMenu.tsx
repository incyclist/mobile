import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { Button } from '../ButtonBar';
import { getRidePageService } from 'incyclist-services';
import { GearSettings } from '../GearSettings';
import { SettingsPlaceholder } from '../SettingsPlaceholder';
import { ActivitySummaryDialog } from '../ActivitySummaryDialog';

type ActiveDialog = 'gearSettings' | 'rideSettings' | 'activitySummary' | null;

export const RideMenu = ({ visible, onClose }: RideMenuProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const { logEvent } = useLogging('RideMenu');

    const service = getRidePageService();

    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
    const showResume = (service.getPageDisplayProps() as any)?.menuProps?.showResume ?? false;

    const panelWidth = isCompact ? screenWidth * 0.35 : Math.min(300, screenWidth * 0.35);

    const refPanelHeight = useRef<number>(screenHeight); // Initialize with screenHeight (off-screen)
    const animTranslateY = useRef(new Animated.Value(screenHeight)).current;

    const [isAnimating, setIsAnimating] = useState(false);
    const [isFullyClosed, setIsFullyClosed] = useState(!visible); // Only for panel

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        refPanelHeight.current = event.nativeEvent.layout.height;
    }, []);

    const handleCloseMenu = useCallback(() => {
        if (activeDialog !== null) {
            setActiveDialog(null); // Close active dialog first if any
        } else {
            onClose(); // Only close menu if no dialog is active
        }
    }, [activeDialog, onClose]);

    const panelHiddenByDialog = activeDialog !== null;

    useEffect(() => {
        if (panelHiddenByDialog) {
            // If a dialog is active, instantly hide the panel and stop any ongoing animation
            animTranslateY.setValue(refPanelHeight.current);
            setIsFullyClosed(true);
            setIsAnimating(false);
            return;
        }

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
    }, [visible, animTranslateY, panelHiddenByDialog, refPanelHeight]);

    const handleEndRide = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'End Ride' });
        service.onPause();
        setActiveDialog('activitySummary');
    }, [service, logEvent]);

    const handleExitFromSummary = useCallback(() => {
        setActiveDialog(null);
        // Delay calling service.onEndRide to allow dialog to animate out
        setTimeout(() => service.onEndRide(), 0);
    }, [service]);

    const handleGearSettings = useCallback(() => {
        setActiveDialog('gearSettings');
    }, []);

    const handleRideSettings = useCallback(() => {
        setActiveDialog('rideSettings');
    }, []);

    const handlePauseResume = useCallback(() => {
        if (showResume) {
            logEvent({ message: 'button clicked', button: 'Resume' });
            service.onResume();
        } else {
            logEvent({ message: 'button clicked', button: 'Pause' });
            service.onPause();
        }
        onClose(); // Close menu after action
    }, [showResume, service, logEvent, onClose]);

    const renderMenuItem = (
        iconName: any,
        label: string,
        onPress: () => void
    ) => {
        const handlePress = () => {
            logEvent({ message: 'button clicked', button: label });
            onPress();
        };

        return (
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                ]}
            >
                <View style={styles.menuItemIcon}>
                    <Icon
                        name={iconName}
                        size={24}
                        color={colors.text}
                    />
                </View>
                <Text style={styles.menuItemLabel}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    const panelIsVisuallyActive = visible && !panelHiddenByDialog;

    const rootContainerPointerEvents = (visible || activeDialog !== null) ? 'box-none' : 'none';

    const backdropOpacity = panelIsVisuallyActive ? 1 : 0;
    const backdropPointerEvents = panelIsVisuallyActive ? 'auto' : 'none';

    const panelOpacity = panelIsVisuallyActive ? 1 : 0;
    const panelPointerEvents = panelIsVisuallyActive ? 'box-none' : 'none';

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents={rootContainerPointerEvents}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback
                onPress={handleCloseMenu}
                disabled={!backdropPointerEvents}
            >
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
                    { opacity: panelOpacity, pointerEvents: panelPointerEvents }
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MENU</Text>
                    <TouchableOpacity onPress={handleCloseMenu} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {renderMenuItem('settings', 'Gear Settings', handleGearSettings)}
                    {renderMenuItem('controller', 'Ride Settings', handleRideSettings)}
                </View>

                <View style={styles.footer}>
                    <Button label={showResume ? 'Resume' : 'Pause'} primary onClick={handlePauseResume} />
                    <View style={styles.buttonGap} />
                    <Button label='End Ride' attention onClick={handleEndRide} />
                </View>
            </Animated.View>

            {/* Dialogs rendered on top */}
            {activeDialog === 'gearSettings' && (
                <GearSettings onClose={() => setActiveDialog(null)} />
            )}
            {activeDialog === 'rideSettings' && (
                <SettingsPlaceholder onClose={() => setActiveDialog(null)} />
            )}
            {activeDialog === 'activitySummary' && (
                <ActivitySummaryDialog onClose={() => setActiveDialog(null)} onExit={handleExitFromSummary} />
            )}
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
    menuItemIcon: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    footer: {
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    buttonGap: {
        height: 8,
    },
});