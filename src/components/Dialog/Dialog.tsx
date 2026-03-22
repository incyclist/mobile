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
    Animated, // Import Animated
    useWindowDimensions, // Import useWindowDimensions
} from 'react-native';
import { ButtonBar } from '../ButtonBar';
import { colors, textSizes } from '../../theme';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';
import { EventLogger } from 'gd-eventlog';
import { MainBackground } from '../MainBackground';

export const Dialog = ({
    title,
    titleStyle,
    style,
    width, height, minWidth, minHeight, variant,
    buttons,
    children,
    visible = true,
    onOutsideClick,
    slideFrom, // Add slideFrom prop
}: PropsWithChildren<DialogProps>) => {

    const { logEvent } = useLogging('Incyclist');
    const refInitialized = useRef<boolean>(false);
    const layout = useScreenLayout();
    const { width: screenWidth } = useWindowDimensions(); // Get screen width

    // Internal state for Modal visibility and animation for 'full' variant
    const [isModalActive, setIsModalActive] = useState(false); // Controls actual Modal `visible`
    const [isAnimating, setIsAnimating] = useState(false); // Controls if animation is running

    // Determine slide direction and initial Animated.Value
    const defaultSlideFrom = 'left';
    const actualSlideFrom = variant === 'full' ? (slideFrom || defaultSlideFrom) : undefined;
    const initialTranslateX = actualSlideFrom === 'left' ? -screenWidth : 0; // If not full, translateX isn't used. If full and left, start off screen left.
    const animTranslateX = useRef(new Animated.Value(initialTranslateX)).current;

    // Effect to manage modal visibility and animation
    useEffect(() => {
        if (variant !== 'full') {
            // For info/details variants, just use the external 'visible' prop directly
            // Sync internal state for non-full variants
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

        // --- Logic for 'full' variant ---
        if (visible && !isModalActive) {
            // OPENING 'full' dialog
            setIsModalActive(true); // Show the Modal immediately

            // Start animation from off-screen
            animTranslateX.setValue(actualSlideFrom === 'left' ? -screenWidth : screenWidth); // Re-initialize position before animation
            setIsAnimating(true);
            Animated.timing(animTranslateX, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                if (!refInitialized.current) { // Ensure logging happens only once on mount
                    refInitialized.current = true;
                    logEvent({ message: 'dialog shown', dialog: title });
                    EventLogger.setGlobalConfig('dialog', title);
                }
            });
        } else if (!visible && isModalActive) {
            // CLOSING 'full' dialog
            setIsAnimating(true);
            Animated.timing(animTranslateX, {
                toValue: actualSlideFrom === 'left' ? -screenWidth : screenWidth, // Animate back off-screen
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                setIsModalActive(false); // Hide the Modal only after animation completes
                if (refInitialized.current) { // Ensure logging happens only once on unmount
                    refInitialized.current = false;
                    EventLogger.setGlobalConfig('dialog', null);
                    logEvent({ message: 'dialog closed', dialog: title });
                }
            });
        }
    }, [visible, isModalActive, animTranslateX, screenWidth, actualSlideFrom, variant, logEvent, title]);

    // useUnmountEffect to ensure logging on component unmount if it was active
    useUnmountEffect(() => {
        if (refInitialized.current) { // If dialog was visible before component unmounts
            refInitialized.current = false;
            EventLogger.setGlobalConfig('dialog', null);
            logEvent({ message: 'dialog closed', dialog: title });
        }
    });

    const styles = getStyles({ width, height, minWidth, minHeight, variant });

    const gradientColors = colors.dialogBackground;

    // Mock behavior for Web/Storybook Vite
    const BackgroundContainer = Platform.OS === 'web' ? View : LinearGradient;
    const backgroundStyle = Platform.OS === 'web'
        ? [styles.container, { backgroundColor: gradientColors[gradientColors.length - 1] }]
        : styles.container;

    const isCompact = layout === 'compact';
    const stripWidth = isCompact ? 70 : 150;
    const stripWidthStyle = { width: stripWidth };
    const stripColorStyle = { backgroundColor: 'rgba(0,0,0,0.2)' };

    // Don't render the Modal at all if it's not active and not animating for performance
    if (variant === 'full' && !isModalActive && !isAnimating) {
        return null;
    }

    if (variant === 'full') {
        return (
            <Modal
                transparent={true} // Changed from false
                visible={isModalActive} // Use internal state
                animationType="none" // Changed from slide
                onRequestClose={onOutsideClick} // External handler, should set visible=false
            >
                <Animated.View style={[
                    styles.fullScreenWrapper,
                    { transform: [{ translateX: animTranslateX }] } // Apply animation here
                ]}>
                    <View style={StyleSheet.absoluteFill}>
                        <MainBackground />
                    </View>
                    <View style={styles.fullLayout}>
                        <View style={[styles.strip, stripWidthStyle, stripColorStyle]}>
                            <TouchableOpacity onPress={onOutsideClick} style={styles.backButton}>
                                <Text style={styles.backIcon}>{'\u2039'}</Text>
                            </TouchableOpacity>
                        </View>
                        <BackgroundContainer
                            colors={gradientColors}
                            style={[backgroundStyle, styles.fullContentArea, style]}
                        >
                            <View style={styles.header}>
                                <Text style={[styles.title, titleStyle]}>{title}</Text>
                            </View>

                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.content}
                                bounces={false}
                            >
                                {children}
                            </ScrollView>

                            {buttons?.length ? (
                                <View style={styles.footer}>
                                    <ButtonBar buttons={buttons} />
                                </View>
                            ) : <></>}
                        </BackgroundContainer>
                    </View>
                </Animated.View>
            </Modal>
        );
    }

    // This part for 'info' and 'details' variants
    return (
        <Modal
            transparent
            visible={isModalActive} // Use internal state, which mirrors external 'visible' for these variants
            animationType="fade"
            onRequestClose={onOutsideClick}
        >
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

                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.content}
                                bounces={false}
                            >
                                {children}
                            </ScrollView>

                            {buttons?.length ? (
                                <View style={styles.footer}>
                                    <ButtonBar buttons={buttons} />
                                </View>
                            ) : <></>}

                        </BackgroundContainer>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

