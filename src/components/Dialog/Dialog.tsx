import React, { PropsWithChildren, useEffect, useRef } from 'react';
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
    DimensionValue
} from 'react-native';
import { ButtonBar } from '../ButtonBar';
import { colors, textSizes } from '../../theme';
import { useLogging, useUnmountEffect } from '../../hooks';
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
            maxHeight: '80%',
            borderRadius: 8,
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
