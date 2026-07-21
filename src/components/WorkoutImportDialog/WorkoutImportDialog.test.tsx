import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WorkoutImportDisplayProps } from 'incyclist-services';
import { WorkoutImportDialog } from './WorkoutImportDialog';

const mockObserver = { on: jest.fn(), off: jest.fn() };
const mockImportObserver = { on: jest.fn(), off: jest.fn() };

const mockPickFile = jest.fn().mockResolvedValue(null);

const mockService = {
    getImportDisplayProps: jest.fn<WorkoutImportDisplayProps, []>(() => ({
        phase: 'landing',
        knownGroups: ['My Workouts'],
    })),
    getPageObserver: jest.fn(() => mockObserver),
    onImportOpen: jest.fn(),
    onImportFile: jest.fn(() => mockImportObserver),
    onImportSetGroup: jest.fn(),
    onImportClose: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    getWorkoutListPageService: () => mockService,
}));

jest.mock('../../hooks/files/useFilePicker', () => ({
    useFilePicker: () => ({ pickFile: mockPickFile }),
}));

describe('WorkoutImportDialog', () => {
    it('renders without crashing', () => {
        expect(() => render(<WorkoutImportDialog onClose={jest.fn()} />)).not.toThrow();
    });

    it('renders the importing phase without crashing', () => {
        mockService.getImportDisplayProps.mockReturnValueOnce({
            phase: 'importing',
            knownGroups: ['My Workouts'],
            importing: { fileName: 'sweet-spot.zwo' },
        });

        expect(() => render(<WorkoutImportDialog onClose={jest.fn()} />)).not.toThrow();
    });

    it('renders the result phase (with the group picker) without crashing', () => {
        mockService.getImportDisplayProps.mockReturnValueOnce({
            phase: 'result',
            knownGroups: ['My Workouts', 'FTP Builder'],
            result: { id: 'w-1', workoutName: 'Sweet Spot Intervals', group: 'My Workouts' },
        });

        expect(() => render(<WorkoutImportDialog onClose={jest.fn()} />)).not.toThrow();
    });

    it('unmounts without crashing', () => {
        const { unmount } = render(<WorkoutImportDialog onClose={jest.fn()} />);
        expect(() => unmount()).not.toThrow();
    });

    // Regression coverage for the "dialog stuck on Importing..." bug (5.12): the dialog
    // never reads onImportFile()'s own return value - it relies entirely on
    // getPageObserver()'s 'import-update' event (subscribed once on mount) to learn that
    // the import settled. This checks that subscription actually stays live across the
    // dialog's lifetime (a stale-closure bug here - e.g. the effect tearing down and
    // resubscribing, or subscribing to an observer instance that later gets replaced -
    // was flagged as a real, not-yet-ruled-out candidate for the bug).
    describe('import-update subscription lifecycle', () => {
        beforeEach(() => {
            mockObserver.on.mockClear();
            mockObserver.off.mockClear();
            mockService.getImportDisplayProps.mockClear();
            mockService.getImportDisplayProps.mockReturnValue({ phase: 'landing', knownGroups: ['My Workouts'] });
        });

        it('subscribes exactly once on mount and unsubscribes the same handler on unmount', () => {
            const { unmount, rerender } = render(<WorkoutImportDialog onClose={jest.fn()} />);

            expect(mockObserver.on).toHaveBeenCalledTimes(1);
            expect(mockObserver.on).toHaveBeenCalledWith('import-update', expect.any(Function));
            const [, registeredHandler] = mockObserver.on.mock.calls[0];

            // a parent re-render (e.g. WorkoutsPage re-rendering for an unrelated reason)
            // must not tear down and resubscribe - that would be exactly the stale-closure
            // shape that could orphan the subscription
            rerender(<WorkoutImportDialog onClose={jest.fn()} />);
            expect(mockObserver.on).toHaveBeenCalledTimes(1);
            expect(mockObserver.off).not.toHaveBeenCalled();

            unmount();
            expect(mockObserver.off).toHaveBeenCalledWith('import-update', registeredHandler);
        });

        it('re-fetches display props when the subscribed handler fires after onImportFile settles', () => {
            render(<WorkoutImportDialog onClose={jest.fn()} />);

            const callsBeforeUpdate = mockService.getImportDisplayProps.mock.calls.length;
            const [, registeredHandler] = mockObserver.on.mock.calls[0];

            // simulate WorkoutListPageService.onImportFile()'s .catch() emitting
            // 'import-update' on the page observer once the import promise rejects
            mockService.getImportDisplayProps.mockReturnValueOnce({
                phase: 'error',
                knownGroups: ['My Workouts'],
                error: 'Invalid Step description, power: no values specified',
            });
            registeredHandler();

            expect(mockService.getImportDisplayProps.mock.calls.length).toBeGreaterThan(callsBeforeUpdate);
        });
    });

    // Regression coverage for 5.12's actual root cause: onImportFile() returns an Observer
    // wrapping a real Node EventEmitter, which throws synchronously if 'error' is ever emitted
    // with zero listeners registered (a special case unique to that literal event name). That
    // throw was aborting WorkoutListPageService's own error-handling before it could update the
    // dialog's phase - the dialog looked "stuck on Importing..." forever on a genuine parse
    // failure. Fixed by subscribing to the returned observer, mirroring RouteImportDialog's
    // existing pattern - this test would fail (via a thrown/unhandled error on `emit`) if that
    // subscription were ever removed.
    describe('onPickFile observer subscription', () => {
        beforeEach(() => {
            mockImportObserver.on.mockClear();
            mockService.onImportFile.mockClear();
            mockPickFile.mockResolvedValueOnce({
                type: 'file', name: 'test.zwo', ext: 'zwo', filename: '/tmp/test.zwo',
                delimiter: '/', dir: '/tmp', url: undefined,
            });
        });

        it('subscribes to both success and error on the observer returned by onImportFile', async () => {
            const { getByText } = render(<WorkoutImportDialog onClose={jest.fn()} />);

            fireEvent.press(getByText('Choose Workout File'));

            await waitFor(() => expect(mockService.onImportFile).toHaveBeenCalledTimes(1));

            expect(mockImportObserver.on).toHaveBeenCalledWith('success', expect.any(Function));
            expect(mockImportObserver.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });
});
