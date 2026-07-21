import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutImportDisplayProps } from 'incyclist-services';
import { WorkoutImportDialog } from './WorkoutImportDialog';

const mockObserver = { on: jest.fn(), off: jest.fn() };

const mockService = {
    getImportDisplayProps: jest.fn<WorkoutImportDisplayProps, []>(() => ({
        phase: 'landing',
        knownGroups: ['My Workouts'],
    })),
    getPageObserver: jest.fn(() => mockObserver),
    onImportOpen: jest.fn(),
    onImportFile: jest.fn(),
    onImportSetGroup: jest.fn(),
    onImportClose: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    getWorkoutListPageService: () => mockService,
}));

jest.mock('../../hooks/files/useFilePicker', () => ({
    useFilePicker: () => ({ pickFile: jest.fn().mockResolvedValue(null) }),
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
});
