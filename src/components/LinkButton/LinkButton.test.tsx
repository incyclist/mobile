import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LinkButton } from './LinkButton';

describe('LinkButton', () => {
    it('renders the label', () => {
        const { getByText } = render(<LinkButton label="How to get Street View" onPress={jest.fn()} />);
        expect(getByText('How to get Street View')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByText } = render(<LinkButton label="Change this" onPress={onPress} />);

        fireEvent.press(getByText('Change this'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByText } = render(<LinkButton label="Change this" onPress={onPress} disabled />);

        fireEvent.press(getByText('Change this'));

        expect(onPress).not.toHaveBeenCalled();
    });

    it('marks an external link', () => {
        const { getByText } = render(<LinkButton label="How to create a key" onPress={jest.fn()} external />);
        expect(getByText('How to create a key ↗')).toBeTruthy();
    });
});
