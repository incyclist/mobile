import React, { useCallback } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { useLogging } from '../../hooks';
import { UploadPillProps } from './types';

/**
 * UploadPill component
 *
 * Displays the upload sync status of an activity to a connected app.
 * Supports direct-tap actions for synchronizing or opening the activity URL.
 */
export const UploadPill = (props: UploadPillProps) => {
    const { 
        type, 
        text, 
        status, 
        url, 
        synchronizing = false, 
        onSynchronize, 
        onOpen 
    } = props;
    const { logEvent } = useLogging('UploadPill');

    const handlePress = useCallback(() => {
        if (synchronizing) {
            return;
        }

        if (status !== 'success') {
            logEvent({ message: 'synchronize tapped', type });
            onSynchronize?.();
        } else if (status === 'success' && url) {
            logEvent({ message: 'open tapped', type });
            onOpen?.();
        }
    }, [status, synchronizing, url, type, logEvent, onSynchronize, onOpen]);

    const backgroundColor = status === 'success' 
        ? colors.tileActive 
        : (status === 'failed' ? colors.error : colors.disabled);
    
    const textColor = (status === 'success' || status === 'failed') 
        ? colors.text 
        : colors.background;

    const dynamicContainerStyle = { backgroundColor };
    const dynamicTextStyle = { color: textColor };

    return (
        <TouchableOpacity
            style={[styles.container, dynamicContainerStyle, synchronizing && styles.syncing]}
            onPress={handlePress}
            disabled={synchronizing}
            activeOpacity={0.7}
        >
            <View style={styles.row}>
                <Text style={[styles.text, dynamicTextStyle]}>
                    {text ?? type}
                </Text>
                {synchronizing && (
                    <ActivityIndicator 
                        size="small" 
                        color={textColor} 
                        style={styles.spinner} 
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    syncing: {
        opacity: 0.5,
    },
    spinner: {
        marginLeft: 4,
    },
});