import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResultView } from './ResultView';

const defaultProps = {
    compact: false,
    workoutName: 'Sweet Spot Intervals',
    group: 'My Workouts',
    knownGroups: ['My Workouts', 'FTP Builder'],
    onSetGroup: jest.fn(),
};

describe('ResultView', () => {
    it('renders without crashing', () => {
        render(<ResultView {...defaultProps} />);
    });

    it('renders without a group (no result yet) without crashing', () => {
        render(<ResultView {...defaultProps} workoutName={undefined} group={undefined} />);
    });

    it('renders with many known groups without crashing', () => {
        render(
            <ResultView
                {...defaultProps}
                knownGroups={['My Workouts', 'FTP Builder', 'VO2 Max', 'Sweet Spot', 'Recovery', 'Climbing Prep']}
            />
        );
    });

    it('renders correctly in compact mode', () => {
        render(<ResultView {...defaultProps} compact={true} />);
    });

    it('offers "+ New" so the group field can create a new group', () => {
        const { getByText } = render(<ResultView {...defaultProps} />);
        expect(getByText('+ New')).toBeTruthy();
    });

    it('typing a new group name and submitting calls onSetGroup with the typed value', () => {
        const onSetGroup = jest.fn();
        const { getByText, getByPlaceholderText } = render(
            <ResultView {...defaultProps} onSetGroup={onSetGroup} />
        );
        fireEvent.press(getByText('+ New'));
        const input = getByPlaceholderText('New group name');
        fireEvent.changeText(input, 'Climbing Prep');
        fireEvent(input, 'submitEditing');
        expect(onSetGroup).toHaveBeenCalledWith('Climbing Prep');
    });
});
