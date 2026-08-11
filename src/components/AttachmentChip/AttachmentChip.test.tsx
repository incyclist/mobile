import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AttachmentChip } from './AttachmentChip';

describe('AttachmentChip', () => {
    it('renders the label and name', () => {
        const { getByText } = render(
            <AttachmentChip label="Route" name="Alblasserwaard (SD)" onClear={jest.fn()} />
        );
        expect(getByText('Route: Alblasserwaard (SD)')).toBeTruthy();
    });

    it('calls onClear when the [x] is pressed', () => {
        const onClear = jest.fn();
        const { getByLabelText } = render(
            <AttachmentChip label="Workout" name="VO2 Max Intervals" onClear={onClear} />
        );
        fireEvent.press(getByLabelText('Clear workout'));
        expect(onClear).toHaveBeenCalledTimes(1);
    });
});
