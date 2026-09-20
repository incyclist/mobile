import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import type { RouteVideoDisplayProps } from 'incyclist-services';
import { RouteDetailsView } from './RouteDetailsView';
import { ButtonBar } from '../ButtonBar';
import type { ButtonProps } from '../ButtonBar/types';
import { MOCK_NOW, MOCK_VIDEO_STATES } from './video/videoStates.mock';

/**
 * The rule these tests exist to hold: nothing about the video surfaces is decided from
 * `status.state`. Buttons, links and nested dialogs come from `actions`, `canStart`,
 * `confirmation` and `removeConfirmation` - so the tests below set those deliberately against
 * what the state name would suggest, and assert the props win every time.
 */

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
    Map: 'Map', Camera: 'Camera', GeoJSONSource: 'GeoJSONSource', Layer: 'Layer',
    ViewAnnotation: 'ViewAnnotation',
    LogManager: { onLog: jest.fn() }, NetworkManager: { setConnected: jest.fn() },
}));
jest.mock('../DownloadModal', () => ({ DownloadModalView: () => null }));
jest.mock('../SecureImage', () => ({ SecureImage: () => null }));
jest.mock('../FreeMap', () => {
    const { Text } = require('react-native');
    return { FreeMap: () => <Text>FreeMap</Text> };
});
jest.mock('../ElevationGraph', () => {
    const { Text } = require('react-native');
    return { ElevationGraph: () => <Text>ElevationGraph</Text> };
});

const handlers = () => ({
    onVideoDownloadPressed: jest.fn(),
    onVideoDownloadConfirmed: jest.fn(),
    onVideoDownloadDismissed: jest.fn(),
    onVideoRetry: jest.fn(),
    onVideoStop: jest.fn(),
    onVideoConfirmAccess: jest.fn(),
    onVideoKeepInstead: jest.fn(),
    onVideoRemovePressed: jest.fn(),
    onVideoRemoveConfirmed: jest.fn(),
    onVideoRemoveDismissed: jest.fn(),
});

const renderView = (video?: RouteVideoDisplayProps, overrides: any = {}) => {
    const spies = handlers();
    const utils = render(
        <RouteDetailsView
            title="Col de Pennes"
            compact={false}
            hasGpx={false}
            isOnline={true}
            totalDistance={{ value: 12.3, unit: 'km' }}
            totalElevation={{ value: 320, unit: 'm' }}
            routeType="Video - Loop"
            canStart={true}
            showLoopOverwrite={false}
            showNextOverwrite={false}
            showPrev={false}
            loading={false}
            attachedWorkout={null}
            initialSettings={{ startPos: { value: 0, unit: 'km' }, realityFactor: 100 } as any}
            onStart={jest.fn()}
            onCancel={jest.fn()}
            onAddWorkout={jest.fn()}
            onClearWorkout={jest.fn()}
            onSettingsChanged={jest.fn().mockResolvedValue({})}
            onUpdateStartPos={jest.fn().mockReturnValue(null)}
            video={video}
            deviceWord="iPad"
            videoNow={MOCK_NOW}
            {...spies}
            {...overrides}
        />
    );
    return { ...utils, spies };
};

/** Lets the 300 ms gate on the checking notice elapse. */
const advancePastNoticeDelay = () => act(() => { jest.advanceTimersByTime(400); });

/**
 * The buttons the dialog's own footer was handed. Read from the bar rather than by text, because
 * "Start" also labels a field in the form below it - and because the flags on a button (primary,
 * disabled) are part of what these tests are checking.
 */
const footerButtons = (utils: ReturnType<typeof renderView>): ButtonProps[] => {
    const bars = utils.UNSAFE_getAllByType(ButtonBar);
    const footer = bars.find(bar => bar.props.buttons.some((b: ButtonProps) => b.label === 'Cancel'));
    return footer?.props.buttons ?? [];
};

const footerLabels = (utils: ReturnType<typeof renderView>): string[] =>
    footerButtons(utils).map(b => b.label);

