import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAppsService } from 'incyclist-services'
import { useLogging } from '../../hooks/logging'
import { OAuthAppSettings } from '../OAuthAppSettings'
import { KomootSettings } from '../KomootSettings'
import { AppsSettingsView } from './AppsSettingsView'
import type { AppDisplayProps, AppsSettingsProps } from './types'

export const AppsSettings = ({ onBack }: AppsSettingsProps) => {
    const [apps, setApps] = useState<AppDisplayProps[]>([])
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const refInitialized = useRef(false)
    const { logEvent, logError } = useLogging('AppsSettings')
    const service = useAppsService()

    useEffect(() => {
        if (refInitialized.current) return
        refInitialized.current = true

        try {
            const result = service?.openSettings()
            if (result) {
                setApps(result)
            }
            logEvent({ message: 'apps settings opened' })
        } catch (err) {
            logError(err, 'openSettings')
        }
    }, [service, logEvent, logError])

    const handleSelect = useCallback(
        (key: string) => {
            logEvent({ message: 'app selected', key, eventSource: 'user' })
            setSelectedKey(key)
        },
        [logEvent],
    )

    const handleBack = useCallback(() => {
        setSelectedKey(null)
        onBack?.()
    }, [onBack])

    const handleBackToList = useCallback(() => {
        setSelectedKey(null)
    }, [])

    if (selectedKey) {
        if (selectedKey === 'strava' || selectedKey === 'intervals') {
            return (
                <OAuthAppSettings
                    appKey={selectedKey as 'strava' | 'intervals'}
                    onBack={handleBackToList}
                />
            )
        }
        if (selectedKey === 'komoot') {
            return <KomootSettings onBack={handleBackToList} />
        }
        // velohero — placeholder until #175 is resolved
        if (selectedKey === 'velohero') {
            return null
        }
        // Unknown key — fall through to list
    }

    return (
        <AppsSettingsView
            apps={apps}
            onSelect={handleSelect}
        />
    )
}