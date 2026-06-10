import React, { useEffect, useRef, useCallback } from 'react';
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
import { RideMenuViewProps } from './types';
import { colors, textSizes } from '../../theme';
import { useScreenLayout, useLogging } from '../../hooks';
import { Icon } from '../Icon';
import { Button } from '../ButtonBar';
import { GearSettings } from '../GearSettings';
import { RideSettings } from '../RideSettings';
import { ActivitySummaryDialog } from '../ActivitySummaryDialog';

export const RideMenuView = ({
    visible,
    showResume,
    activeDialog,
    onClose,
    onPause,
    onResume,
    onEndRide,
    onGearSettings,
    onRideSettings,
    onDialogClose,
    onExitFromSummary,

    renderGearSettings = () => <GearSettings onClose={onDialogClose} />,
    renderRideSettings = () => <RideSettings onClose={onDialogClose} />,
    renderActivitySummary = () => <ActivitySummaryDialog onClose={onDialogClose} onExit={onExitFromSummary} />,

}: RideMenuViewProps) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const { logEvent } = useLogging('RideMenu');

    const panelWidth = isCompact ? screenWidth * 0.35 : Math.min(300, screenWidth * 0.35);

    const refPanelHeight = useRef<number>(screenHeight);
    const animTranslateY = useRef(new Animated.Value(screenHeight)).current;

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        refPanelHeight.current = event.nativeEvent.layout.height;
    }, []);

    const panelHiddenByDialog = activeDialog !== null;

    useEffect(() => {
        if (panelHiddenByDialog) {
            animTranslateY.setValue(refPanelHeight.current);
            return;
        }

        const targetValue = visible ? 0 : refPanelHeight.current;

        Animated.timing(animTranslateY, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [visible, animTranslateY, panelHiddenByDialog, refPanelHeight]);

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

    const panelAnimatedOpacityAndPointerEvents = {
        opacity: panelOpacity,
        pointerEvents: panelPointerEvents as 'box-none' | 'none',
    };

    const panelDynamicLayout = {
        width: panelWidth,
        transform: [{ translateY: animTranslateY }],
    };

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents={rootContainerPointerEvents}
        >
            <TouchableWithoutFeedback
                onPress={onClose}
                disabled={!backdropPointerEvents}
            >
                <View
                    style={[styles.backdrop, { opacity: backdropOpacity }]}
                    pointerEvents={backdropPointerEvents}
                />
            </TouchableWithoutFeedback>

            <Animated.View
                onLayout={onLayout}
                style={[
                    styles.panel,
                    panelDynamicLayout,
                    isCompact ? styles.panelCompact : styles.panelTablet,
                    panelAnimatedOpacityAndPointerEvents
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MENU</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {renderMenuItem('settings', 'Gear Settings', onGearSettings)}
                    {renderMenuItem('controller', 'Ride Settings', onRideSettings)}
                </View>

                <View style={styles.footer}>
                    <Button label={showResume ? 'Resume' : 'Pause'} primary onClick={showResume ? onResume : onPause} />
                    <View style={styles.buttonGap} />
                    <Button label='End Ride' attention onClick={onEndRide} />
                </View>
            </Animated.View>

            {activeDialog === 'gearSettings' && renderGearSettings()}
            {activeDialog === 'rideSettings' && renderRideSettings()}
            {activeDialog === 'activitySummary' && renderActivitySummary()}
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