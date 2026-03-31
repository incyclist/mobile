import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivitySummaryDialogView } from './ActivitySummaryDialogView';
import { ActivitySummaryDialogViewProps } from './types';
import { ActivityDetailsUI } from 'incyclist-services';

jest.mock('@maplibre/maplibre-react-native', () => ({
    MapView: 'MapView',
    Camera: 'Camera',
    ShapeSource: 'ShapeSource',
    LineLayer: 'LineLayer',
    setAccessToken: jest.fn(),
    default: { createFragment: jest.fn() },
}));

jest.mock('incyclist-services', () => ({
    useActivityRide: jest.fn(),
    formatTime: (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
    useUnitConverter: () => ({ convert: (v: number) => v }),
}));

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: jest.fn(() => 'normal'),
}));

jest.mock('../FreeMap', () => ({
    FreeMap: 'FreeMap',
}));

jest.mock('../ActivityGraph', () => ({
    ActivityGraph: 'ActivityGraph',
}));

const MOCK_ACTIVITY = {
    id: '1',
    title: 'Test Ride',
    startTime: '2026-03-31T10:00:00Z',
    time: 3600,
    distance: { value: 25.3, unit: 'km' },
    totalElevation: { value: 320, unit: 'm' },
    fileName: 'test.json',
    tcxFileName: 'test.tcx',
    fitFileName: null,
    stats: {
        speed: { avg: 18.5 },
        power: { avg: 180 },
        hrm: { avg: 145 },
        cadence: { avg: 88 },
    },
} as unknown as ActivityDetailsUI;

const MOCK_PROPS: ActivitySummaryDialogViewProps = {
    activity: MOCK_ACTIVITY,
    showMap: false,
    showSave: true,
    isSaving: false,
    isSaved: false,
    showDeleteConfirm: false,
    onSave: jest.fn(),
    onClose: jest.fn(),
    onDelete: jest.fn(),
    onDeleteConfirm: jest.fn(),
    onDeleteCancel: jest.fn(),
    onShareFile: jest.fn(),
    units: { speed: 'km/h', distance: 'km' },
};

describe('ActivitySummaryDialogView', () => {
    it('renders stats correctly', () => {
        const { getByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} />);
        expect(getByText('Test Ride')).toBeTruthy();
        expect(getByText('25.3')).toBeTruthy();
        expect(getByText('km')).toBeTruthy();
        expect(getByText('320')).toBeTruthy();
        expect(getByText('m')).toBeTruthy();
        expect(getByText('18.5')).toBeTruthy();
    });

    it('shows map when showMap is true in normal layout', () => {
        const { getByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} showMap={true} />);
        expect(getByText('FreeMap')).toBeTruthy();
    });

    it('hides map in compact layout', () => {
        const { useScreenLayout } = require('../../hooks');
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        const { queryByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} showMap={true} />);
        expect(queryByText('FreeMap')).toBeNull();
    });

    it('disables save button when isSaving', () => {
        const { getByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} isSaving={true} />);
        const closeBtn = getByText('Saving...');
        expect(closeBtn).toBeTruthy();
    });

    it('renders delete confirmation when showDeleteConfirm is true', () => {
        const { getByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} showDeleteConfirm={true} />);
        expect(getByText('Delete Ride')).toBeTruthy();
        expect(getByText('This will permanently delete this ride. Are you sure?')).toBeTruthy();
    });

    it('calls onShareFile when a chip is pressed', () => {
        const { getByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} />);
        fireEvent.press(getByText('JSON'));
        expect(MOCK_PROPS.onShareFile).toHaveBeenCalledWith('test.json');
    });

    it('does not render save button when showSave is false', () => {
        const { queryByText } = render(<ActivitySummaryDialogView {...MOCK_PROPS} showSave={false} />);
        expect(queryByText('Save')).toBeNull();
    });
});