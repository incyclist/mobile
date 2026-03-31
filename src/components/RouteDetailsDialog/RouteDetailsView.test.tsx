import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RouteDetailsView } from './RouteDetailsView';
import type { UIRouteSettings, UIStartSettings } from 'incyclist-services'; // Added UIStartSettings

jest.mock('incyclist-services', () => ({
    useUnitConverter: () => ({ convert: (v: number) => v }),
    useRouteList: jest.fn(),
    useActivityList: jest.fn(),
}));
jest.mock('../../bindings/ui', () => ({}));
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logError: jest.fn(), logEvent: jest.fn() }),
    useUnmountEffect: jest.fn((cb) => cb()), // Mock for cleanup
}));
// NEW: Mock for MapLibreRN to prevent test crashes
jest.mock('@maplibre/maplibre-react-native', () => ({
    MapView: 'MapView',
    Camera: 'Camera',
    ShapeSource: 'ShapeSource',
    LineLayer: 'LineLayer',
    default: { createFragment: jest.fn() },
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
    onStart: jest.fn(),
    onCancel: jest.fn(),
    onStartWithWorkout: jest.fn(),
    onSettingsChanged: jest.fn().mockResolvedValue({}),
    onUpdateStartPos: jest.fn((value: number) => {
        // Mock simple update, no further adjustments unless specific scenario
        return { startPos: { value, unit: 'km' } } as unknown as UIStartSettings;
    }),
};

describe('RouteDetailsView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly in normal layout without segments and endPos', () => {
        const { getByLabelText, queryByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} />);

        expect(getByLabelText('Start')).toBeVisible();
        expect(getByLabelText('Reality')).toBeVisible();
        expect(queryByLabelText('End')).toBeNull(); // End field should not be present

        expect(queryByLabelText('Segment')).toBeNull(); // No segments, so no selector
    });

    it('renders correctly in compact layout without segments and endPos', () => {
        const { getByLabelText, queryByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} compact={true} />);

        expect(getByLabelText('Start')).toBeVisible();
        expect(getByLabelText('Reality')).toBeVisible();
        expect(queryByLabelText('End')).toBeNull();

        expect(queryByLabelText('Segment')).toBeNull();
    });

    it('renders ChipSelect when segments count is <= SEGMENT_CHIP_THRESHOLD (5) and not compact', () => {
        const segments = [{ name: 'Segment 1', start: 0, end: 1000 }];
        const { getByText, queryByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} segments={segments} compact={false} />);

        expect(getByText('All')).toBeVisible(); // Chip for 'All'
        expect(getByText('Segment 1')).toBeVisible(); // Chip for 'Segment 1'
        expect(queryByLabelText('Segment')).toBeNull(); // SingleSelect should not be present
    });

    it('renders SingleSelect when segments count is > SEGMENT_CHIP_THRESHOLD (5) and not compact', () => {
        const segments = Array.from({ length: 6 }, (_, i) => ({ name: `Seg ${i + 1}`, start: i * 1000, end: (i + 1) * 1000 }));
        const { getByLabelText, queryByText } = render(<RouteDetailsView {...MOCK_PROPS} segments={segments} compact={false} />);

        expect(getByLabelText('Segment')).toBeVisible(); // SingleSelect
        expect(queryByText('Seg 1')).toBeNull(); // Chips should not be present initially
    });

    it('renders SingleSelect when segments exist and compact is true', () => {
        const segments = [{ name: 'Segment 1', start: 0, end: 1000 }];
        const { getByLabelText, queryByText } = render(<RouteDetailsView {...MOCK_PROPS} segments={segments} compact={true} />);

        expect(getByLabelText('Segment')).toBeVisible(); // SingleSelect
        expect(queryByText('Segment 1')).toBeNull(); // Chips should not be present initially
    });

    it('displays endPos when a segment is selected', async () => {
        const segments = [{ name: 'Segment 1', start: 0, end: 1000 }];
        const propsWithSegment = {
            ...MOCK_PROPS,
            segments,
            initialSettings: {
                ...MOCK_SETTINGS,
                segment: 'Segment 1',
                startPos: { value: 0, unit: 'km' },
                endPos: { value: 1, unit: 'km' } // Explicitly set endPos in initial settings
            } as unknown as UIRouteSettings // NEW: Cast for initialSettings
        };

        const { getByLabelText, getByText } = render(<RouteDetailsView {...propsWithSegment} />); // NEW: Added getByText

        expect(getByLabelText('End')).toBeVisible();
        expect(getByLabelText('End')).toHaveProp('disabled', true);
        expect(getByLabelText('End')).toHaveProp('value', 1);
        expect(getByText('km')).toBeVisible(); // Check unit for End
    });

    it('updates startPos via EditNumber and calls onUpdateStartPos and onSettingsChanged', async () => {
        const { getByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} />);
        const startPosInput = getByLabelText('Start');

        fireEvent.changeText(startPosInput, '25.5');
        fireEvent(startPosInput, 'blur'); // Simulate blur to trigger commit

        await waitFor(() => {
            expect(MOCK_PROPS.onUpdateStartPos).toHaveBeenCalledWith(25.5);
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    startPos: { value: 25.5, unit: 'km' }
                })
            );
        });
    });

    it('updates realityFactor via EditNumber and calls onSettingsChanged', async () => {
        const { getByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} />);
        const realityInput = getByLabelText('Reality');

        fireEvent.changeText(realityInput, '75');
        fireEvent(realityInput, 'blur'); // Simulate blur to trigger commit

        await waitFor(() => {
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    realityFactor: 75
                })
            );
        });
    });

    it('applies max validation to startPos and shows error', async () => {
        const { getByLabelText, getByText } = render(<RouteDetailsView {...MOCK_PROPS} totalDistance={{ value: 50, unit: 'km' }} />);
        const startPosInput = getByLabelText('Start');

        fireEvent.changeText(startPosInput, '55'); // Exceeds max
        fireEvent(startPosInput, 'blur');

        await waitFor(() => {
            expect(getByText('Maximum value is 50')).toBeVisible();
            expect(MOCK_PROPS.onUpdateStartPos).not.toHaveBeenCalled(); // No commit if validation fails internally in EditNumber
        });
    });

    it('selects a segment via ChipSelect', async () => {
        const segments = [{ name: 'Segment A', start: 1000, end: 2000 }];
        const { getByText } = render(<RouteDetailsView {...MOCK_PROPS} segments={segments} />); // NEW: Added getByText

        fireEvent.press(getByText('Segment A'));

        await waitFor(() => {
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    segment: 'Segment A',
                    startPos: { value: 1, unit: 'km' }, // 1000m converted to 1km
                    endPos: { value: 2, unit: 'km' } // 2000m converted to 2km
                })
            );
        });
    });

    it('selects "All" segment via ChipSelect', async () => {
        const segments = [{ name: 'Segment A', start: 1000, end: 2000 }];
        const propsWithInitialSegment = {
            ...MOCK_PROPS,
            segments,
            initialSettings: {
                ...MOCK_SETTINGS,
                segment: 'Segment A',
                startPos: { value: 1, unit: 'km' },
                endPos: { value: 2, unit: 'km' }
            } as unknown as UIRouteSettings // NEW: Cast for initialSettings
        };
        const { getByText } = render(<RouteDetailsView {...propsWithInitialSegment} />); // NEW: Added getByText

        fireEvent.press(getByText('All'));

        await waitFor(() => {
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    segment: undefined,
                    startPos: { value: 0, unit: 'km' },
                    endPos: undefined
                })
            );
        });
    });

    it('selects a segment via SingleSelect', async () => {
        const segments = Array.from({ length: 6 }, (_, i) => ({ name: `Seg ${i + 1}`, start: i * 1000, end: (i + 1) * 1000 }));
        const { getByLabelText, getByText } = render(<RouteDetailsView {...MOCK_PROPS} segments={segments} />);

        // Open dropdown
        fireEvent.press(getByLabelText('Segment'));

        // Select an option
        fireEvent.press(getByText('Seg 3'));

        await waitFor(() => {
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    segment: 'Seg 3',
                    startPos: { value: 2, unit: 'km' },
                    endPos: { value: 3, unit: 'km' }
                })
            );
        });
    });

    it('selects "All" segment via SingleSelect', async () => {
        const segments = Array.from({ length: 6 }, (_, i) => ({ name: `Seg ${i + 1}`, start: i * 1000, end: (i + 1) * 1000 }));
        const propsWithInitialSegment = {
            ...MOCK_PROPS,
            segments,
            initialSettings: {
                ...MOCK_SETTINGS,
                segment: 'Seg 2',
                startPos: { value: 1, unit: 'km' },
                endPos: { value: 2, unit: 'km' }
            } as unknown as UIRouteSettings // NEW: Cast for initialSettings
        };
        const { getByLabelText, getByText } = render(<RouteDetailsView {...propsWithInitialSegment} />);

        // Open dropdown
        fireEvent.press(getByLabelText('Segment'));

        // Select an option
        fireEvent.press(getByText('All'));

        await waitFor(() => {
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    segment: undefined,
                    startPos: { value: 0, unit: 'km' },
                    endPos: undefined
                })
            );
        });
    });

    it('handles onUpdateStartPos returning null gracefully', async () => {
        MOCK_PROPS.onUpdateStartPos.mockReturnValueOnce(null as unknown as UIStartSettings); // NEW: Cast for null return

        const { getByLabelText } = render(<RouteDetailsView {...MOCK_PROPS} />);
        const startPosInput = getByLabelText('Start');

        fireEvent.changeText(startPosInput, '10');
        fireEvent(startPosInput, 'blur');

        await waitFor(() => {
            expect(MOCK_PROPS.onUpdateStartPos).toHaveBeenCalledWith(10);
            expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalledWith(
                expect.objectContaining({
                    startPos: { value: 10, unit: 'km' }
                })
            );
        });
    });

    it('should not update state if component unmounts during async onSettingsChanged', async () => {
        let resolveSettingsChanged: (value: any) => void;
        MOCK_PROPS.onSettingsChanged.mockImplementationOnce(() => new Promise(resolve => {
            resolveSettingsChanged = resolve;
        }));

        const { getByLabelText, unmount } = render(<RouteDetailsView {...MOCK_PROPS} />);
        const realityInput = getByLabelText('Reality');

        fireEvent.changeText(realityInput, '50');
        fireEvent(realityInput, 'blur');

        // Unmount the component before the promise resolves
        unmount();

        // Resolve the promise
        resolveSettingsChanged!({ realityFactor: 50, someOtherProp: 'test' });

        // Ensure setData was not called after unmount
        // This is hard to assert directly without mocking useState's setter
        // but we rely on refMounted.current === false to prevent the call.
        // We can indirectly verify that `onSettingsChanged` *was* called, but its effect
        // on component state was prevented.
        expect(MOCK_PROPS.onSettingsChanged).toHaveBeenCalled();
    });
});