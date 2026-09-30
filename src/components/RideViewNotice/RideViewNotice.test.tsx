import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { RideViewNotice } from './RideViewNotice';

const MESSAGE = "Street View isn't available right now. Showing the Map instead.";

describe('RideViewNotice', () => {
    it('renders nothing when there is no notice', () => {
        const { toJSON } = render(<RideViewNotice notice={undefined} />);
        expect(toJSON()).toBeNull();
    });

    it('shows the message once a notice arrives', () => {
        const { getByText } = render(<RideViewNotice notice={{ cause: 'timeout' }} />);
        expect(getByText(MESSAGE)).toBeTruthy();
    });

    it('self-dismisses after 8s', async () => {
        jest.useFakeTimers();
        const { queryByText } = render(<RideViewNotice notice={{ cause: 'timeout' }} />);

        jest.advanceTimersByTime(8000);

        await waitFor(() => expect(queryByText(MESSAGE)).toBeNull());
        jest.useRealTimers();
    });

    it('keeps showing the same notice across a re-render once the prop is cleared (one-shot capture)', () => {
        const { getByText, rerender } = render(<RideViewNotice notice={{ cause: 'timeout' }} />);
        rerender(<RideViewNotice notice={undefined} />);
        expect(getByText(MESSAGE)).toBeTruthy();
    });
});
