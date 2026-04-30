import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { Icon } from '../../Icon';
import { ButtonBar } from '../../ButtonBar/ButtonBar';

interface ResultViewProps {
    compact: boolean;
    success: boolean;
    routeName?: string;
    error?: string;
    onDone: () => void;
    onTryAgain: () => void;
    onCancel: () => void;
}

export const ResultView = ({ 
    compact, 
    success, 
    routeName, 
    error, 
    onDone, 
    onTryAgain, 
    onCancel 
}: ResultViewProps) => {
    const buttons = useMemo(() => {
        if (success) {
            return [
                { label: 'Done', primary: true, onClick: onDone }
            ];
        }
        return [
            { label: 'Try Again', primary: true, onClick: onTryAgain },
            { label: 'Cancel', onClick: onCancel }
        ];
    }, [success, onDone, onTryAgain, onCancel]);

    const statusColor = success ? colors.success : colors.error;
    const title = success ? 'Import Successful' : 'Import Failed';
    
    let message: string;
    if (success) {
        message = routeName
            ? `Route "${routeName}" has been added.`
            : 'The route has been added to your library.';
    } else {
        message = error || 'An unexpected error occurred during import.';
    }

    const iconCircleStyle = { borderColor: statusColor };

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            <View style={styles.content}>
                <View style={[styles.iconCircle, iconCircleStyle]}>
                    <Icon 
                        name={success ? 'import-route' : 'funnel'} 
                        size={compact ? 40 : 64} 
                        color={statusColor} 
                    />
                </View>
                <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
                <Text style={[styles.message, compact && styles.messageCompact]}>{message}</Text>
            </View>
            <ButtonBar buttons={buttons} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerCompact: {
        padding: 10,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 8,
    },
    message: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    messageCompact: {
        fontSize: textSizes.smallText,
        paddingHorizontal: 10,
    },
});