type StyleProps = {
    width: number | undefined,
    height: number | undefined,
    minWidth: DimensionValue | undefined,
    minHeight: DimensionValue | undefined,
    variant?: DialogVariant
}

const getStyles = ({ width, height, minWidth, minHeight, variant = 'details' }: StyleProps) => {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            minWidth: minWidth ?? (variant === 'details' ? '50%' : undefined),
            minHeight: minHeight ?? (variant === 'details' ? '80%' : undefined),
            width,
            height,
            maxHeight: variant === 'full' ? '100%' : '80%',
            borderRadius: variant === 'full' ? 0 : 8,
            overflow: 'hidden',
            color: colors.text
        },
        header: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.dialogBorder ?? '#ccc',
        },
        title: {
            fontSize: textSizes.dialogTitle,
            fontWeight: 'bold',
            color: colors.text,
        },
        scrollArea: {
            flexShrink: 1,
        },
        content: {
            flexGrow: variant === 'details' || variant === 'full' ? 1 : 0,
            padding: 2,
            color: colors.text,
        },
        footer: {
            borderTopWidth: 1,
            borderTopColor: colors.dialogBorder ?? '#ccc',
        },
        fullScreenWrapper: {
            flex: 1,
        },
        fullLayout: {
            flex: 1,
            flexDirection: 'row',
        },
        strip: {
            height: '100%',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 40 : 10,
        },
        backButton: {
            padding: 15,
        },
        backIcon: {
            color: colors.text,
            fontSize: 48,
            fontWeight: '300',
        },
        fullContentArea: {
            flex: 1,
            height: '100%',
            borderRadius: 0,
            maxHeight: '100%',
        },
    });
};