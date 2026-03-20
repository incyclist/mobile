import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useLogging } from '../../hooks';
import { SettingsPageView } from './View';
import { SettingsSectionItem } from './types';

export const SettingsPage = () => {
    const navigation = useNavigation();
    const { logEvent } = useLogging('SettingsPage');

    const handleClose = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'close', eventSource: 'user' });
        navigation.goBack();
    }, [navigation, logEvent]);

    const handleSectionPress = useCallback((label: string) => {
        logEvent({ message: 'menu item clicked', item: label, eventSource: 'user' });
        navigation.navigate('settingsPlaceholder' as never);
    }, [navigation, logEvent]);

    const sections: SettingsSectionItem[] = useMemo(() => [
        { label: 'Gear', onPress: () => handleSectionPress('Gear') },
        { label: 'Ride', onPress: () => handleSectionPress('Ride') },
        { label: 'Apps', onPress: () => handleSectionPress('Apps') },
        { label: 'Support', onPress: () => handleSectionPress('Support') },
    ], [handleSectionPress]);

    return (
        <SettingsPageView
            sections={sections}
            onClose={handleClose}
        />
    );
};