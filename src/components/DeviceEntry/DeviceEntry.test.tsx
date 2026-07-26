import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DeviceEntry from './DeviceEntry';

const baseProps = {
    deviceName: 'Tacx Neo',
    value: 100,
    interface: 'ble',
    isSelected: false,
    onClick: jest.fn(),
    onDelete: jest.fn(),
};

describe('DeviceEntry', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<DeviceEntry {...baseProps} />);
        expect(toJSON()).not.toBeNull();
    });

    it('calls onClick when the row is pressed', () => {
        const onClick = jest.fn();
        const { getByText } = render(<DeviceEntry {...baseProps} onClick={onClick} />);
        fireEvent.press(getByText('Tacx Neo'));
        expect(onClick).toHaveBeenCalled();
    });

    // Regression-style test for the swipe-to-delete wiring, following the same pattern
    // used for WorkoutItemView: react-native-gesture-handler's native module isn't
    // available in this test environment (Swipeable's own require() throws), so this
    // exercises the fallback rendering path rather than the real native Swipeable. That
    // fallback still renders renderRightActions() so the onPress -> onDelete wiring is
    // actually under test here; it cannot confirm or rule out native gesture-timing
    // behaviour on a physical device.
    it('calls onDelete when the revealed delete action is pressed', () => {
        const onDelete = jest.fn();
        const { getByText } = render(<DeviceEntry {...baseProps} onDelete={onDelete} />);
        fireEvent.press(getByText('Delete'));
        expect(onDelete).toHaveBeenCalled();
    });

    it('does not render a delete action when onDelete is not provided', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onDelete, ...rest } = baseProps;
        const { queryByText } = render(<DeviceEntry {...rest} />);
        expect(queryByText('Delete')).toBeNull();
    });

    it('does not render a delete action when the row is disabled', () => {
        const { queryByText } = render(<DeviceEntry {...baseProps} disabled />);
        expect(queryByText('Delete')).toBeNull();
    });
});
