import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutImportDialogView } from './WorkoutImportDialogView';
import { WorkoutImportDialogViewProps } from './types';

const defaultProps: WorkoutImportDialogViewProps = {
    compact: false,
    displayProps: {
        phase: 'landing',
        knownGroups: ['My Workouts', 'FTP Builder'],
    },
    title: 'Import Workout',
    buttons: [],
    onSetGroup: jest.fn(),
    onPickFile: jest.fn(),
};

describe('WorkoutImportDialogView', () => {
    it('renders landing phase without crashing', () => {
        render(<WorkoutImportDialogView {...defaultProps} />);
    });

    it('renders importing phase without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'importing',
                    importing: { fileName: 'sweet-spot.zwo' },
                }}
                buttons={[]}
            />
        );
    });

    it('renders result phase with the group picker without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'result',
                    result: { id: 'w-1', workoutName: 'Sweet Spot Intervals', group: 'FTP Builder' },
                }}
                buttons={[{ label: 'Done', onClick: jest.fn(), primary: true }]}
            />
        );
    });

    it('renders result phase with many known groups without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'result',
                    knownGroups: ['My Workouts', 'FTP Builder', 'VO2 Max', 'Sweet Spot', 'Recovery', 'Climbing Prep'],
                    result: { id: 'w-2', workoutName: 'Winter Base Ride', group: 'Sweet Spot' },
                }}
                buttons={[{ label: 'Done', onClick: jest.fn(), primary: true }]}
            />
        );
    });

    it('renders error phase without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'error',
                    error: 'The selected file is not a valid workout.',
                }}
                buttons={[
                    { label: 'Try Again', onClick: jest.fn(), primary: true },
                    { label: 'Cancel', onClick: jest.fn() },
                ]}
            />
        );
    });

    it('renders error phase with a missing error message without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'error',
                }}
            />
        );
    });

    it('renders correctly in compact mode', () => {
        render(<WorkoutImportDialogView {...defaultProps} compact={true} />);
    });

    it('renders result phase in compact mode without crashing', () => {
        render(
            <WorkoutImportDialogView
                {...defaultProps}
                compact={true}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'result',
                    result: { id: 'w-1', workoutName: 'Sweet Spot Intervals', group: 'FTP Builder' },
                }}
                buttons={[{ label: 'Done', onClick: jest.fn(), primary: true }]}
            />
        );
    });
});
