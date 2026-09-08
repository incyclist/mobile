import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { RouteDetailsView } from './RouteDetailsView';
import { ChipSelect } from '../ChipSelect';
import {
    MOCK_ROUTE_DATA, MOCK_ROUTE_POINTS, MOCK_SMOOTHED_POINTS, MOCK_SMOOTHED_ELEVATION,
    MOCK_SMOOTHED_GRADIENT, MOCK_BARELY_VISIBLE_GRADIENT,
} from './RouteDetailsView.mock';
import type { UIRouteSettings, UIStartSettings } from 'incyclist-services';

jest.mock('incyclist-services', () => ({
    useUnitConverter: () => ({ convert: (v: number) => v }),
    useRouteList: jest.fn(),
    useActivityList: jest.fn(),
    getPosition: jest.fn(() => undefined),
}));
jest.mock('../../bindings/ui', () => ({}));
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logError: jest.fn(), logEvent: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => ({ compact: false }),
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    Map: 'Map',
    Camera: 'Camera',
    GeoJSONSource: 'GeoJSONSource',
    Layer: 'Layer',
    ViewAnnotation: 'ViewAnnotation',
    LogManager: { onLog: jest.fn() },
    NetworkManager: { setConnected: jest.fn() },
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
        return <Image testID="preview-still" source={source} {...props} />;
    },
}));

// Stand-ins so the gate tests below can assert which of the three surfaces is on screen without
// depending on anything the real map/graph render.
jest.mock('../FreeMap', () => {
    const { Text } = require('react-native');
    return { FreeMap: () => <Text>FreeMap</Text> };
});

// Records what the graph was actually asked to draw. Prefixed `mock` so jest allows the factory
// to close over it.
const mockElevationGraphProps = jest.fn();

