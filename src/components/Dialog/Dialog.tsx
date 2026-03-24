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
import { ButtonBar } from '../ButtonBar';
import { colors, textSizes } from '../../theme';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';
import { EventLogger } from 'gd-eventlog';

export const Dialog = ({
    title,
    titleStyle,
    style,
    width, height, minWidth, minHeight, variant,
    buttons,
    children,
    visible = true,
    onOutsideClick,
    slideFrom,
}: PropsWithChildren<DialogProps>) => {

    const { logEvent } = useLogging('Incyclist');
    const refInitialized = useRef<boolean>(false);
    const layout = useScreenLayout();
    const { width: screenWidth } = useWindowDimensions();

    const [isModalActive, setIsModalActive] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const defaultSlideFrom = 'left';
    const actualSlideFrom = variant === 'full' ? (slideFrom || defaultSlideFrom) : undefined;
    const initialTranslateX = actualSlideFrom === 'left' ? -screenWidth : 0;
    const animTranslateX = useRef(new Animated.Value(initialTranslateX)).current;

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

            animTranslateX.setValue(actualSlideFrom === 'left' ? -screenWidth : screenWidth);
            setIsAnimating(true);
            Animated.timing(animTranslateX, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                if (!refInitialized.current) {
                    refInitialized.current = true;
                    logEvent({ message: 'dialog shown', dialog: title });
                    EventLogger.setGlobalConfig('dialog', title);
                }
            });
        } else if (!visible && isModalActive) {
            setIsAnimating(true);
            Animated.timing(animTranslateX, {
                toValue: actualSlideFrom === 'left' ? -screenWidth : screenWidth,
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
    }, [visible, isModalActive, animTranslateX, screenWidth, actualSlideFrom, variant, logEvent, title]);

    useUnmountEffect(() => {
        if (refInitialized.current) {
            refInitialized.current = false;
            EventLogger.setGlobalConfig('dialog', null);
            logEvent({ message: 'dialog closed', dialog: title });
        }
    });

    const styles = getStyles({ width, height, minWidth, minHeight, variant });

    const gradientColors = colors.dialogBackground;

    const BackgroundContainer = Platform.OS === 'web' ? View : LinearGradient;
    const backgroundStyle = Platform.OS === 'web'
        ? [styles.container, { backgroundColor: gradientColors[gradientColors.length - 1] }]
        : styles.container;

    const isCompact = layout === 'compact';
    const stripWidth = isCompact ? 70 : 150;
    const stripWidthStyle = { width: stripWidth };

    if (variant === 'full' && !isModalActive && !isAnimating) {
        return null;
    }

    if (variant === 'full') {
        return (
            <Modal
                transparent={true}
                visible={isModalActive}
                animationType="none"
                onRequestClose={onOutsideClick}
            >
                <Animated.View style={[
                    styles.fullScreenWrapper,
                    { transform: [{ translateX: animTranslateX }] },
                ]}>
                    <View style={styles.fullLayout}>
                        <TouchableOpacity
                            style={[styles.strip, stripWidthStyle]}
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

    return (
        <Modal
            transparent
            visible={isModalActive}
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
            color: colors.text,
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
            padding:8,
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
        },
        fullContentArea: {
            flex: 1,
            height: '100%',
            borderRadius: 0,
            maxHeight: '100%',
        },
    });
};