import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrevRidesExpandChevron } from './PrevRidesExpandChevron';

describe('PrevRidesExpandChevron', () => {
    it('renders a chevron pointing down when collapsed', () => {
        const { getByLabelText } = render(<PrevRidesExpandChevron expanded={false} onPress={jest.fn()} />);
        expect(getByLabelText('Expand previous rides')).toBeTruthy();
    });

    it('renders a chevron pointing up when expanded', () => {
        const { getByLabelText } = render(<PrevRidesExpandChevron expanded={true} onPress={jest.fn()} />);
        expect(getByLabelText('Collapse previous rides')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(<PrevRidesExpandChevron expanded={false} onPress={onPress} />);

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
