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
    const screenLayout = useScreenLayout();
    const isCompact = screenLayout === 'compact';
    const stripWidth = isCompact ? 70 : 150;
    const currentVariant = variant ?? 'details';

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

    const styles = getStyles({ width, height, minWidth, minHeight, variant: currentVariant });
    
    const gradientColors = colors.dialogBackground;

    // Mock behavior for Web/Storybook Vite
    const BackgroundContainer = Platform.OS === 'web' ? View : LinearGradient;

    if (currentVariant === 'details') {
        const stripStyle = { width: stripWidth };
        const backgroundStyle = Platform.OS === 'web' 
            ? [styles.fullScreen, { backgroundColor: gradientColors[gradientColors.length - 1] }] 
            : styles.fullScreen;

        return (
            <Modal
                transparent={false}
                visible={visible}
                animationType="slide"
                onRequestClose={onOutsideClick}
            >
                <BackgroundContainer 
                    colors={gradientColors} 
                    style={[backgroundStyle, style]}
                >
                    <View style={styles.mainRow}>
                        <View style={[styles.strip, stripStyle]}>
                            <TouchableOpacity onPress={onOutsideClick} style={styles.backButton}>
                                <Text style={styles.backButtonText}>‹</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.contentArea}>
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
                        </View>
                    </View>
                </BackgroundContainer>
            </Modal>
        );
    }

    // Default info variant path (floating modal)
    const backgroundStyle = Platform.OS === 'web' 
        ? [styles.container, { backgroundColor: gradientColors[gradientColors.length - 1] }] 
        : styles.container;

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
            maxHeight: variant === 'details' ? '100%' : '80%',
            borderRadius: 8,
            overflow: 'hidden',
            color: colors.text
        },
        fullScreen: {
            flex: 1,
            overflow: 'hidden',
        },
        mainRow: {
            flex: 1,
            flexDirection: 'row',
        },
        strip: {
            alignItems: 'center',
            paddingTop: 8,
        },
        backButton: {
            padding: 8,
        },
        backButtonText: {
            fontSize: 40,
            color: colors.text,
            fontWeight: '300',
        },
        contentArea: {
            flex: 1,
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
            flexGrow: variant === 'details' ? 1 : 0,
            padding: 2,
            color: colors.text,
        },
        footer: {
            borderTopWidth: 1,
            borderTopColor: colors.dialogBorder ?? '#ccc',
        },
    });
};