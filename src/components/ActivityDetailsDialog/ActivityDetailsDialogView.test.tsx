jest.mock('incyclist-services', () => ({
    formatTime: jest.fn((v: number) => `${Math.floor(v / 60)}min`),
    useUnitConverter: jest.fn(() => ({
        convert: jest.fn((v: number) => v),
        getUnit: jest.fn(() => 'km'),
    })),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';
import { ActivityDetailsDialogViewProps } from './types';

const MOCK_LOADING = {
    loading: true,
    showMap: false,
    activity: {} as any,
    uploads: [],
    canStart: false,
    units: {} as any,
    onClose: () => {},
    onRideAgain: () => {},
    onShareFile: () => {},
    onUpload: () => {},
    onOpenUpload: () => {},
} as any

describe('ActivityDetailsDialogView', () => {
    it('renders loading state without crashing', () => {
        const { getByTestId } = render(<ActivityDetailsDialogView {...MOCK_LOADING} />);
        expect(getByTestId).toBeDefined();
    });

    it('renders loaded state without crashing', () => {
        const props: ActivityDetailsDialogViewProps = {
            ...MOCK_LOADING,
            loading: false,
            activity: {
                title: 'Test Ride',
                startTime: new Date().toISOString(),
                distance: 10000,
                time: 3600,
                totalElevation: 500,
                logs: [],
                stats: {
                    speed: { avg: 25, min: 0, max: 40 },
                },
            } as any,
        };
        const { getByTestId } = render(<ActivityDetailsDialogView {...props} />);
        expect(getByTestId).toBeDefined();
    });
});