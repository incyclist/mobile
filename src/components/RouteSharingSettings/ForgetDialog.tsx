import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { Dialog } from '../Dialog';

interface ForgetDialogProps {
    name: string;
    onCancel: () => void;
    onForget: () => void;
}

/** State M-F: confirmation before a computer is forgotten. */
export const ForgetDialog = ({ name, onCancel, onForget }: ForgetDialogProps) => {
    const buttons = useMemo(() => [
        { label: 'Cancel', onClick: onCancel },
        { label: 'Forget', onClick: onForget, attention: true },
    ], [onCancel, onForget]);

    return (
        <Dialog title={`Forget ${name}?`} variant="info" nested visible={true} onOutsideClick={onCancel} buttons={buttons}>
            <View style={styles.container}>
                <Text style={styles.text}>
                    Routes that are only on that computer will disappear from your list. Routes you downloaded stay on this device.
                </Text>
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});
