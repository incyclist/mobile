import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { DialogProps, DialogVariant } from './types';
import LinearGradient from 'react-native-linear-gradient';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    Platform,
    ScrollView,
    DimensionValue,
    TouchableOpacity,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ButtonBar } from '../ButtonBar';
import { colors, textSizes } from '../../theme';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';
import { EventLogger } from 'gd-eventlog';

// Conditional import - same pattern as DeviceEntry/RouteItemView/WorkoutItemView: a static
// import of react-native-gesture-handler crashes in Jest (no native RNGestureHandlerModule)
// and in Storybook/Vite. RN's Modal renders its subtree on a separate native surface, outside
// the app root's GestureHandlerRootView (see App.tsx), so any Swipeable/gesture-handler content
// rendered inside a Dialog needs its own nested root - falling back to a plain View keeps
// Dialog's own tests/Storybook usage working when the native module isn't available.
let GestureHandlerRootView: any = View;
try {
    if (Platform.OS !== 'web') {
        GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
    }
} catch {
    GestureHandlerRootView = View;
}

export const Dialog = ({
    title,
    titleStyle,
    style,
    width, height, minWidth, minHeight, variant,
    buttons,
    children,
    visible = true,
    nested = false,
    onOutsideClick,
    slideFrom,
    scrollable = true,
}: PropsWithChildren<DialogProps>) => {

    const { logEvent } = useLogging('Incyclist');
    const refInitialized = useRef<boolean>(false);
    const layout = useScreenLayout();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { top: safeAreaTop } = useSafeAreaInsets();

    const [isModalActive, setIsModalActive] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const isCompact = layout === 'compact';
    const NAV_BAR_HEIGHT = 56;
    const stripHeight = NAV_BAR_HEIGHT + safeAreaTop;

    const defaultSlideFrom = 'left';
    const actualSlideFrom = variant === 'full' ? (slideFrom || defaultSlideFrom) : undefined;
    
    // Animation constants
    const initialPos = isCompact 
        ? -screenHeight 
        : (actualSlideFrom === 'left' ? -screenWidth : screenWidth);
    
    const animPos = useRef(new Animated.Value(initialPos)).current;

    useEffect(() => {
        if (variant !== 'full') {
            setIsModalActive(visible);

            if (visible && !refInitialized.current) {
                refInitialized.current = true;
                logEvent({ message: 'dialog shown', dialog: title });
                EventLogger.setGlobalConfig('dialog', title);
            } else if (!visible && refInitialized.current) {
                refInitialized.current = false;
                EventLogger.setGlobalConfig('dialog', null);
                logEvent({ message: 'dialog closed', dialog: title });
            }
            return;
        }

        if (visible && !isModalActive) {
            setIsModalActive(true);
            animPos.setValue(initialPos);
            setIsAnimating(true);
            Animated.timing(animPos, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(true); // Should be false but matches logic to signal end of move
                setIsAnimating(false);
                if (!refInitialized.current) {
                    refInitialized.current = true;
                    logEvent({ message: 'dialog shown', dialog: title });
                    EventLogger.setGlobalConfig('dialog', title);
                }
            });
        } else if (!visible && isModalActive) {
            setIsAnimating(true);
            Animated.timing(animPos, {
                toValue: initialPos,
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                setIsModalActive(false);
                if (refInitialized.current) {
                    refInitialized.current = false;
                    EventLogger.setGlobalConfig('dialog', null);
                    logEvent({ message: 'dialog closed', dialog: title });
                }
            });
        }
    }, [visible, isModalActive, animPos, initialPos, variant, logEvent, title]);

    useUnmountEffect(() => {
        if (refInitialized.current) {
            refInitialized.current = false;
            EventLogger.setGlobalConfig('dialog', null);
            logEvent({ message: 'dialog closed', dialog: title });
        }
    });

    const styles = getStyles({ width, height, minWidth, minHeight, variant, isCompact, stripHeight,nested });

    const gradientColors = colors.dialogBackground;

    const BackgroundContainer = Platform.OS === 'web' ? View : LinearGradient;
    const backgroundStyle = Platform.OS === 'web'
        ? [styles.container, { backgroundColor: gradientColors[gradientColors.length - 1] }]
        : styles.container;

    if (variant === 'full' && !isModalActive && !isAnimating) {
        return null;
    }

    if (variant === 'full') {
        const dynamicTransform = isCompact 
            ? { translateY: animPos } 
            : { translateX: animPos };

        return (
            <Modal
                transparent={true}
                visible={isModalActive}
                supportedOrientations={['landscape']} 
                animationType="none"
                presentationStyle="overFullScreen"                              
                onRequestClose={onOutsideClick}
            >
                <GestureHandlerRootView style={styles.fullScreenWrapper}>
                    <Animated.View style={[
                        styles.fullScreenWrapper,
                        { transform: [dynamicTransform] },
                    ]}>
                        <View style={styles.fullLayout}>
                            <TouchableOpacity
                                style={styles.strip}
                                onPress={onOutsideClick}
                                activeOpacity={1}
                            />
                            <BackgroundContainer
                                colors={gradientColors}
                                style={[backgroundStyle, styles.fullContentArea, style]}
                            >
                                <View style={styles.header}>
                                    <Text style={[styles.title, titleStyle]}>{title}</Text>
                                </View>

                                {scrollable ? (
                                    <ScrollView
                                        style={styles.scrollArea}
                                        contentContainerStyle={styles.content}
                                        bounces={false}
                                    >
                                        {children}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.scrollArea}>
                                        <View style={styles.content}>
                                            {children}
                                        </View>
                                    </View>
                                )}

                                {buttons?.length ? (
                                    <View style={styles.footer}>
                                        <ButtonBar buttons={buttons} />
                                    </View>
                                ) : <></>}
                            </BackgroundContainer>
                        </View>
                    </Animated.View>
                </GestureHandlerRootView>
            </Modal>
        );
    }

    return (
        <Modal
            transparent
            visible={isModalActive}
            animationType="fade"
            onRequestClose={onOutsideClick}
            presentationStyle="overFullScreen"              
            supportedOrientations={['landscape']}
        >
            <GestureHandlerRootView style={styles.fullScreenWrapper}>
                <TouchableWithoutFeedback onPress={onOutsideClick}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <BackgroundContainer
                                colors={gradientColors}
                                style={[backgroundStyle, style]}
                            >
                                <View style={styles.header}>
                                    <Text style={[styles.title, titleStyle]}>{title}</Text>
                                </View>

                                {scrollable ? (
                                    <ScrollView
                                        style={styles.scrollArea}
                                        contentContainerStyle={styles.content}
                                        bounces={false}
                                    >
                                        {children}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.scrollArea}>
                                        <View style={styles.content}>
                                            {children}
                                        </View>
                                    </View>
                                )}

                                {buttons?.length ? (
                                    <View style={styles.footer}>
                                        <ButtonBar buttons={buttons} />
                                    </View>
                                ) : <></>}

                            </BackgroundContainer>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </GestureHandlerRootView>
        </Modal>
    );
};

