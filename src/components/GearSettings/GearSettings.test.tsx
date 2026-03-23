import React from 'react';
import { render } from '@testing-library/react-native';
import { GearSettings } from './GearSettings';

jest.mock('incyclist-services', () => ({
    useDeviceConfiguration: () => ({
        getModeSettings: () => undefined,
        on: jest.fn(),
        off: jest.fn(),
    }),
    CyclingModeProperyType: {
        Integer: 'Integer',
        Float: 'Float',
        String: 'String',
        Boolean: 'Boolean',
        SingleSelect: 'SingleSelect',
        MultiSelect: 'MultiSelect',
    },
}));

// Mocking dependencies used by Dialog and other components
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'wide',
}));

describe('GearSettings', () => {
    it('renders empty state dialog when no device is paired', () => {
        const { getByText } = render(<GearSettings onClose={jest.fn()} />);
        expect(getByText('No device paired. Go to Devices to set up your bike.')).toBeTruthy();
    });
});