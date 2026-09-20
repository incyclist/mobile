import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import type { RouteVideoDisplayProps } from 'incyclist-services';
import { RouteDetailsDialog } from './RouteDetailsDialog';
import { ButtonBar } from '../ButtonBar';
import type { ButtonProps } from '../ButtonBar/types';
import { MOCK_VIDEO_STATES } from './video/videoStates.mock';

/**
 * The dialog's side of the contract: it reads the route's video state from the page service,
 * re-reads it whenever that route is announced as changed, and hands every action straight back
 * with the route id. No video decision is taken here.
 */

const mockPageObserver = { on: jest.fn(), off: jest.fn() };

const mockPageService = {
    getRouteDetailsProps: jest.fn(),
    getPageObserver: jest.fn(() => mockPageObserver),
    onClearWorkoutSelection: jest.fn(),
    onVideoDownloadPressed: jest.fn(),
    onVideoDownloadConfirmed: jest.fn(),
    onVideoDownloadDismissed: jest.fn(),
    onVideoStop: jest.fn(),
    onVideoRetry: jest.fn(),
    onVideoKeepInstead: jest.fn(),
    onVideoRemovePressed: jest.fn(),
    onVideoRemoveConfirmed: jest.fn(),
    onVideoRemoveDismissed: jest.fn(),
    onConfirmAccess: jest.fn().mockResolvedValue(undefined),
};

const mockCardProps: any = {
    totalDistance: { value: 12.3, unit: 'km' },
    totalElevation: { value: 320, unit: 'm' },
    showLoopOverwrite: false,
    showNextOverwrite: false,
    canStart: true,
    updateStartPos: jest.fn(),
    settings: { startPos: { value: 0, unit: 'km' }, realityFactor: 100 },
};

const mockRouteData: any = {
    description: {
        id: 'r1', title: 'Col de Pennes', hasVideo: true, hasGpx: false, isLoop: true,
        videoFormat: 'mp4', previewUrl: undefined, segments: [], routeHash: 'hash1',
    },
    details: { points: [] },
    points: [],
};

const mockCard: any = {
    openSettings: jest.fn(() => mockCardProps),
    getData: jest.fn(() => mockRouteData),
    getCurrentDownload: jest.fn(() => null),
    changeSettings: jest.fn(),
    getSmoothingPreview: jest.fn(() => ({})),
    getPrevRidesFilter: jest.fn(() => ({})),
    start: jest.fn(),
    cancel: jest.fn(),
    addWorkout: jest.fn(),
    download: jest.fn(),
};

const mockRouteListService = {
    getCard: jest.fn(() => mockCard),
    getRouteDetails: jest.fn().mockResolvedValue(undefined),
};

jest.mock('incyclist-services', () => ({
    useRouteList: () => mockRouteListService,
    useActivityList: () => ({ getPastActivitiesWithDetails: jest.fn().mockResolvedValue([]) }),
    getRoutesPageService: () => mockPageService,
    useUnitConverter: () => ({ convert: (v: number) => v, getUnit: () => 'km' }),
    getPosition: jest.fn(() => undefined),
    useOnlineStatusMonitoring: () => ({ onlineStatus: true }),
}));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'normal',
    useIsTablet: () => true,
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    Map: 'Map', Camera: 'Camera', GeoJSONSource: 'GeoJSONSource', Layer: 'Layer',
    ViewAnnotation: 'ViewAnnotation',
    LogManager: { onLog: jest.fn() }, NetworkManager: { setConnected: jest.fn() },
}));
jest.mock('../SecureImage', () => ({ SecureImage: () => null }));
jest.mock('../FreeMap', () => {
    const { Text } = require('react-native');
    return { FreeMap: () => <Text>FreeMap</Text> };
});
jest.mock('../ElevationGraph', () => {
    const { Text } = require('react-native');
    return { ElevationGraph: () => <Text>ElevationGraph</Text> };
});
jest.mock('../DownloadModal', () => ({ DownloadModalView: () => null }));
jest.mock('../../services', () => ({ navigate: jest.fn() }));

const detailsProps = (video?: RouteVideoDisplayProps) => ({
    routeId: 'r1',
    attachedWorkout: null,
    video,
});

const renderDialog = (video?: RouteVideoDisplayProps) => {
    mockPageService.getRouteDetailsProps.mockReturnValue(detailsProps(video));
    return render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
};

const footerButtons = (utils: ReturnType<typeof renderDialog>): ButtonProps[] => {
    const bars = utils.UNSAFE_getAllByType(ButtonBar);
    const footer = bars.find(bar => bar.props.buttons.some((b: ButtonProps) => b.label === 'Cancel'));
    return footer?.props.buttons ?? [];
};

const pressFooter = (utils: ReturnType<typeof renderDialog>, label: string) => {
    const button = footerButtons(utils).find(b => b.label === label);
    if (!button) throw new Error(`no "${label}" button in the footer`);
    act(() => { button.onClick(); });
};

/** The handler the dialog registered for a given page-observer event. */
const handlerFor = (event: string): ((...args: any[]) => void) => {
    const call = mockPageObserver.on.mock.calls.find(([name]) => name === event);
    if (!call) throw new Error(`nothing subscribed to "${event}"`);
    return call[1];
};