jest.mock('../ElevationGraph', () => {
    const { Text } = require('react-native');
    return {
        ElevationGraph: (props: any) => {
            mockElevationGraphProps(props);
            return <Text>ElevationGraph</Text>;
        },
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
    routeData: undefined,
    isOnline: true,
    totalDistance: { value: 50, unit: 'km' },
    totalElevation: { value: 800, unit: 'm' },
    routeType: 'Video - Point to Point',
    segments: [],
    canStart: true,
    showLoopOverwrite: false,
    showNextOverwrite: false,
    showPrev: false,
    loading: false,
    initialSettings: MOCK_SETTINGS,
    attachedWorkout: null,
    onStart: jest.fn(),
    onCancel: jest.fn(),
    onAddWorkout: jest.fn(),
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

    // Route details showed no elevation profile at all, on either layout - the component existed
    // and was already used on the route list, but this screen had no slot for it. The three
    // surfaces are gated separately, matching web: the map needs a GPS track and a network, the
    // profile needs points alone (taking the map's place when there is no track), and the still
    // fills what is left.
    describe('elevation profile / map / still gates', () => {
        const withProfile = (overrides = {}) => ({
            ...MOCK_PROPS,
            points: MOCK_ROUTE_POINTS,
            routeData: MOCK_ROUTE_DATA,
            ...overrides,
        });

        it('renders the profile in the map slot when there are points but no GPS track (full)', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: false, compact: false })} />
            );
            expect(getByText('ElevationGraph')).toBeTruthy();
            expect(queryByText('FreeMap')).toBeNull();
        });

        it('renders the profile in the map slot when there are points but no GPS track (compact)', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: false, compact: true })} />
            );
            expect(getByText('ElevationGraph')).toBeTruthy();
            expect(queryByText('FreeMap')).toBeNull();
        });

        it('renders the profile alongside the map when the route has a GPS track (full)', () => {
            const { getByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: true, compact: false, previewUrl: 'https://example.com/p.jpg' })} />
            );
            expect(getByText('FreeMap')).toBeTruthy();
            expect(getByText('ElevationGraph')).toBeTruthy();
        });

        it('renders the profile alongside the map when the route has a GPS track (compact)', () => {
            const { getByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: true, compact: true })} />
            );
            expect(getByText('FreeMap')).toBeTruthy();
            expect(getByText('ElevationGraph')).toBeTruthy();
        });

        it('renders no profile and no map when the route has no points', () => {
            const { queryByText } = render(
                <RouteDetailsView {...MOCK_PROPS} hasGpx={true} points={[]} routeData={undefined} />
            );
            expect(queryByText('ElevationGraph')).toBeNull();
            expect(queryByText('FreeMap')).toBeNull();
        });

        // Offline the map has no tiles to fetch, so it is dropped - but the profile is local data
        // and still renders.
        it('renders the profile but no map when offline', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: true, isOnline: false })} />
            );
            expect(queryByText('FreeMap')).toBeNull();
            expect(getByText('ElevationGraph')).toBeTruthy();
        });

        it('renders no profile while the details are still loading', () => {
            const { queryByText } = render(
                <RouteDetailsView {...withProfile({ hasGpx: true, loading: true })} />
            );
            expect(queryByText('ElevationGraph')).toBeNull();
        });

        // Unactionable internal state - the map's absence is already visible, and naming it says
        // nothing the user can act on.
        it('never shows a "Map not available" placeholder', () => {
            [
                { ...MOCK_PROPS },
                { ...MOCK_PROPS, compact: true },
                withProfile({ hasGpx: true, isOnline: false }),
                withProfile({ hasGpx: true, isOnline: false, compact: true }),
            ].forEach(props => {
                const { queryByText } = render(<RouteDetailsView {...props} />);
                expect(queryByText('Map not available')).toBeNull();
            });
        });
    });

    describe('workout attachment (workout-mobile-hld-phase2.md §4.2)', () => {
        it('no attachedWorkout: shows "Add Workout"', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView {...MOCK_PROPS} attachedWorkout={null} />
            );
            expect(getByText('Add Workout')).toBeTruthy();
            expect(queryByText('Start with Workout')).toBeNull();
        });

        it('attachedWorkout set: shows the "Workout: <name>" chip instead of the button', () => {
            const { getByText, queryByText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
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
                    attachedWorkout={{ id: 'w1', title: 'VO2 Max Intervals' }}
                />
            );
            fireEvent.press(getByLabelText('Clear workout'));
            expect(MOCK_PROPS.onClearWorkout).toHaveBeenCalledTimes(1);
        });

        it('calls onAddWorkout (same handler as the legacy button) when "Add Workout" is pressed', () => {
            const { getByText } = render(
                <RouteDetailsView {...MOCK_PROPS} attachedWorkout={null} />
            );
            fireEvent.press(getByText('Add Workout'));
            expect(MOCK_PROPS.onAddWorkout).toHaveBeenCalledTimes(1);
        });
    });

    describe('"Compare prev rides" toggle', () => {
        // Regression test: turning the toggle off used to round-trip through onSettingsChanged
        // (refreshPrevRides in RouteDetailsDialog), which always recomputes showPrev from whether
        // past activities exist for the current position - ignoring the value the user just set -
        // and so silently reverted the toggle back to "on".
        it('does not call onSettingsChanged when toggled', () => {
            const onSettingsChanged = jest.fn().mockResolvedValue({});
            const { getByText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
                    prevRides={[{ id: 'a1' }]}
                    showPrev={true}
                    onSettingsChanged={onSettingsChanged}
                />
            );
            fireEvent.press(getByText('No'));
            expect(onSettingsChanged).not.toHaveBeenCalled();
        });

        it('stays off (and is carried into onStart) after being turned off, even if onSettingsChanged would say otherwise', async () => {
            const onSettingsChanged = jest.fn().mockResolvedValue({ showPrev: true });
            const onStart = jest.fn();
            const { getByText, getAllByText } = render(
                <RouteDetailsView
                    {...MOCK_PROPS}
                    prevRides={[{ id: 'a1' }]}
                    showPrev={true}
                    onSettingsChanged={onSettingsChanged}
                    onStart={onStart}
                />
            );
            fireEvent.press(getByText('No'));
            // Let any in-flight onSettingsChanged round-trip (and its state merge) fully settle
            // before checking - a prior version of this fix only "worked" because the test raced
            // ahead of that merge, which made it pass even on the buggy code.
            await act(async () => { await Promise.resolve(); await Promise.resolve(); });
            getAllByText('Start').forEach(el => fireEvent.press(el));
            expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ showPrev: false }));
        });
    });

    describe('Terrain Smoothing', () => {
        const PREVIEW = {
            smoothedPoints: MOCK_SMOOTHED_POINTS,
            smoothedElevation: MOCK_SMOOTHED_ELEVATION,
            smoothedGradient: MOCK_SMOOTHED_GRADIENT,
        };

        // A route with a GPS track, a still and a readable profile - so both the map and the
        // still are on screen at Off and there is something for the chart to displace.
        const smoothable = (overrides: any = {}) => ({
            ...MOCK_PROPS,
            hasGpx: true,
            points: MOCK_ROUTE_POINTS,
            routeData: MOCK_ROUTE_DATA,
            previewUrl: 'https://example.com/still.jpg',
            smoothingAvailable: true,
            smoothingMaxLevel: 5,
            onSettingsChanged: jest.fn().mockResolvedValue(PREVIEW),
            ...overrides,
        });

        // Already smoothing, without anyone having touched the control.
        const smoothed = (overrides: any = {}) => smoothable({
            initialSettings: { ...MOCK_SETTINGS, smoothingLevel: 3 },
            ...PREVIEW,
            ...overrides,
        });

        const selectLevel = async (getByText: any, level: string) => {
            await act(async () => { fireEvent.press(getByText(level)); });
        };

        beforeEach(() => {
            mockElevationGraphProps.mockClear();
        });

        describe('when the route cannot be smoothed', () => {
            // Hidden rather than disabled: the reason is something the user can do nothing about,
            // and naming it would only surface internal state.
            it('omits the row entirely when smoothingAvailable is false', () => {
                const { queryByText } = render(
                    <RouteDetailsView {...smoothable({ smoothingAvailable: false })} />
                );
                expect(queryByText('Terrain Smoothing')).toBeNull();
                expect(queryByText('Off')).toBeNull();
            });

            it('omits the row when the prop is absent altogether (older service build)', () => {
                const { queryByText } = render(
                    <RouteDetailsView {...smoothable({ smoothingAvailable: undefined })} />
                );
                expect(queryByText('Terrain Smoothing')).toBeNull();
            });

            // The graph and the map are gated on the route's data; smoothing is gated on whether
            // the transform has anything to work from. A route can be graphable and ineligible.
            it('still renders the profile for an ineligible route', () => {
                const { getByText } = render(
                    <RouteDetailsView {...smoothable({ smoothingAvailable: false })} />
                );
                expect(getByText('ElevationGraph')).toBeTruthy();
            });
        });

        describe('the control', () => {
            it('renders Off plus one chip per level, Off first, in one labelled row', () => {
                const { getByText, queryByText } = render(<RouteDetailsView {...smoothable()} />);
                expect(getByText('Terrain Smoothing')).toBeTruthy();
                ['Off', '1', '2', '3', '4', '5'].forEach(o => expect(getByText(o)).toBeTruthy());
                expect(queryByText('6')).toBeNull();
            });

            it('takes the range from smoothingMaxLevel rather than hardcoding it', () => {
                const { getByText, queryByText } = render(
                    <RouteDetailsView {...smoothable({ smoothingMaxLevel: 3 })} />
                );
                expect(getByText('3')).toBeTruthy();
                expect(queryByText('4')).toBeNull();
            });

            it('meets the 44px touch target', () => {
                const { UNSAFE_root } = render(<RouteDetailsView {...smoothable()} />);
                const chip = UNSAFE_root.findAllByType(ChipSelect)
                    .find(c => c.props.label === 'Terrain Smoothing');
                expect(chip?.props.chipMinHeight).toBeGreaterThanOrEqual(44);
            });

            it('reports the chosen level through onSettingsChanged', async () => {
                const props = smoothable();
                const { getByText } = render(<RouteDetailsView {...props} />);
                await selectLevel(getByText, '3');
                expect(props.onSettingsChanged).toHaveBeenCalledWith(
                    expect.objectContaining({ smoothingLevel: 3 })
                );
            });

            it('carries the chosen level into onStart', async () => {
                const onStart = jest.fn();
                const { getByText, getAllByText } = render(
                    <RouteDetailsView {...smoothable({ onStart })} />
                );
                await selectLevel(getByText, '4');
                getAllByText('Start').forEach(el => fireEvent.press(el));
                expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ smoothingLevel: 4 }));
            });

            it('carries the chosen level into onAddWorkout', async () => {
                const onAddWorkout = jest.fn();
                const { getByText } = render(
                    <RouteDetailsView {...smoothable({ onAddWorkout })} />
                );
                await selectLevel(getByText, '2');
                fireEvent.press(getByText('Add Workout'));
                expect(onAddWorkout).toHaveBeenCalledWith(
                    expect.objectContaining({ smoothingLevel: 2 })
                );
            });

            it('reports level 0 for Off', async () => {
                const props = smoothed();
                const { getByText } = render(<RouteDetailsView {...props} />);
                await selectLevel(getByText, 'Off');
                expect(props.onSettingsChanged).toHaveBeenCalledWith(
                    expect.objectContaining({ smoothingLevel: 0 })
                );
            });
        });

        describe('the copy', () => {
            it('explains what the control does while it is Off', () => {
                const { getByText, queryByText } = render(<RouteDetailsView {...smoothable()} />);
                expect(getByText('Softens sharp gradient changes for steadier trainer resistance.')).toBeTruthy();
                expect(queryByText('Riding a smoothed profile. Your saved route is unchanged.')).toBeNull();
            });

            it('states that the route is untouched, leading with the gradient figures, while a level is on', async () => {
                const { getByText } = render(<RouteDetailsView {...smoothable()} />);
                await selectLevel(getByText, '3');
                expect(getByText('Riding a smoothed profile. Your saved route is unchanged.')).toBeTruthy();
                // the gradient number leads - it moves by a factor rather than by the percent or
                // two elevation gain typically moves, and it is what the rider feels through the
                // trainer
                expect(getByText('Steepest gradient 20% → 9%. This ride records 760 m elevation gain instead of 800 m.')).toBeTruthy();
            });

            it('reports when a level barely changes this route, instead of the gradient/elevation numbers', async () => {
                const onSettingsChanged = jest.fn().mockResolvedValue({
                    smoothedPoints: MOCK_SMOOTHED_POINTS,
                    smoothedElevation: { value: 798, unit: 'm' },
                    smoothedGradient: MOCK_BARELY_VISIBLE_GRADIENT,
                });
                const { getByText } = render(<RouteDetailsView {...smoothable({ onSettingsChanged })} />);
                await selectLevel(getByText, '1');
                expect(getByText('Riding a smoothed profile. Your saved route is unchanged.')).toBeTruthy();
                expect(getByText('This level changes very little on this route — try a higher one.')).toBeTruthy();
            });

            // The vocabulary this feature is not allowed to use - every one of these asserts the
            // user's route was defective, which is the claim that sank the first attempt.
            it('never uses the words that call the route defective', async () => {
                const { getByText, queryByText } = render(<RouteDetailsView {...smoothable()} />);
                await selectLevel(getByText, '3');
                [
                    'fix', 'correct', 'clean up', 'repair', 'improve',
                    'accurate', 'realistic', 'error', 'noise', 'bumps', 'raw',
                ].forEach(word => {
                    expect(queryByText(new RegExp(`\\b${word}\\b`, 'i'))).toBeNull();
                });
            });
        });

        describe('the elevation figure', () => {
            it('adds a second line beside the route figure on the full layout, never replacing it', async () => {
                const { getByText } = render(<RouteDetailsView {...smoothable({ compact: false })} />);
                await selectLevel(getByText, '3');
                expect(getByText('800 m')).toBeTruthy();
                expect(getByText('smoothed 760 m (−40 m)')).toBeTruthy();
            });

            it('appends the smoothed figure to the info bar on the compact layout', async () => {
                const { getByText } = render(<RouteDetailsView {...smoothable({ compact: true })} />);
                await selectLevel(getByText, '3');
                expect(getByText(/800m \(smoothed 760m\)/)).toBeTruthy();
            });

            it('shows only the route figure at Off', () => {
                const { getByText, queryByText } = render(<RouteDetailsView {...smoothable()} />);
                expect(getByText('800 m')).toBeTruthy();
                expect(queryByText(/smoothed/)).toBeNull();
            });
        });

        describe('the preview', () => {
            const lastGraphProps = () => mockElevationGraphProps.mock.calls.at(-1)?.[0];

            // The elevation curve itself barely moves under smoothing - the chart still draws a
            // single line, from whichever points are in effect. There is no second visual (e.g.
            // gradient bands) surfacing the comparison: the user reads it from the chip row and
            // the gradient/elevation copy instead.
            it('draws a single line, from the smoothed points, once a level is active', async () => {
                const { getByText } = render(<RouteDetailsView {...smoothable()} />);
                await selectLevel(getByText, '3');

                expect(lastGraphProps().routeData.points).toBe(MOCK_SMOOTHED_POINTS);
                expect(lastGraphProps().comparisonRouteData).toBeUndefined();
            });

            // At Off, the preview must render exactly as it would if smoothing were unavailable on
            // this route - no reserved space, no leftover visual footprint from the feature.
            it('draws the unsmoothed route at Off', () => {
                const { queryByText } = render(<RouteDetailsView {...smoothable()} />);
                expect(lastGraphProps().routeData).toBe(MOCK_ROUTE_DATA);
                expect(lastGraphProps().comparisonRouteData).toBeUndefined();
                expect(queryByText('Original')).toBeNull();
                expect(queryByText('Smoothed')).toBeNull();
            });

            it('renders a route reopened with a stored level as smoothed straight away', () => {
                const { getByText } = render(<RouteDetailsView {...smoothed()} />);
                expect(lastGraphProps().routeData.points).toBe(MOCK_SMOOTHED_POINTS);
                expect(getByText('smoothed 760 m (−40 m)')).toBeTruthy();
                expect(getByText('Riding a smoothed profile. Your saved route is unchanged.')).toBeTruthy();
            });
        });

        // Live testing on web-ui surfaced the same defect this table now guards against: hiding
        // the still and letting the map yield read as "the screen is broken", not as a feature.
        // Nothing here may change what is on screen as a consequence of the smoothing level.
        describe('nothing on screen changes when a level is selected', () => {
            it('never hides the still on the full layout', async () => {
                const { getByText, queryByTestId } = render(
                    <RouteDetailsView {...smoothable({ compact: false })} />
                );
                expect(queryByTestId('preview-still')).toBeTruthy();

                await selectLevel(getByText, '3');
                expect(queryByTestId('preview-still')).toBeTruthy();

                await selectLevel(getByText, 'Off');
                expect(queryByTestId('preview-still')).toBeTruthy();
            });

            it('never removes the map on the compact layout', async () => {
                const { getByText, queryByText } = render(
                    <RouteDetailsView {...smoothable({ compact: true })} />
                );
                expect(queryByText('FreeMap')).toBeTruthy();

                await selectLevel(getByText, '3');
                expect(queryByText('FreeMap')).toBeTruthy();
                expect(queryByText('ElevationGraph')).toBeTruthy();

                await selectLevel(getByText, 'Off');
                expect(queryByText('FreeMap')).toBeTruthy();
            });

            // The map panel is untouched on the full layout - it is the still, not the map, that
            // yields there.
            it('keeps the map on the full layout', async () => {
                const { getByText, queryByText } = render(
                    <RouteDetailsView {...smoothable({ compact: false })} />
                );
                await selectLevel(getByText, '3');
                expect(queryByText('FreeMap')).toBeTruthy();
            });
        });
    });
});