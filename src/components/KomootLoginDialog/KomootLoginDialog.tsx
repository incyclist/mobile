import React, { useState, useCallback } from 'react'
import { useAppsService } from 'incyclist-services'
import { useLogging } from '../../hooks'
import { KomootLoginDialogViewProps, KomootLoginDialogProps } from './types'
import { KomootLoginDialogView } from './KomootLoginDialogView'

export const KomootLoginDialog = ({ onSuccess, onCancel }: KomootLoginDialogProps) => {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [userid, setUserid] = useState<string>('')
    const [isConnecting, setIsConnecting] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

    const service = useAppsService()
    const { logEvent, logError } = useLogging('KomootLoginDialog')

    const handleConnect = useCallback(async () => {
        if (!service) return
        setIsConnecting(true)
        setErrorMessage(undefined)
        logEvent({ message: 'komoot login start', eventSource: 'user' })
        try {
            await service.connect('komoot', { username, password, userid })
            logEvent({ message: 'komoot login success' })
            onSuccess?.()
        } catch (err) {
            const error = err as Error
            logEvent({ message: 'komoot login failed', error })
            logError(error, 'handleConnect')
            setErrorMessage(error.message)
        } finally {
            setIsConnecting(false)
        }
    }, [service, username, password, userid, logEvent, logError, onSuccess])

    const handleCancel = useCallback(() => {
        onCancel?.()
    }, [onCancel])

    const viewProps: KomootLoginDialogViewProps = {
        username,
        password,
        userid,
        isConnecting,
        errorMessage,
        onUsernameChange: setUsername,
        onPasswordChange: setPassword,
        onUseridChange: setUserid,
        onConnect: handleConnect,
        onCancel: handleCancel,
    }

    return <KomootLoginDialogView {...viewProps} />
}