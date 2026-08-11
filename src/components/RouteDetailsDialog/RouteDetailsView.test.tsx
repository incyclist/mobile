import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
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

jest.mock('../SecureImage', () => ({
    SecureImage: ({ source, ...props }: any) => {
        const { Image } = require('react-native');
        return <Image source={source} {...props} />;
    },
}));

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
    attachedWorkout: null,
    comboEnabled: false,
    onStart: jest.fn(),
    onCancel: jest.fn(),
    onStartWithWorkout: jest.fn(),
    onClearWorkout: jest.fn(),
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

    // Regression coverage for the compact-mode info bar move: `canNotStartReason` is the sole
    // explanation shown to the user when `canStart` is false (startButtons is then empty), so it
    // must always render regardless of layout - infoBar is rendered as the first child inside
    // Dialog in compact mode, so it's never affected by how tall the form/map content below it is.
    it('renders canNotStartReason in compact layout (infoBar as first Dialog child)', () => {
        const { getByText } = render(
            <RouteDetailsView
                {...MOCK_PROPS}
                compact={true}
                canStart={false}
                canNotStartReason="AVI videos are not supported on mobile"
            />
        );
        expect(getByText('AVI videos are not supported on mobile')).toBeTruthy();
    });

    it('renders canNotStartReason in normal (non-compact) layout', () => {
        const { getByText } = render(
            <RouteDetailsView
                {...MOCK_PROPS}
                compact={false}
                canStart={false}
                canNotStartReason="AVI videos are not supported on mobile"
            />
        );
        expect(getByText('AVI videos are not supported on mobile')).toBeTruthy();
    });

    it('does not render canNotStartReason when canStart is true', () => {
        const { queryByText } = render(
            <RouteDetailsView {...MOCK_PROPS} compact={true} canStart={true} canNotStartReason={undefined} />
        );
        expect(queryByText('AVI videos are not supported on mobile')).toBeNull();
    });

    // Regression coverage for the map-shrinks-to-fit follow-up: compact mode now renders Dialog
    // with scrollable={false} (a plain, definite-height View) so the map's height: '100%' can
    // resolve against real available space, and wraps only the form (compactLeft) in its own
    // ScrollView so a tall form can still scroll internally without ever affecting the map or the
    // info bar/error text below it. There must be exactly one ScrollView in the compact tree.
    it('renders exactly one ScrollView (the form) in compact layout, not one owned by Dialog', () => {
        const { UNSAFE_root } = render(<RouteDetailsView {...MOCK_PROPS} compact={true} />);
        expect(UNSAFE_root.findAllByType(ScrollView).length).toBe(1);
    });

    it('renders no ScrollView in normal (non-compact) layout (Dialog default scrollable=true wraps everything)', () => {
        const { UNSAFE_root } = render(<RouteDetailsView {...MOCK_PROPS} compact={false} />);
        // Dialog itself renders the ScrollView here (scrollable defaults to true), RouteDetailsView
        // does not add its own on top of it.
        expect(UNSAFE_root.findAllByType(ScrollView).length).toBe(1);
    });

    // workout-combo-service-design.md §3.5.1 "one source per state" - the two sources
    // (`showWorkout`/`cardProps.showWorkoutOption` vs. `attachedWorkout`/`comboEnabled`) must
    // never both drive the button/chip in the same render.
    describe('workout attachment (workout-mobile-hld-phase2.md §4.2)', () => {
        it('comboEnabled false, showWorkout true: shows "Start with Workout" (today\'s shipped label), never the chip', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...MOCK_PROPS} comboEnabled={false} showWorkout={true} attachedWorkout={null} />
            );
            expect(getByText('Start with Workout')).toBeTruthy();
            expect(queryByText(/^Workout:/)).toBeNull();
        });

        it('comboEnabled false, showWorkout false: shows neither the button nor the chip, even if attachedWorkout is set (stale showWorkoutOption must not be overridden)', () => {
            const { queryByText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
                    comboEnabled={false}
                    showWorkout={false}
                    attachedWorkout={{ id: 'w1', title: 'VO2 Max Intervals' }}
                />
            );
            expect(queryByText('Start with Workout')).toBeNull();
            expect(queryByText('Add Workout')).toBeNull();
            expect(queryByText(/^Workout:/)).toBeNull();
        });

        it('comboEnabled true, no attachedWorkout: shows "Add Workout", ignoring showWorkout entirely', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...MOCK_PROPS} comboEnabled={true} showWorkout={false} attachedWorkout={null} />
            );
            expect(getByText('Add Workout')).toBeTruthy();
            expect(queryByText('Start with Workout')).toBeNull();
        });

        it('comboEnabled true, attachedWorkout set: shows the "Workout: <name>" chip instead of the button, ignoring showWorkout entirely', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
                    comboEnabled={true}
                    showWorkout={true}
                    attachedWorkout={{ id: 'w1', title: 'VO2 Max Intervals' }}
                />
            );
            expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();
            expect(queryByText('Add Workout')).toBeNull();
            expect(queryByText('Start with Workout')).toBeNull();
        });

        it('calls onClearWorkout when the chip [x] is pressed', () => {
            const { getByLabelText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
                    comboEnabled={true}
                    attachedWorkout={{ id: 'w1', title: 'VO2 Max Intervals' }}
                />
            );
            fireEvent.press(getByLabelText('Clear workout'));
            expect(MOCK_PROPS.onClearWorkout).toHaveBeenCalledTimes(1);
        });

        it('calls onStartWithWorkout (same handler as the legacy button) when "Add Workout" is pressed', () => {
            const { getByText } = render(
                <RouteDetailsView {...MOCK_PROPS} comboEnabled={true} attachedWorkout={null} />
            );
            fireEvent.press(getByText('Add Workout'));
            expect(MOCK_PROPS.onStartWithWorkout).toHaveBeenCalledTimes(1);
        });
    });
});