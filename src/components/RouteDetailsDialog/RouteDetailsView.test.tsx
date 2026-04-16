import React from 'react';
import { render } from '@testing-library/react-native';
import { RouteDetailsView } from './RouteDetailsView';
import type { UIRouteSettings, UIStartSettings } from 'incyclist-services';

jest.mock('incyclist-services', () => ({
    useUnitConverter: () => ({ convert: (v: number) => v }),
    useRouteList: jest.fn(),
    useActivityList: jest.fn(),
}));
jest.mock('../../bindings/ui', () => ({}));
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logError: jest.fn(), logEvent: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => ({ compact: false }),
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    MapView: 'MapView',
    Camera: 'Camera',
    ShapeSource: 'ShapeSource',
    LineLayer: 'LineLayer',
    setAccessToken: jest.fn(),
    default: { createFragment: jest.fn() },
}));

jest.mock('../DownloadModal', () => {
    const { Text } = require('react-native');
    return {
        DownloadModalView: ({ visible }: any) => visible ? <Text>DownloadModalView</Text> : null,
    };
});

const MOCK_SETTINGS = {
    startPos: { value: 0, unit: 'km' },
    realityFactor: 100,
    prevRides: [],
    showPrev: false,
} as unknown as UIRouteSettings;

const MOCK_PROPS = {
    title: 'Test Route',
    compact: false,
    hasGpx: false,
    points: [],
    previewUrl: undefined,
    totalDistance: { value: 50, unit: 'km' },
    totalElevation: { value: 800, unit: 'm' },
    routeType: 'Video - Point to Point',
    segments: [],
    canStart: true,
    showLoopOverwrite: false,
    showNextOverwrite: false,
    showWorkout: false,
    showPrev: false,
    loading: false,
    initialSettings: MOCK_SETTINGS,
    onStart: jest.fn(),
    onCancel: jest.fn(),
    onStartWithWorkout: jest.fn(),
    onSettingsChanged: jest.fn().mockResolvedValue({}),
    onUpdateStartPos: jest.fn((value: number) => {
        return { startPos: { value, unit: 'km' } } as unknown as UIStartSettings;
    }),
    downloadButtonLabel: undefined,
    downloadButtonDisabled: false,
    onDownloadPress: jest.fn(),
    showDownloadModal: false,
    onDownloadModalClose: jest.fn(),
    downloadRows: [],
    onDownloadStop: jest.fn(),
    onDownloadRetry: jest.fn(),
    onDownloadDelete: jest.fn(),
};

describe('RouteDetailsView', () => {
    it('renders in normal layout', () => {
        render(<RouteDetailsView {...MOCK_PROPS} />);
    });

    it('renders in compact layout', () => {
        render(<RouteDetailsView {...MOCK_PROPS} compact={true} />);
    });

    it('renders with no segments', () => {
        render(<RouteDetailsView {...MOCK_PROPS} segments={[]} />);
    });

    it('renders with segments (chips)', () => {
        const segments = [{ name: 'Seg 1', start: 0, end: 1000 }];
        render(<RouteDetailsView {...MOCK_PROPS} segments={segments} compact={false} />);
    });

    it('renders with segments (dropdown — compact)', () => {
        const segments = [{ name: 'Seg 1', start: 0, end: 1000 }];
        render(<RouteDetailsView {...MOCK_PROPS} segments={segments} compact={true} />);
    });

    it('renders with endPos visible (segment active)', () => {
        const settings = {
            ...MOCK_PROPS.initialSettings,
            segment: 'Seg 1',
            endPos: { value: 10, unit: 'km' },
        } as unknown as UIRouteSettings;
        render(<RouteDetailsView {...MOCK_PROPS} initialSettings={settings} />);
    });

    it('renders with endPos undefined (no segment)', () => {
        render(<RouteDetailsView {...MOCK_PROPS} />);
    });

    it('renders with loading state', () => {
        render(<RouteDetailsView {...MOCK_PROPS} loading={true} />);
    });

    it('renders with download button', () => {
        const { getByText } = render(<RouteDetailsView {...MOCK_PROPS} downloadButtonLabel="Download" />);
        expect(getByText('Download')).toBeTruthy();
    });

    it('renders with disabled download button', () => {
        const { getByText } = render(
            <RouteDetailsView 
                {...MOCK_PROPS} 
                downloadButtonLabel="Downloading…" 
                downloadButtonDisabled={true} 
            />
        );
        expect(getByText('Downloading…')).toBeTruthy();
    });

    it('renders with DownloadModal when showDownloadModal is true', () => {
        const { getByText } = render(<RouteDetailsView {...MOCK_PROPS} showDownloadModal={true} />);
        // The mock renders the name of the component
        expect(getByText('DownloadModalView')).toBeTruthy();
    });
});