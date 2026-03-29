import React, { useState, useCallback, useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { NavigationBarProps, TNavigationItem } from './types';
import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact';
import { UserSettings } from '../UserSettings';
import { SettingsSlideIn, SettingsSectionItem } from '../SettingsSlideIn';
import { SupportSettings } from '../SupportSettings';
import { SettingsPlaceholder } from '../SettingsPlaceholder';
import { GearSettings } from '../GearSettings';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

export const NavigationBar = (props: NavigationBarProps) => {
    const { selected, onClick, compact } = props;
    const { height } = useWindowDimensions();
    const screenLayout = useScreenLayout();
    const [showUserSettings, setShowUserSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [showGear, setShowGear] = useState(false);

    const verticalIconSize = compact ? 32 : Math.min(height / 16, 64);
    const verticalNavWidth = compact ? 70 : 150;
    const showExitForVertical = Platform.OS === 'android';

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
            case 'Gear':
                setShowGear(true);
                break;
            default:
                setShowPlaceholder(true);
                break;
        }
    }, []);

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
            {screenLayout === 'compact' ? (
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
            {showUserSettings && <UserSettings onClose={() => setShowUserSettings(false)} />}
            <SettingsSlideIn
                visible={showSettings}
                sections={sections}
                onClose={() => setShowSettings(false)}
                onSectionPress={handleSectionPress}
            />
            {showSupport && <SupportSettings onClose={() => setShowSupport(true)} />}
            {showPlaceholder && <SettingsPlaceholder onClose={() => setShowPlaceholder(true)} />}
            {showGear && <GearSettings onClose={() => setShowGear(true)} />}
        </>
    );
};