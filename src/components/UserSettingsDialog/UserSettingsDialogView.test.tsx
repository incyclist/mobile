import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserSettingsDialogView } from './UserSettingsDialogView';
import { UserSettingsDisplayProps } from 'incyclist-services';

const MOCK_ON_CLOSE = jest.fn();

const MOCK_DISPLAY_PROPS: UserSettingsDisplayProps = {
    username: 'Guido Doumen',
    ftp: 224,
    weight: { value: 75.0, unit: 'kg' },
    units: 'Metric',
    unitsOptions: ['Metric', 'Imperial'],
    onChangeWeight: jest.fn(),
    onChangeFtp: jest.fn(),
    onChangeName: jest.fn(),
    onChangeUnits: jest.fn(),
};

describe('UserSettingsDialogView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with full display props (normal state)', () => {
        const { getByText, getByDisplayValue } = render(
            <UserSettingsDialogView
                displayProps={MOCK_DISPLAY_PROPS}
                onClose={MOCK_ON_CLOSE}
            />
        );

        expect(getByText('User Settings')).toBeTruthy();
        expect(getByDisplayValue('Guido Doumen')).toBeTruthy();
        expect(getByDisplayValue('224')).toBeTruthy();
        expect(getByDisplayValue('75.0')).toBeTruthy();
        expect(getByText('Metric')).toBeTruthy();
        expect(getByText('OK')).toBeTruthy();
    });

    it('renders with displayProps set to null (loading state) without crashing', () => {
        const { getByText, queryByDisplayValue } = render(
            <UserSettingsDialogView
                displayProps={null}
                onClose={MOCK_ON_CLOSE}
            />
        );

        expect(getByText('User Settings')).toBeTruthy();
        expect(queryByDisplayValue('Guido Doumen')).toBeNull();
        expect(getByText('OK')).toBeTruthy();
    });

    it('calls onClose when OK button is tapped', () => {
        const { getByText } = render(
            <UserSettingsDialogView
                displayProps={MOCK_DISPLAY_PROPS}
                onClose={MOCK_ON_CLOSE}
            />
        );

        fireEvent.press(getByText('OK'));
        expect(MOCK_ON_CLOSE).toHaveBeenCalledTimes(1);
    });
});