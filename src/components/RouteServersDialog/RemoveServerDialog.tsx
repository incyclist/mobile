import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RemoveServerDialogProps } from 'incyclist-services';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';

interface RemoveServerDialogViewProps {
    dialog: RemoveServerDialogProps;
    onSetRemoveRoutes: (remove: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

interface RadioProps {
    label: string;
    selected: boolean;
    value: boolean;
    onSelect: (value: boolean) => void;
}

const Radio = ({ label, selected, value, onSelect }: RadioProps) => {
    const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
    return (
        <TouchableOpacity
            style={styles.radio}
            onPress={handlePress}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
        >
            <View style={styles.radioOuter}>{selected && <View style={styles.radioInner} />}</View>
            <Text style={styles.radioLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

export const RemoveServerDialog = ({ dialog, onSetRemoveRoutes, onConfirm, onCancel }: RemoveServerDialogViewProps) => {
    const buttons = useMemo(
        () => [
            { id: 'cancel', label: 'Cancel', onClick: onCancel },
            { id: 'confirm', label: dialog.confirmLabel, onClick: onConfirm, attention: true },
        ],
        [dialog.confirmLabel, onCancel, onConfirm]
    );

    return (
        <Dialog title={dialog.title} variant="info" visible onOutsideClick={onCancel} buttons={buttons}>
            <View style={styles.content}>
                {!!dialog.text && <Text style={styles.text}>{dialog.text}</Text>}
                {!!dialog.keepLabel && (
                    <Radio label={dialog.keepLabel} selected={!dialog.removeRoutes} value={false} onSelect={onSetRemoveRoutes} />
                )}
                {!!dialog.removeRoutesLabel && (
                    <Radio
                        label={dialog.removeRoutesLabel}
                        selected={dialog.removeRoutes}
                        value
                        onSelect={onSetRemoveRoutes}
                    />
                )}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 12,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginBottom: 8,
    },
    radio: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.text,
    },
    radioLabel: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});
