import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsSlideIn } from './SettingsSlideIn';
import { SettingsSectionItem } from './types';

const MOCK_SECTIONS: SettingsSectionItem[] = [
    { label: 'Gear',    onPress: jest.fn() },
    { label: 'Ride',    onPress: jest.fn() },
    { label: 'Apps',    onPress: jest.fn() },
    { label: 'Support', onPress: jest.fn() },
];

describe('SettingsSlideIn', () => {
    it('renders null when visible=false and animation complete', () => {
        const { queryByTestId } = render(
            <SettingsSlideIn 
                visible={false} 
                sections={MOCK_SECTIONS} 
                onClose={jest.fn()} 
                onSectionPress={jest.fn()} 
            />
        );
        expect(queryByTestId('settings-slide-in')).toBeNull();
    });

    it('renders section rows when visible=true', () => {
        const { getByText } = render(
            <SettingsSlideIn 
                visible={true} 
                sections={MOCK_SECTIONS} 
                onClose={jest.fn()} 
                onSectionPress={jest.fn()} 
            />
        );
        
        expect(getByText('Gear')).toBeTruthy();
        expect(getByText('Ride')).toBeTruthy();
        expect(getByText('Apps')).toBeTruthy();
        expect(getByText('Support')).toBeTruthy();
    });

    it('tapping a section row calls onSectionPress with the correct label', () => {
        const onSectionPress = jest.fn();
        const { getByTestId } = render(
            <SettingsSlideIn 
                visible={true} 
                sections={MOCK_SECTIONS} 
                onClose={jest.fn()} 
                onSectionPress={onSectionPress} 
            />
        );

        fireEvent.press(getByTestId('section-Gear'));
        expect(onSectionPress).toHaveBeenCalledWith('Gear');
    });

    it('tapping the backdrop calls onClose', () => {
        const onClose = jest.fn();
        const { getByTestId } = render(
            <SettingsSlideIn 
                visible={true} 
                sections={MOCK_SECTIONS} 
                onClose={onClose} 
                onSectionPress={jest.fn()} 
            />
        );

        fireEvent.press(getByTestId('settings-backdrop'));
        expect(onClose).toHaveBeenCalled();
    });
});