import React from 'react';
import { render } from '@testing-library/react-native';
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
    formatTime: (t: number, includeSeconds: boolean) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.round(t % 60);
        if (includeSeconds) {
            return `${minutes}:${String(seconds).padStart(2, '0')}`;
        }
        return `${minutes}min`;
    },
    useUnitConverter: () => ({
        convert: (v: number, dimension: string, options?: any) => {
            if (dimension === 'distance') {
                return options?.to === 'mi' ? v * 0.621371 : v / 1000; // Assuming input is meters, converting to km/mi for test
            }
            if (dimension === 'elevation') {
                return options?.to === 'ft' ? v * 3.28084 : v; // Assuming input is meters, converting to m/ft for test
            }
            // For speed, power, cadence, if they are already in display units, 'convert' might just format.
            // Based on MOCK_ACTIVITY, speed is already km/h.
            return v; // Default: just return the value for testing
        },
        getUnit: (dimension: string) => {
            if (dimension === 'speed') return 'km/h';
            if (dimension === 'distance') return 'km';
            if (dimension === 'elevation') return 'm';
            if (dimension === 'power') return 'W';
            if (dimension === 'time') return '';
            return '';
        },
    }),
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
    distance: 25300, // in meters
    totalElevation: 320, // in meters
    fileName: 'test.json',
    tcxFileName: 'test.tcx',
    fitFileName: null,
    stats: {
        speed: { avg: 18.5, min: 0, max: 35 }, // already in km/h
        power: { avg: 180, min: 0, max: 400, weighted: 210 },
        hrm: { avg: 145, min: 90, max: 175 },
        cadence: { avg: 88, min: 0, max: 110 },
    },
    logs: [
        { lat: 51.0, lng: 6.0, distance: 0, elevation: 100, speed: 0, time: 0, cadence: 0, heartrate: 0, power: 0 },
        { lat: 51.1, lng: 6.1, distance: 100, elevation: 105, speed: 10, time: 10, cadence: 80, heartrate: 120, power: 150 },
    ],
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
    it('renders in normal layout', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} />);
    });
    it('renders in compact layout', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} compact={true} />);
    });
    it('renders with showSave=false', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} showSave={false} />);
    });
    it('renders with isSaving=true', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} isSaving={true} />);
    });
    it('renders with isSaved true', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} isSaved={true} compact={false} />);
    });
    it('renders with isSaved true compact', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} isSaved={true} compact={true} />);
    });
    it('renders delete confirmation', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} showDeleteConfirm={true} />);
    });
    it('renders with showMap=true', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} showMap={true} compact={false} />);
    });
});