type StyleProps = {
    width: number | undefined,
    height: number | undefined,
    minWidth: DimensionValue | undefined,
    minHeight: DimensionValue | undefined,
    variant?: DialogVariant,
    nested?: boolean
}

const getStyles = ({ width, height, minWidth, minHeight, variant = 'details', isCompact, nested=false }: StyleProps & { isCompact: boolean, stripHeight: number }) => {
    const isInfoVariant = variant === 'info';
    
    return StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent', // No dimming - keep screen fully visible
        },
        container: {
            minWidth: minWidth ?? (variant === 'details' ? '50%' : undefined),
            minHeight: minHeight ?? (variant === 'details' ? '80%' : 180),
            width,
            height,
            maxHeight: variant === 'full' ? '100%' : '80%',
            borderRadius: variant === 'full' ? 0 : 12,
            overflow: 'hidden',
            color: colors.text,
            // Shadow and thin white frame for info variant only
            ...( (isInfoVariant||nested) && {
                borderWidth: 1,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 8 },
                shadowOpacity: 0.75,
                shadowRadius: 16,
                elevation: 24,
            }),
        },
        header: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.dialogBorder ?? 'rgba(255,255,255,0.1)',
        },
        title: {
            fontSize: textSizes.dialogTitle,
            fontWeight: 'bold',
            color: colors.text,
        },
        scrollArea: {
            flexShrink: 1,
            flexGrow: variant === 'info' ? 0 : 1,
            padding: 8,
            overflow: 'hidden',
        },
        content: {
            flexGrow: variant === 'details' || variant === 'full' ? 1 : 0,
            // flexShrink/minHeight: 0 - unlike CSS, Yoga (RN's layout engine) defaults flexShrink
            // to 0, so without this `content` refuses to shrink below its natural content height
            // when scrollable=false wraps it in a plain View instead of a ScrollView. Without it,
            // a child taller than the available space (e.g. RouteDetailsView's compact form)
            // silently overflows past `scrollArea`'s clamped box and paints over any sibling
            // rendered after it (footer), since neither view clips by default.
            flexShrink: 1,
            minHeight: 0,
            padding: 2,
            color: colors.text,
        },
        footer: {
            borderTopWidth: 1,
            borderTopColor: colors.dialogBorder ?? 'rgba(255,255,255,0.1)',
        },
        fullScreenWrapper: {
            flex: 1,
        },
        fullLayout: {
            flex: 1,
            flexDirection: isCompact ? 'column' : 'row',
        },
        strip: {
            height: isCompact ? 0 : '100%',
            width: isCompact ? '100%' : 0,
        },
        fullContentArea: {
            flex: 1,
            height: isCompact ? undefined : '100%',
            borderRadius: 0,
            maxHeight: '100%',
        },
    });
};