const pressFooter = (utils: ReturnType<typeof renderView>, label: string) => {
    const button = footerButtons(utils).find(b => b.label === label);
    if (!button) throw new Error(`no "${label}" button in the footer`);
    act(() => { button.onClick(); });
    return button;
};

describe('RouteDetailsView video surfaces - nothing added without video props', () => {
    it('renders exactly as before when there is no video data at all', () => {
        const utils = renderView(undefined);
        expect(footerLabels(utils)).toEqual(['Cancel', 'Start', 'Add Workout']);
        expect(utils.queryByText('Video')).toBeNull();
    });

    // Android never gets the file-access binding, so `video` is permanently undefined there -
    // this is the same assertion from the platform's point of view.
    it('adds no VIDEO stat box for a video that is not in iCloud', () => {
        const utils = renderView(MOCK_VIDEO_STATES.unknown);
        expect(utils.queryByText('Video')).toBeNull();
        expect(footerLabels(utils)).toContain('Start');
    });
});

describe('RouteDetailsView video buttons come only from actions', () => {
    it.each([
        ['not downloaded', MOCK_VIDEO_STATES.notDownloaded, 'Download'],
        ['stopped', MOCK_VIDEO_STATES.cancelled, 'Download'],
        ['downloading', MOCK_VIDEO_STATES.downloading, 'Stop Download'],
        ['waiting for network', MOCK_VIDEO_STATES.waitingForNetwork, 'Stop Download'],
        ['download failed', MOCK_VIDEO_STATES.downloadFailed, 'Retry Download'],
        ['access needed', MOCK_VIDEO_STATES.accessNeeded, 'Confirm Access'],
    ])('offers %s its own action', (_name, video, label) => {
        expect(footerLabels(renderView(video))).toContain(label);
    });

    it.each([
        ['not found', MOCK_VIDEO_STATES.notFound],
        ['iCloud unavailable', MOCK_VIDEO_STATES.iCloudUnavailable],
        ['a download started outside the app', MOCK_VIDEO_STATES.downloadingExternal],
    ])('offers no action at all for %s', (_name, video) => {
        expect(footerLabels(renderView(video))).toEqual(['Cancel']);
    });

    // The button is present so the reason stays attached to something the user tried to press,
    // but it does nothing until the page service says there is room.
    it('shows Download disabled, and inert, when the service withholds downloadEnabled', () => {
        const utils = renderView(MOCK_VIDEO_STATES.notEnoughStorage);
        const button = pressFooter(utils, 'Download');
        expect(button.disabled).toBe(true);
        expect(utils.spies.onVideoDownloadPressed).not.toHaveBeenCalled();
    });

    it('presses through to the matching handler, one handler per button', () => {
        const download = renderView(MOCK_VIDEO_STATES.notDownloaded);
        pressFooter(download, 'Download');
        expect(download.spies.onVideoDownloadPressed).toHaveBeenCalledTimes(1);
        expect(download.spies.onVideoRetry).not.toHaveBeenCalled();

        const stop = renderView(MOCK_VIDEO_STATES.downloading);
        pressFooter(stop, 'Stop Download');
        expect(stop.spies.onVideoStop).toHaveBeenCalledTimes(1);

        const retry = renderView(MOCK_VIDEO_STATES.downloadFailed);
        pressFooter(retry, 'Retry Download');
        expect(retry.spies.onVideoRetry).toHaveBeenCalledTimes(1);

        const access = renderView(MOCK_VIDEO_STATES.accessNeeded);
        pressFooter(access, 'Confirm Access');
        expect(access.spies.onVideoConfirmAccess).toHaveBeenCalledTimes(1);
    });

    // The state says "ready", which would normally mean no buttons at all - the actions say
    // otherwise, and the actions are what the view is allowed to read.
    it('follows the actions even when they contradict what the state name suggests', () => {
        const contrived: RouteVideoDisplayProps = {
            ...MOCK_VIDEO_STATES.readyKept,
            actions: {
                ...MOCK_VIDEO_STATES.readyKept.actions,
                download: true, downloadEnabled: true, stop: true, confirmAccess: true,
            },
        };
        expect(footerLabels(renderView(contrived)))
            .toEqual(['Cancel', 'Start', 'Add Workout', 'Download', 'Stop Download', 'Confirm Access']);
    });
});

