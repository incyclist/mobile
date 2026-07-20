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
});
