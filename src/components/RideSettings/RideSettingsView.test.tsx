import React from 'react';
import { render } from '@testing-library/react-native';
import { RideSettingsView } from './RideSettingsView';
import { RideSettingsViewProps } from './types';
import { TRideView } from 'incyclist-services';

const MOCK_PROPS: RideSettingsViewProps = {
    rideView: 'sv',
    rideViewOptions: new Map<TRideView, string>([
        ['sv', 'Street View'],
        ['map', 'Map'],
        ['sat', 'Satellite View'],
    ]),
    onClose: jest.fn(),
    onChangeRideView: jest.fn(),
};

describe('RideSettingsView', () => {
    it('renders without crashing', () => {
        render(<RideSettingsView {...MOCK_PROPS} />);
    });
});