describe('RouteDetailsView Start visibility', () => {
    it('hides Start and Add Workout whenever the video cannot be started', () => {
        const labels = footerLabels(renderView(MOCK_VIDEO_STATES.notDownloaded));
        expect(labels).not.toContain('Start');
        expect(labels).not.toContain('Add Workout');
    });

    it('shows Start once the video is ready', () => {
        expect(footerLabels(renderView(MOCK_VIDEO_STATES.readyKept))).toContain('Start');
    });

    // Both gates have to agree: a route that cannot be started for its own reasons stays
    // unstartable even with a perfectly healthy video.
    it('still hides Start when the route itself cannot be started', () => {
        expect(footerLabels(renderView(MOCK_VIDEO_STATES.readyKept, { canStart: false })))
            .not.toContain('Start');
    });
});

describe('RouteDetailsView notice and links', () => {
    it('shows the notice for a video that is not on the device', () => {
        const { getByText } = renderView(MOCK_VIDEO_STATES.notDownloaded);
        expect(getByText('This video is stored in iCloud, not on this iPad')).toBeTruthy();
    });

    it('shows no notice for a video that is simply ready and kept', () => {
        const { queryByText } = renderView(MOCK_VIDEO_STATES.readyKept);
        expect(queryByText(/stored in iCloud/)).toBeNull();
        expect(queryByText('Downloaded for this ride')).toBeNull();
    });

    it('forwards the "Keep it instead" link to its own handler', () => {
        const { getByLabelText, spies } = renderView(MOCK_VIDEO_STATES.readyThisRide);
        fireEvent.press(getByLabelText('Keep it instead'));
        expect(spies.onVideoKeepInstead).toHaveBeenCalledTimes(1);
    });

    it('forwards the "Remove download" link to its own handler', () => {
        const { getAllByLabelText, spies } = renderView(MOCK_VIDEO_STATES.readyKept);
        fireEvent.press(getAllByLabelText('Remove download')[0]);
        expect(spies.onVideoRemovePressed).toHaveBeenCalledTimes(1);
    });

    it('leaves both links out when the service does not offer those actions', () => {
        const noActions: RouteVideoDisplayProps = {
            ...MOCK_VIDEO_STATES.readyThisRide,
            actions: { ...MOCK_VIDEO_STATES.readyThisRide.actions, keepInstead: false, remove: false },
        };
        const { queryByLabelText } = renderView(noActions);
        expect(queryByLabelText('Keep it instead')).toBeNull();
        expect(queryByLabelText('Remove download')).toBeNull();
    });

    it('shows the access-confirmed line above the route\'s next state', () => {
        const { getByText } = renderView(MOCK_VIDEO_STATES.accessConfirmedThenNotDownloaded);
        expect(getByText(/✓ Access confirmed/)).toBeTruthy();
        expect(getByText('This video is stored in iCloud, not on this iPad')).toBeTruthy();
    });
});

describe('RouteDetailsView checking state', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    // A check that resolves quickly must not flash a message the user cannot finish reading.
    it('holds the checking message back briefly, then shows it', () => {
        const { queryByText, getByText } = renderView(MOCK_VIDEO_STATES.checking);
        expect(queryByText('Checking video…')).toBeNull();
        advancePastNoticeDelay();
        expect(getByText('Checking video…')).toBeTruthy();
    });

    it('keeps Start unavailable while the check runs', () => {
        expect(footerLabels(renderView(MOCK_VIDEO_STATES.checking))).toEqual(['Cancel']);
    });
});

