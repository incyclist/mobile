import React, { useState, useCallback, useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { NavigationBarProps, TNavigationItem } from './types';
import { NavigationBarView } from './NavigationBarView';
import { UserSettingsDialog } from '../UserSettingsDialog';
import { SettingsSlideIn,SettingsSectionItem } from '../SettingsSlideIn';
import { SupportSettingsPage } from '../SupportSettings';
import { SettingsPlaceholder } from '../SettingsPlaceholder';

export const NavigationBar = (props: NavigationBarProps) => {
    const { selected, onClick, compact } = props;
    const { height } = useWindowDimensions();
    const [showUserSettings, setShowUserSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const iconSize = compact ? 32 : Math.min(height / 16, 64);
    const navWidth = compact ? 70 : 150;
    const showExit = Platform.OS === 'android';

    const handleOnClick = (item: TNavigationItem) => {
        if (item === 'user') {
            setShowUserSettings(true);
        } else if (item === 'settings') {
            setShowSettings(true);
        } else {
            onClick(item);
        }
    };

    const handleSectionPress = useCallback((label: string) => {
        setShowSettings(false);
        switch (label) {
            case 'Support':
                setShowSupport(true);
                break;
            default:
                setShowPlaceholder(true);
                break;
        }
    }, []);

    const sections: SettingsSectionItem[] = useMemo(() => [
        { label: 'Gear', onPress: () => handleSectionPress('Gear') },
        { label: 'Ride', onPress: () => handleSectionPress('Ride') },
        { label: 'Apps', onPress: () => handleSectionPress('Apps') },
        { label: 'Support', onPress: () => handleSectionPress('Support') },
    ], [handleSectionPress]);

    return (
        <>
            <NavigationBarView
                selected={selected}
                onClick={handleOnClick}
                compact={compact}
                iconSize={iconSize}
                navWidth={navWidth}
                showExit={showExit}
                // showBackOnly and onBack props are removed as the feature is no longer supported by NavigationBarView.
            />
            {showUserSettings && (
                <UserSettingsDialog onClose={() => setShowUserSettings(false)} />
            )}
            <SettingsSlideIn
                visible={showSettings}
                sections={sections}
                onClose={() => setShowSettings(false)}
                onSectionPress={handleSectionPress}
            />
            {showSupport && (
                <SupportSettingsPage onClose={() => setShowSupport(false)} />
            )}
            {showPlaceholder && (
                <SettingsPlaceholder onClose={() => setShowPlaceholder(false)} />
            )}
        </>
    );
};