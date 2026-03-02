import React, { FC } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../Icon';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';
import { RouteImportDialogViewProps } from './types';
import { Dialog } from '../Dialog';
import { ButtonProps } from '../ButtonBar/types';

export const RouteImportDialogView: FC<RouteImportDialogViewProps> = ({
    imports,
    phase,
    onSelectFile,
    onClose,
}) => {
    const { logEvent } = useLogging('RouteImportDialogView');

    const dismissable = phase !== 'importing';

    const dialogButtons: Array<ButtonProps> = [];
    if (phase === 'idle' || phase==='done' ) {
        dialogButtons.push({
            label: 'Close',
            primary: true,
            onClick: () => {
                onClose();
            },
        });
    }

    return (
        <Dialog
            title="Import Route"
            visible={true}
            onOutsideClick={dismissable ? onClose : undefined}
            buttons={dialogButtons.length > 0 ? dialogButtons : undefined}
        >
            <View style={styles.content}>
                {/* Import rows — one per item */}
                {imports.map(item => (
                    <View key={item.id} style={styles.importRow}>
                        <Text
                            style={styles.fileName}
                            numberOfLines={1}
                            ellipsizeMode="middle"
                        >
                            {item.fileName}
                        </Text>
                        <View style={styles.rowRight}>
                            {item.status === 'parsing' && (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.buttonPrimary}
                                />
                            )}
                            {item.status === 'success' && (
                                <Text style={styles.successIcon}>✓</Text>
                            )}
                            {item.status === 'error' && (
                                <>
                                    <Text style={styles.errorIcon}>✗</Text>
                                    <Text
                                        style={styles.errorInline}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {item.error}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                ))}

                {/* Select File button — shown when idle or when done with errors */}
                {(phase === 'idle' ||
                    (phase === 'done' && imports.some(i => i.status === 'error'))) && (
                        <TouchableOpacity
                            style={styles.selectFileButton}
                            onPress={() => {
                                logEvent({ message: 'button clicked',
                                    button: 'select-file', eventSource: 'user' });
                                onSelectFile();
                            }}
                        >
                            <Icon name="import-route" size={24} color={colors.buttonPrimary} />
                            <View>
                                <Text style={styles.selectFileLabel}>Select File</Text>
                                <Text style={styles.selectFileHint}>
                                    Tap to browse storage
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 16,
        gap: 16,
    },
    importRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingVertical: 4,
    },
    fileName: {
        color: colors.text,
        fontSize: textSizes.normalText,
        flex: 1,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        maxWidth: '50%',
    },
    successIcon: {
        color: 'green',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorIcon: {
        color: colors.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorInline: {
        color: colors.error,
        fontSize: 12,
        flexShrink: 1,
    },
    selectFileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 16,
    },
    selectFileLabel: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
    selectFileHint: {
        color: colors.disabled,
        fontSize: 12,
    },
});
