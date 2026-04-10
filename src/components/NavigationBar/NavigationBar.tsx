import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { useAppsService } from 'incyclist-services';
import { NavigationBarProps, TNavigationItem } from './types';
import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact';
import { UserSettings } from '../UserSettings';
import { SettingsSlideIn, SettingsSectionItem } from '../SettingsSlideIn';
import { SupportSettings } from '../SupportSettings';
import { SettingsPlaceholder } from '../SettingsPlaceholder';
import { GearSettings } from '../GearSettings';
import { AppsSlideIn } from '../AppsSlideIn';
import { OAuthAppSettings } from '../OAuthAppSettings';
import { KomootSettings } from '../KomootSettings';
import { AppDisplayProps } from '../AppsSettings/types';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

export const NavigationBar = (props: NavigationBarProps) => {
    const { selected, onClick, compact } = props;
    const { height, width } = useWindowDimensions();
    const screenLayout = useScreenLayout();
    const appsService = useAppsService();

    const [showUserSettings, setShowUserSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [showGear, setShowGear] = useState(false);
    const [showApps, setShowApps] = useState(false);
    const [selectedAppKey, setSelectedAppKey] = useState<string | null>(null);
    const [apps, setApps] = useState<AppDisplayProps[]>([]);

    const refInitialized = useRef(false);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        const list = appsService.openSettings();
        if (list) {
            setApps(list);
            refInitialized.current = true;
        }
    }, [appsService]);

    const NAV_BAR_HEIGHT = 56;
    const isCompact = screenLayout === 'compact';
    const stripSize = isCompact ? NAV_BAR_HEIGHT : 150;
    const panelWidth = width * 0.35;
    const appsSlideInOffsetX = stripSize + panelWidth;

    const verticalIconSize = compact ? 32 : Math.min(height / 16, 64);
    const verticalNavWidth = compact ? 70 : 150;
    const showExitForVertical = Platform.OS === 'android';

    const handleOnClick = useCallback((item: TNavigationItem) => {
        if (item === 'user') {
            setShowUserSettings(true);
        } else if (item === 'settings') {
            setShowSettings(true);
        } else {
            onClick(item);
        }
    }, [onClick]);

    const handleSectionPress = useCallback((label: string) => {
        setShowApps(false);
        switch (label) {
            case 'Apps':
                setShowApps(true);
                break;
            case 'Support':
                setShowSettings(false);
                setShowSupport(true);
                break;
            case 'Gear':
                setShowSettings(false);
                setShowGear(true);
                break;
            default:
                setShowSettings(false);
                setShowPlaceholder(true);
                break;
        }
    }, []);

    const handleAppSelect = useCallback((key: string) => {
        setShowApps(false);
        setShowSettings(false);
        setSelectedAppKey(key);
    }, []);

    const handleUserSettingsClose = useCallback(() => setShowUserSettings(false), []);
    const handleSettingsClose = useCallback(() => setShowSettings(false), []);
    const handleSupportClose = useCallback(() => setShowSupport(false), []);
    const handlePlaceholderClose = useCallback(() => setShowPlaceholder(false), []);
    const handleGearClose = useCallback(() => setShowGear(false), []);
    const handleAppsClose = useCallback(() => setShowApps(false), []);
    const handleAppBack = useCallback(() => setSelectedAppKey(null), []);

    const sections: SettingsSectionItem[] = useMemo(
        () => [
            { label: 'Gear', onPress: () => handleSectionPress('Gear') },
            { label: 'Ride', onPress: () => handleSectionPress('Ride') },
            { label: 'Apps', onPress: () => handleSectionPress('Apps') },
            { label: 'Support', onPress: () => handleSectionPress('Support') },
        ],
        [handleSectionPress]
    );

    return (
        <>
            {isCompact ? (
                <NavigationBarViewCompact
                    selected={selected}
                    onClick={handleOnClick}
                    showExit={false}
                />
            ) : (
                <NavigationBarView
                    selected={selected}
                    onClick={handleOnClick}
                    compact={compact}
                    iconSize={verticalIconSize}
                    navWidth={verticalNavWidth}
                    showExit={showExitForVertical}
                />
            )}
            {showUserSettings && <UserSettings onClose={handleUserSettingsClose} />}
            <SettingsSlideIn
                visible={showSettings}
                sections={sections}
                onClose={handleSettingsClose}
                onSectionPress={handleSectionPress}
            />
            {showSupport && <SupportSettings onClose={handleSupportClose} />}
            {showPlaceholder && <SettingsPlaceholder onClose={handlePlaceholderClose} />}
            {showGear && <GearSettings onClose={handleGearClose} />}
            
            <AppsSlideIn
                visible={showApps}
                apps={apps}
                offsetX={appsSlideInOffsetX}
                onSelect={handleAppSelect}
                onClose={handleAppsClose}
            />

            {selectedAppKey === 'strava' && (
                <OAuthAppSettings appKey="strava" onBack={handleAppBack} />
            )}
            {selectedAppKey === 'intervals' && (
                <OAuthAppSettings appKey="intervals" onBack={handleAppBack} />
            )}
            {selectedAppKey === 'komoot' && (
                <KomootSettings onBack={handleAppBack} />
            )}
        </>
    );
};