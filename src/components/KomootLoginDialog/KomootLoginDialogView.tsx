import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Dialog } from '../Dialog';
import { EditText } from '../EditText';
import { PasswordEdit } from '../PasswordEdit';
import { colors, textSizes } from '../../theme';
import { KomootLoginDialogViewProps } from './types';
import { useScreenLayout } from '../../hooks';

export const KomootLoginDialogView = ({
    username,
    password,
    userid,
    isConnecting,
    errorMessage,
    onUsernameChange,
    onPasswordChange,
    onUseridChange,
    onConnect,
    onCancel,
    compact,
}: KomootLoginDialogViewProps) => {
    const layout = useScreenLayout();
    const isCompact = compact ?? layout === 'compact';

    const dialogButtons = useMemo(() => [
        {
            label: 'Cancel',
            onClick: onCancel || (() => {}),
            disabled: isConnecting,
        },
        {
            label: 'Connect',
            onClick: onConnect || (() => {}),
            primary: true,
            disabled: isConnecting,
        },
    ], [onCancel, onConnect, isConnecting]);

    return (
        <Dialog
            title="Komoot Login"
            variant="details"
            buttons={dialogButtons}
            onOutsideClick={onCancel}
        >
            <EditText
                label="Email"
                value={username}
                onValueChange={onUsernameChange}
                disabled={isConnecting}
            />
            <PasswordEdit
                label="Password"
                value={password}
                onValueChange={onPasswordChange}
                disabled={isConnecting}
            />
            <EditText
                label="Account ID"
                value={userid}
                onValueChange={onUseridChange}
                disabled={isConnecting}
            />
            {errorMessage && (
                <Text style={styles.errorText}>
                    {errorMessage}
                </Text>
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    errorText: {
        color: colors.error,
        fontSize: textSizes.normalText,
        marginTop: 8,
        textAlign: 'center',
    },
});