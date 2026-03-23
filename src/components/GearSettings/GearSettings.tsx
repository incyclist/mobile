import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    useDeviceConfiguration,
    DeviceModeInfo,
    CyclingModeProperty,
    Settings,
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { GearSettingsProps } from './types';
import { GearSettingsView } from './GearSettingsView';

/**
 * GearSettings smart component
 * Owns the DeviceConfigurationService subscription and state.
 */
export const GearSettings = ({ onClose }: GearSettingsProps) => {
    const [modeInfo, setModeInfo] = useState<DeviceModeInfo | null>(null);
    const refInitialized = useRef(false);
    const { logEvent } = useLogging('GearSettings');
    const config = useDeviceConfiguration();

    const onModeChanged = useCallback(() => {
        const updated = config.getModeSettings();
        if (updated) {
            setModeInfo(updated);
        }
    }, [config]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;
        const info = config.getModeSettings();
        if (info) {
            setModeInfo(info);
        }
        config.on('mode-changed', onModeChanged);
    }, [config, onModeChanged]);

    useUnmountEffect(() => {
        config.off('mode-changed', onModeChanged);
        refInitialized.current = false;
    });

    const onChangeMode = useCallback(
        (mode: string) => {
            if (!modeInfo) {
                return;
            }
            logEvent({ message: 'cycling mode selected', mode, eventSource: 'user' });
            config.setMode(modeInfo.udid, mode);
        },
        [config, modeInfo, logEvent]
    );

    const onChangeSetting = useCallback(
        (property: string, value: any) => {
            if (!modeInfo) {
                return;
            }
            logEvent({
                message: 'cycling mode property changed',
                mode: modeInfo.mode,
                property,
                value,
                eventSource: 'user',
            });
            const updatedSettings = { ...(modeInfo.settings ?? {}), [property]: value };
            config.setModeSettings(modeInfo.udid, modeInfo.mode, updatedSettings);
        },
        [config, modeInfo, logEvent]
    );

    if (!modeInfo) {
        return null;
    }

    const selectedModeObj = modeInfo.options?.find((m) => m.getName() === modeInfo.mode);
    const properties = selectedModeObj?.getProperties() ?? [];

    return (
        <GearSettingsView
            mode={modeInfo.mode}
            options={modeInfo.options ?? []}
            settings={modeInfo.settings ?? {}}
            properties={properties}
            onClose={onClose}
            onChangeMode={onChangeMode}
            onChangeSetting={onChangeSetting}
        />
    );
};