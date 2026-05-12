import React from 'react';
import { render } from '@testing-library/react-native';
import { StreetView } from './StreetView';

jest.mock('../../specs/StreetViewNativeComponent', () => 'StreetView');

it('renders without crashing', () => {
    render(
        <StreetView latitude={40.758} longitude={-73.9855} heading={0} />,
    );
});