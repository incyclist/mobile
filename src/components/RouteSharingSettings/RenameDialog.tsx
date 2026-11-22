import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { Dialog } from '../Dialog';
import { MAX_NAME_LENGTH } from './utils';

interface RenameDialogProps {
    name: string;
    onCancel: () => void;
    onSave: (name: string) => void;
}

/** State M-R: the name this device shows for a computer. An empty name resets to the computer's own. */
export const RenameDialog = ({ name, onCancel, onSave }: RenameDialogProps) => {
    const [value, setValue] = useState(name);

    const handleSave = useCallback(() => onSave(value.trim()), [onSave, value]);

    const buttons = useMemo(() => [
        { label: 'Cancel', onClick: onCancel },
        { label: 'Save', onClick: handleSave, primary: true },
    ], [onCancel, handleSave]);

    return (
        <Dialog title={`Rename ${name}`} variant="info" nested visible={true} onOutsideClick={onCancel} buttons={buttons}>
            <View style={styles.container}>
                <Text style={styles.label}>Name on this device</Text>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    maxLength={MAX_NAME_LENGTH}
                    autoFocus={true}
                    placeholderTextColor={colors.disabled}
                    accessibilityLabel="Name on this device"
                />
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    input: {
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        marginTop: 4,
    },
});
