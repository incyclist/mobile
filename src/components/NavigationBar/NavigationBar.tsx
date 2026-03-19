import React, { useState } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { NavigationBarProps, TNavigationItem } from './types';
import { NavigationBarView } from './NavigationBarView';
import { UserSettingsDialog } from '../UserSettingsDialog';

export const NavigationBar = (props: NavigationBarProps) => {
    const { selected, onClick, compact } = props;
    const { height } = useWindowDimensions();
    const [showUserSettings, setShowUserSettings] = useState(false);

    const iconSize = compact ? 32 : Math.min(height / 16, 64);
    const navWidth = compact ? 70 : 150;
    const showExit = Platform.OS === 'android';

    const handleOnClick = (item: TNavigationItem) => {
        if (item === 'user') {
            setShowUserSettings(true);
        } else {
            onClick(item);
        }
    };

    return (
        <>
            <NavigationBarView
                selected={selected}
                onClick={handleOnClick}
                compact={compact}
                iconSize={iconSize}
                navWidth={navWidth}
                showExit={showExit}
            />
            {showUserSettings && (
                <UserSettingsDialog onClose={() => setShowUserSettings(false)} />
            )}
        </>
    );
};