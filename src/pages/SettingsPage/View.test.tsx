import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsPageView } from './View';
import { SettingsSectionItem, SettingsPageViewProps } from './types';

const MOCK_SECTIONS: SettingsSectionItem[] = [
    { label: 'Gear', onPress: jest.fn() },
    { label: 'Ride', onPress: jest.fn() },
    { label: 'Apps', onPress: jest.fn() },
    { label: 'Support', onPress: jest.fn() },
];

const MOCK_PROPS: SettingsPageViewProps = {
    sections: MOCK_SECTIONS,
    onClose: jest.fn(),
};

describe('SettingsPageView', () => {
    it('renders all four section rows', () => {
        const { getByText } = render(<SettingsPageView {...MOCK_PROPS} />);
        expect(getByText('Gear')).toBeTruthy();
        expect(getByText('Ride')).toBeTruthy();
        expect(getByText('Apps')).toBeTruthy();
        expect(getByText('Support')).toBeTruthy();
    });

    it('renders close button', () => {
        const { getByText } = render(<SettingsPageView {...MOCK_PROPS} />);
        expect(getByText('✕')).toBeTruthy();
    });

    it('tapping a section row calls its onPress', () => {
        const { getByText } = render(<SettingsPageView {...MOCK_PROPS} />);
        fireEvent.press(getByText('Gear'));
        expect(MOCK_SECTIONS[0].onPress).toHaveBeenCalled();
    });

    it('tapping close calls onClose', () => {
        const { getByText } = render(<SettingsPageView {...MOCK_PROPS} />);
        fireEvent.press(getByText('✕'));
        expect(MOCK_PROPS.onClose).toHaveBeenCalled();
    });
});