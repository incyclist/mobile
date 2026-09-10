import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as SafeAreaContext from 'react-native-safe-area-context';
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

    // This panel is always mounted inside ListPageShell's own tree (via NavigationBar), which
    // already shifts everything clear of the notch/cutout via its own paddingLeft/paddingRight -
    // adding a second safe-area inset here doubled it. Row padding is the fixed baseline only.
    describe('safe-area insets', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('does not add its own safe-area inset on top of the baseline row padding', () => {
            jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, left: 30, right: 0, bottom: 0 });

            const { getByTestId } = render(
                <SettingsSlideIn
                    visible={true}
                    sections={MOCK_SECTIONS}
                    onClose={jest.fn()}
                    onSectionPress={jest.fn()}
                />
            );

            const row = getByTestId('section-Gear');
            const flat = StyleSheet.flatten(row.props.style);
            expect(flat.paddingHorizontal).toBe(20);
        });
    });
});