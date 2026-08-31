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

    // label/testID overrides let other features (e.g. NearbyRiders, session plan 2.2) reuse this
    // component directly instead of forking a near-identical copy — see the component's own doc.
    it('uses a custom label and testID when given, without affecting the default call sites', () => {
        const { getByLabelText, getByTestId } = render(
            <PrevRidesExpandChevron expanded={false} onPress={jest.fn()} label="nearby riders" testID="nearby-riders-expand-chevron" />
        );

        expect(getByLabelText('Expand nearby riders')).toBeTruthy();
        expect(getByTestId('nearby-riders-expand-chevron')).toBeTruthy();
    });
});
