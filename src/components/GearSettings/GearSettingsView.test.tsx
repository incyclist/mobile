import React from 'react';
import { render } from '@testing-library/react-native';
import { GearSettingsView } from './GearSettingsView';
import { GearSettingsViewProps } from './types';
import { CyclingModeProperyType, CyclingModeProperty } from 'incyclist-services';
import type { ICyclingMode } from 'incyclist-services';

// Mock ICyclingMode helper
const createMockICyclingMode = (name: string, properties: CyclingModeProperty[]): ICyclingMode =>
    ({
        getName: () => name,
        getDescription: () => '',
        getProperties: () => properties,
    } as unknown as ICyclingMode);

describe('GearSettingsView', () => {
    const mockMode = createMockICyclingMode('ERG', [
        {
            key: 'power',
            name: 'Power',
            description: '',
            type: CyclingModeProperyType.Integer,
            min: 0,
            max: 400,
            default: 150,
        },
        {
            key: 'cadence',
            name: 'Cadence',
            description: '',
            type: CyclingModeProperyType.Integer,
            min: 40,
            max: 120,
            default: 90,
        },
    ]);

    const MOCK_PROPS: GearSettingsViewProps = {
        mode: 'ERG',
        options: [mockMode],
        settings: { power: 200, cadence: 90 },
        properties: mockMode.getProperties(),
        onClose: jest.fn(),
        onChangeMode: jest.fn(),
        onChangeSetting: jest.fn(),
    };

    it('renders with single mode and its properties', () => {
        const { getByText, getByDisplayValue } = render(<GearSettingsView {...MOCK_PROPS} />);
        expect(getByText('Bike Preferences')).toBeTruthy();
        expect(getByText('Power')).toBeTruthy();
        expect(getByText('Cadence')).toBeTruthy();
        expect(getByDisplayValue('200')).toBeTruthy();
    });

    it('renders null-safe when options is empty', () => {
        const props = { ...MOCK_PROPS, options: [], properties: [] };
        const { queryByText } = render(<GearSettingsView {...props} />);
        expect(queryByText('Power')).toBeNull();
    });

    it('hides conditional property when condition returns false', () => {
        const conditionalMode = createMockICyclingMode('Conditional', [
            { key: 'show', name: 'Show it', description: '', type: CyclingModeProperyType.Boolean, default: false },
            {
                key: 'secret',
                name: 'Secret',
                description: '',
                type: CyclingModeProperyType.String,
                condition: (s: any) => s.show === true,
            },
        ]);

        const props: GearSettingsViewProps = {
            ...MOCK_PROPS,
            mode: 'Conditional',
            options: [conditionalMode],
            settings: { show: false },
            properties: conditionalMode.getProperties(),
        };

        const { queryByText } = render(<GearSettingsView {...props} />);
        expect(queryByText('Secret')).toBeNull();
    });
});