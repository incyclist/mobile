import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useAppsService } from 'incyclist-services';
import { NavigationBarProps, TNavigationItem } from './types';
import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact';
import { UserSettings } from '../UserSettings';
import { SettingsSlideIn, SettingsSectionItem } from '../SettingsSlideIn';
import { SupportSettings } from '../SupportSettings';
import { SettingsPlaceholder } from '../SettingsPlaceholder';
import { GearSettings } from '../GearSettings';
import { AppsDialog } from '../AppsDialog';
import { AppDisplayProps } from '../AppsSettings/types';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

export const NavigationBar = (props: NavigationBarProps) => {
    const { selected, onClick, compact } = props;
    const screenLayout = useScreenLayout();
    const { height } = useWindowDimensions();
    const appsService = useAppsService();

    const [showUserSettings, setShowUserSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [showGear, setShowGear] = useState(false);
    const [showAppsDialog, setShowAppsDialog] = useState(false);
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

    const isCompact = screenLayout === 'compact';
    const verticalNavWidth = compact ? 70 : 150;
    const verticalIconSize = compact ? 32 : Math.min(height / 16, 64);
    const showExitForVertical = Platform.OS === 'android';

    const handleOnClick = useCallback((item: TNavigationItem) => {
        if (item === 'user') {
            setShowUserSettings(true);
        } else if (item === 'settings') {
            setShowSettings(prev => {
                if (prev) {
                    setShowAppsDialog(false);
                }
                return !prev;
            });
        } else {
            onClick(item);
        }
    }, [onClick]);

    const handleSectionPress = useCallback((label: string) => {
        switch (label) {
            case 'Apps':
                setShowAppsDialog(true);
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

    const handleUserSettingsClose = useCallback(() => setShowUserSettings(false), []);
    
    const handleSettingsClose = useCallback(() => {
        setShowSettings(false);
        setShowAppsDialog(false);
    }, []);

    const handleSupportClose = useCallback(() => setShowSupport(false), []);
    const handlePlaceholderClose = useCallback(() => setShowPlaceholder(false), []);
    const handleGearClose = useCallback(() => setShowGear(false), []);

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
            
            <AppsDialog
                visible={showAppsDialog}
                apps={apps}
                onClose={handleSettingsClose}
            />
        </>
    );
};