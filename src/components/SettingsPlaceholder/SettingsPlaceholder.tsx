import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useLogging } from '../../hooks';
import { colors, textSizes } from '../../theme';
import { Dialog } from '../../components/Dialog';

interface SettingsPlaceholderProps {
    onClose: () => void;
}

export const SettingsPlaceholder = ({ onClose }: SettingsPlaceholderProps) => {
    const { logEvent } = useLogging('SettingsPlaceholder');

    const handleClose = () => {
        logEvent({ message: 'button clicked', button: 'back', eventSource: 'user' });
        onClose();
    };

    return (
        <Dialog
            title="Settings"
            variant="full"
            visible={true}
            onOutsideClick={handleClose}
        >
            <Text style={styles.message}>Not yet implemented</Text>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    message: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
        marginTop: 40,
    },
});