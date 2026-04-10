import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Dialog } from '../Dialog'
import { EditText } from '../EditText'
import { PasswordEdit } from '../PasswordEdit'
import { colors, textSizes } from '../../theme'
import { KomootLoginDialogViewProps } from './types'
import { ButtonProps } from '../ButtonBar/types'

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
}: KomootLoginDialogViewProps) => {

    const buttons: Array<ButtonProps> = [
        {
            label: 'Cancel',
            onClick: onCancel ?? (() => {}),
        },
        {
            label: 'Connect',
            primary: true,
            onClick: onConnect ?? (() => {}),
        },
    ]

    return (
        <Dialog title="Komoot Login" variant="details" buttons={buttons}>
            <View style={styles.container}>
                <EditText
                    label="Email"
                    value={username ?? ''}
                    onValueChange={onUsernameChange}
                    disabled={isConnecting}
                />
                <PasswordEdit
                    label="Password"
                    value={password ?? ''}
                    onValueChange={onPasswordChange}
                    disabled={isConnecting}
                />
                <EditText
                    label="Account ID"
                    value={userid ?? ''}
                    onValueChange={onUseridChange}
                    disabled={isConnecting}
                />
                {!!errorMessage && (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                )}
            </View>
        </Dialog>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    errorText: {
        color: colors.error,
        fontSize: textSizes.normalText,
        marginTop: 8,
    },
})