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
        speed: { avg: 18.5, min: 0, max: 35 },
        power: { avg: 180, min: 0, max: 400 },
        hrm: { avg: 145, min: 90, max: 175 },
        cadence: { avg: 88, min: 0, max: 110 },
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
    it('renders with isSaved=true', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} isSaved={true} />);
    });
    it('renders delete confirmation', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} showDeleteConfirm={true} />);
    });
    it('renders with showMap=true', () => {
        render(<ActivitySummaryDialogView {...MOCK_PROPS} showMap={true} compact={false} />);
    });
});