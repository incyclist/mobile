import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideSettingsView } from './RideSettingsView';
import { RideSettingsViewProps } from './types';
import { TRideView, TRideViewOption } from 'incyclist-services';

const MOCK_PROPS: RideSettingsViewProps = {
    rideView: 'sv',
    rideViewOptions: new Map<TRideView, TRideViewOption>([
        ['sv', { label: 'Street View' }],
        ['map', { label: 'Map' }],
        ['sat', { label: 'Satellite View' }],
    ]),
    onClose: jest.fn(),
    onChangeRideView: jest.fn(),
};

describe('RideSettingsView', () => {
    it('renders without crashing', () => {
        render(<RideSettingsView {...MOCK_PROPS} />);
    });

    it('renders with 2-option map', () => {
        render(
            <RideSettingsView
                {...MOCK_PROPS}
                rideViewOptions={new Map<TRideView, TRideViewOption>([
                    ['sv', { label: 'Street View' }],
                    ['map', { label: 'Map' }],
                ])}
            />
        );
    });

    it('renders with non-default rideView selected', () => {
        render(<RideSettingsView {...MOCK_PROPS} rideView="map" />);
    });

    it('renders a disabled option with an explanatory message, greyed out', () => {
        const { getByText } = render(
            <RideSettingsView
                {...MOCK_PROPS}
                rideViewOptions={new Map<TRideView, TRideViewOption>([
                    ['sv', { label: 'Street View' }],
                    ['map', { label: 'Map' }],
                    [
                        'sat',
                        {
                            label: 'Satellite View',
                            disabled: true,
                            message: 'Install Google Play Services to use this view',
                        },
                    ],
                ])}
            />
        );
        expect(getByText('Satellite View')).toBeTruthy();
        expect(getByText('Install Google Play Services to use this view')).toBeTruthy();
    });

    it('does not render the entirely-absent (not-supported) option at all', () => {
        const { queryByText } = render(
            <RideSettingsView
                {...MOCK_PROPS}
                rideViewOptions={new Map<TRideView, TRideViewOption>([
                    ['sv', { label: 'Street View' }],
                    ['map', { label: 'Map' }],
                ])}
            />
        );
        expect(queryByText('Satellite View')).toBeNull();
    });

    it('tapping a disabled option does not trigger onChangeRideView', () => {
        const onChangeRideView = jest.fn();
        const { getByText } = render(
            <RideSettingsView
                {...MOCK_PROPS}
                onChangeRideView={onChangeRideView}
                rideViewOptions={new Map<TRideView, TRideViewOption>([
                    ['sv', { label: 'Street View' }],
                    ['map', { label: 'Map' }],
                    [
                        'sat',
                        {
                            label: 'Satellite View',
                            disabled: true,
                            message: 'Install Google Play Services to use this view',
                        },
                    ],
                ])}
            />
        );
        fireEvent.press(getByText('Satellite View'));
        expect(onChangeRideView).not.toHaveBeenCalled();
    });

    // Regression test: the old handleChange compared a raw label string against an
    // array of TRideViewOption objects (always -1) once rideViewOptions switched from
    // Map<TRideView, string> to Map<TRideView, TRideViewOption> - this proves selecting
    // an available option still resolves to the correct TRideView key.
    it('tapping an available option calls onChangeRideView with the correct key', () => {
        const onChangeRideView = jest.fn();
        const { getByText } = render(
            <RideSettingsView {...MOCK_PROPS} onChangeRideView={onChangeRideView} />
        );
        fireEvent.press(getByText('Map'));
        expect(onChangeRideView).toHaveBeenCalledWith('map');
    });
});
