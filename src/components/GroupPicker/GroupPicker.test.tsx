import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GroupPicker } from './GroupPicker';

const baseProps = {
    label: 'Group',
    groups: ['My Workouts', 'FTP Builder'],
    value: 'My Workouts',
    onValueChange: jest.fn(),
};

describe('GroupPicker', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<GroupPicker {...baseProps} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders with no known groups without crashing', () => {
        const { toJSON } = render(<GroupPicker {...baseProps} groups={[]} value="" />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders a value not present in groups without crashing', () => {
        const { toJSON } = render(<GroupPicker {...baseProps} value="Not Yet Known" />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders disabled without crashing', () => {
        const { toJSON } = render(<GroupPicker {...baseProps} disabled />);
        expect(toJSON()).not.toBeNull();
    });

    it('selecting an existing chip calls onValueChange', () => {
        const onValueChange = jest.fn();
        const { getByText } = render(
            <GroupPicker {...baseProps} onValueChange={onValueChange} />
        );
        fireEvent.press(getByText('FTP Builder'));
        expect(onValueChange).toHaveBeenCalledWith('FTP Builder');
    });

    it('does not offer "+ New" when allowNew is false', () => {
        const { queryByText } = render(<GroupPicker {...baseProps} allowNew={false} />);
        expect(queryByText('+ New')).toBeNull();
    });

    it('reveals a text input after tapping "+ New", and commits a typed name on submit', () => {
        const onValueChange = jest.fn();
        const { getByText, getByPlaceholderText } = render(
            <GroupPicker {...baseProps} onValueChange={onValueChange} />
        );
        fireEvent.press(getByText('+ New'));
        const input = getByPlaceholderText('New group name');
        fireEvent.changeText(input, 'Climbing Prep');
        fireEvent(input, 'submitEditing');
        expect(onValueChange).toHaveBeenCalledWith('Climbing Prep');
    });
});
