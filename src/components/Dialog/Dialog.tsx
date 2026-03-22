import React, { PropsWithChildren, useEffect, useRef, useCallback } from 'react';
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
    TouchableOpacity
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
    onOutsideClick 
}: PropsWithChildren<DialogProps>) => {

    const { logEvent } = useLogging('Incyclist');
    const refInitialized = useRef<boolean>(false);
    const layout = useScreenLayout();

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
        logEvent({ message: 'dialog shown', dialog: title });
        EventLogger.setGlobalConfig('dialog', title);
    }, [logEvent, title]);

    useUnmountEffect(() => {
        refInitialized.current = false;

        EventLogger.setGlobalConfig('dialog', null);
        logEvent({ message: 'dialog closed', dialog: title });
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

    if (variant === 'full') {
        return (
            <Modal
                transparent={false}
                visible={visible}
                animationType="slide"
                onRequestClose={onOutsideClick}
            >
                <View style={styles.fullScreenWrapper}>
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
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            transparent
            visible={visible}
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