describe('RouteDetailsView nested confirmation dialogs', () => {
    it('opens neither dialog until the service supplies one', () => {
        const { queryByText } = renderView(MOCK_VIDEO_STATES.notDownloaded);
        expect(queryByText('Download this video?')).toBeNull();
        expect(queryByText('Remove download?')).toBeNull();
    });

    it('opens the download confirmation and forwards each of its three buttons', () => {
        const { getByText, spies } = renderView(MOCK_VIDEO_STATES.downloadConfirmation);
        expect(getByText('Download this video?')).toBeTruthy();

        fireEvent.press(getByText('Download and Keep'));
        expect(spies.onVideoDownloadConfirmed).toHaveBeenCalledWith('keep');

        fireEvent.press(getByText('Download for This Ride'));
        expect(spies.onVideoDownloadConfirmed).toHaveBeenCalledWith('this-ride');

        fireEvent.press(getByText('Not Now'));
        expect(spies.onVideoDownloadDismissed).toHaveBeenCalledTimes(1);
    });

    // Space can run out between the notice rendering and the tap; the service says so through
    // `downloadEnabled`, and both choices go dead together.
    it('disables both download choices when the service withdraws downloadEnabled', () => {
        const { getByText, spies } = renderView(MOCK_VIDEO_STATES.downloadConfirmationBlocked);
        fireEvent.press(getByText('Download and Keep'));
        fireEvent.press(getByText('Download for This Ride'));
        expect(spies.onVideoDownloadConfirmed).not.toHaveBeenCalled();
        expect(getByText(/isn't enough free space/)).toBeTruthy();
    });

    it('names every file in the multi-video confirmation', () => {
        const { getByText } = renderView(MOCK_VIDEO_STATES.downloadConfirmationMulti);
        expect(getByText('Download these videos?')).toBeTruthy();
    });

    it('opens the remove confirmation and forwards both of its buttons', () => {
        const { getByText, spies } = renderView(MOCK_VIDEO_STATES.removeConfirmation);
        expect(getByText('Remove download?')).toBeTruthy();

        fireEvent.press(getByText('Remove'));
        expect(spies.onVideoRemoveConfirmed).toHaveBeenCalledTimes(1);

        fireEvent.press(getByText('Keep'));
        expect(spies.onVideoRemoveDismissed).toHaveBeenCalledTimes(1);
    });
});

describe('RouteDetailsView phone layout', () => {
    const renderPhone = (video: RouteVideoDisplayProps) =>
        renderView(video, { compact: true, deviceWord: 'iPhone' });

    it('suffixes the info bar with the video state', () => {
        const { getByText } = renderPhone(MOCK_VIDEO_STATES.notDownloaded);
        expect(getByText(/• In iCloud · 4\.2 GB/)).toBeTruthy();
    });

    it('adds nothing to the info bar for a video that is not in iCloud', () => {
        const { queryByText } = renderPhone(MOCK_VIDEO_STATES.unknown);
        expect(queryByText(/In iCloud/)).toBeNull();
    });

    it('shows the shorter notice wording', () => {
        const { getByText } = renderPhone(MOCK_VIDEO_STATES.notDownloaded);
        expect(getByText('Stored in iCloud, not on this iPhone')).toBeTruthy();
    });

    it('shows the "Video file" row with its Remove download link once the video is on the device', () => {
        const { getByText, getAllByLabelText, spies } = renderPhone(MOCK_VIDEO_STATES.readyKept);
        expect(getByText('Video file — Downloaded to this iPhone · 4.2 GB')).toBeTruthy();
        fireEvent.press(getAllByLabelText('Remove download')[0]);
        expect(spies.onVideoRemovePressed).toHaveBeenCalledTimes(1);
    });

    it('leaves the "Video file" row out while the video is still in iCloud', () => {
        const { queryByText } = renderPhone(MOCK_VIDEO_STATES.notDownloaded);
        expect(queryByText(/Video file —/)).toBeNull();
    });
});
