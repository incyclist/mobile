import React from 'react';
import { render, act } from '@testing-library/react-native';
import { EventEmitter } from 'node:events';
import { RouteSharingSettings } from './RouteSharingSettings';

const mockClient = new EventEmitter() as EventEmitter & Record<string, unknown>;
const mockDisplay = {
    available: true,
    links: [{ linkId: 'l1', displayName: 'Home PC', name: 'Home PC', reachability: 'reachable', pairedAt: 1, lastSeenAt: 2, connected: true, mediaAvailable: true, catalogVersion: 'v1' }],
    checking: false,
    recovery: { autoBrowsesUsed: 0, autoBrowsesMax: 3 },
    discovery: { phase: 'idle' },
    pairing: { step: 'idle' },
};
const mockCheckAgain = jest.fn().mockResolvedValue([]);
// one stable instance, as the real service is a singleton
const mockSharing = Object.assign(new EventEmitter(), {
    checkAgain: mockCheckAgain,
    getSyncState: jest.fn((linkId: string) => ({ linkId, state: 'done' })),
    getRepo: () => ({ getForLink: () => [{}, {}, {}] }),
});

const mockLogEvent = jest.fn();
const mockLogError = jest.fn();
jest.mock('../../hooks/logging', () => ({ useLogging: () => ({ logEvent: mockLogEvent, logError: mockLogError }) }));
jest.mock('incyclist-services', () => ({
    useLocalLinkClient: () => mockClient,
    useRouteSharingClient: () => mockSharing,
}));
jest.mock('../AddComputerDialog', () => ({ AddComputerDialog: () => null }));

describe('RouteSharingSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockClient.getDisplayProps = jest.fn(() => mockDisplay);
        mockClient.removeAllListeners();
    });

    it('renders the computers of the service and checks them once on open', () => {
        const { getByText } = render(<RouteSharingSettings onClose={jest.fn()} />);
        expect(getByText('Home PC')).toBeTruthy();
        expect(getByText('Connected • 3 routes')).toBeTruthy();
        expect(mockCheckAgain).toHaveBeenCalledTimes(1);
    });

    it('says Adding routes only while the service syncs, and says so when the routes could not be loaded', () => {
        mockSharing.getSyncState.mockImplementation((linkId: string) => ({ linkId, state: 'syncing' }));
        const { getByText, queryByText } = render(<RouteSharingSettings onClose={jest.fn()} />);
        expect(getByText('Adding routes…')).toBeTruthy();

        mockSharing.getSyncState.mockImplementation((linkId: string) => ({ linkId, state: 'failed' }));
        act(() => { mockSharing.emit('sync-state', { linkId: 'l1', state: 'failed' }); });
        expect(queryByText('Adding routes…')).toBeNull();
        expect(getByText('Connected • routes could not be loaded')).toBeTruthy();
        mockSharing.getSyncState.mockImplementation((linkId: string) => ({ linkId, state: 'done' }));
    });

    it('does not check when the feature is not available, and shows the update prompt', () => {
        const unavailable = { ...mockDisplay, available: false, links: [] };
        mockClient.getDisplayProps = jest.fn(() => unavailable);
        const { getByText } = render(<RouteSharingSettings onClose={jest.fn()} />);
        expect(getByText('Update Incyclist to use Route Sharing')).toBeTruthy();
        expect(mockCheckAgain).not.toHaveBeenCalled();
    });

    it('follows state changes of the service and stops listening on unmount', () => {
        const { getByText, unmount } = render(<RouteSharingSettings onClose={jest.fn()} />);
        act(() => {
            mockClient.emit('state-changed', { ...mockDisplay, links: [{ ...mockDisplay.links[0], displayName: 'Renamed PC' }] });
        });
        expect(getByText('Renamed PC')).toBeTruthy();
        unmount();
        expect(mockClient.listenerCount('state-changed')).toBe(0);
    });

    describe('never throws out of an effect or handler', () => {
        it('contains a rejecting checkAgain on open and a throwing getDisplayProps in the effect', async () => {
            mockCheckAgain.mockRejectedValueOnce(new Error('check down'));
            render(<RouteSharingSettings onClose={jest.fn()} />);
            await act(async () => { await Promise.resolve(); });
            expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'check down' }), 'RouteSharingSettings.checkAgain');
        });

        it('contains a throwing subscription', () => {
            mockClient.on = jest.fn(() => { throw new Error('on boom'); });
            expect(() => render(<RouteSharingSettings onClose={jest.fn()} />)).not.toThrow();
            expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'on boom' }), 'RouteSharingSettings.subscribe');
            delete (mockClient as any).on;
        });

        it('contains a repo that throws while building the rows', () => {
            const original = mockSharing.getRepo;
            mockSharing.getRepo = () => { throw new Error('repo boom'); };
            expect(() => render(<RouteSharingSettings onClose={jest.fn()} />)).not.toThrow();
            expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'repo boom' }), 'RouteSharingSettings.rows');
            mockSharing.getRepo = original;
        });
    });
});