describe('RouteDetailsDialog video state subscription', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('subscribes to the route-details update on mount and unsubscribes on unmount', () => {
        const { unmount } = renderDialog(MOCK_VIDEO_STATES.notDownloaded);
        expect(mockPageObserver.on).toHaveBeenCalledWith('route-details-update', expect.any(Function));
        unmount();
        expect(mockPageObserver.off).toHaveBeenCalledWith('route-details-update', expect.any(Function));
    });

    it('re-reads the props when its own route is announced as changed', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.notDownloaded);
        expect(footerButtons(utils).map(b => b.label)).toContain('Download');

        mockPageService.getRouteDetailsProps.mockReturnValue(detailsProps(MOCK_VIDEO_STATES.downloading));
        act(() => { handlerFor('route-details-update')('r1'); });

        const labels = footerButtons(utils).map(b => b.label);
        expect(labels).toContain('Stop Download');
        expect(labels).not.toContain('Download');
    });

    // Every open route details dialog hears the same observer, so an update for a different
    // route must not make this one re-render with another route's state.
    it('ignores an update announced for a different route', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.notDownloaded);
        mockPageService.getRouteDetailsProps.mockReturnValue(detailsProps(MOCK_VIDEO_STATES.downloading));

        act(() => { handlerFor('route-details-update')('some-other-route'); });

        expect(footerButtons(utils).map(b => b.label)).toContain('Download');
    });

    it('still renders when the page service reports no video state at all', () => {
        const utils = renderDialog(undefined);
        expect(footerButtons(utils).map(b => b.label)).toEqual(['Cancel', 'Start', 'Add Workout']);
    });
});

describe('RouteDetailsDialog video actions reach the page service', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it.each([
        { label: 'Download', video: MOCK_VIDEO_STATES.notDownloaded, method: 'onVideoDownloadPressed' },
        { label: 'Stop Download', video: MOCK_VIDEO_STATES.downloading, method: 'onVideoStop' },
        { label: 'Retry Download', video: MOCK_VIDEO_STATES.downloadFailed, method: 'onVideoRetry' },
        { label: 'Confirm Access', video: MOCK_VIDEO_STATES.accessNeeded, method: 'onConfirmAccess' },
    ] as const)('$label calls $method with the route id', ({ label, video, method }) => {
        const utils = renderDialog(video);
        pressFooter(utils, label);
        expect(mockPageService[method]).toHaveBeenCalledWith('r1');
        expect(mockPageService[method]).toHaveBeenCalledTimes(1);
    });

    it('passes the chosen keep-or-remove answer straight through', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.downloadConfirmation);

        fireEvent.press(utils.getByText('Download and Keep'));
        expect(mockPageService.onVideoDownloadConfirmed).toHaveBeenCalledWith('r1', 'keep');

        fireEvent.press(utils.getByText('Download for This Ride'));
        expect(mockPageService.onVideoDownloadConfirmed).toHaveBeenCalledWith('r1', 'this-ride');
    });

    it('reports a dismissed download confirmation rather than silently dropping it', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.downloadConfirmation);
        fireEvent.press(utils.getByText('Not Now'));
        expect(mockPageService.onVideoDownloadDismissed).toHaveBeenCalledWith('r1');
    });

    it('opens the remove flow from the link and confirms it from the dialog', () => {
        const ready = renderDialog(MOCK_VIDEO_STATES.readyKept);
        fireEvent.press(ready.getAllByLabelText('Remove download')[0]);
        expect(mockPageService.onVideoRemovePressed).toHaveBeenCalledWith('r1');

        const confirming = renderDialog(MOCK_VIDEO_STATES.removeConfirmation);
        fireEvent.press(confirming.getByText('Remove'));
        expect(mockPageService.onVideoRemoveConfirmed).toHaveBeenCalledWith('r1');

        fireEvent.press(confirming.getByText('Keep'));
        expect(mockPageService.onVideoRemoveDismissed).toHaveBeenCalledWith('r1');
    });

    it('sends the "Keep it instead" undo to the page service', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.readyThisRide);
        fireEvent.press(utils.getByLabelText('Keep it instead'));
        expect(mockPageService.onVideoKeepInstead).toHaveBeenCalledWith('r1');
    });

    // The picker call settles asynchronously; a rejection must not surface as an unhandled
    // rejection or take the dialog down with it.
    it('survives a rejected Confirm Access', async () => {
        mockPageService.onConfirmAccess.mockRejectedValueOnce(new Error('picker failed'));
        const utils = renderDialog(MOCK_VIDEO_STATES.accessNeeded);

        pressFooter(utils, 'Confirm Access');
        await act(async () => { await Promise.resolve(); });

        expect(mockPageService.onConfirmAccess).toHaveBeenCalledWith('r1');
        expect(utils.getByText('Incyclist needs your OK to use this video\'s folder again')).toBeTruthy();
    });
});

describe('RouteDetailsDialog names the user\'s own device', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('says iPad on a tablet', () => {
        const utils = renderDialog(MOCK_VIDEO_STATES.notDownloaded);
        expect(utils.getByText('This video is stored in iCloud, not on this iPad')).toBeTruthy();
    });
});
