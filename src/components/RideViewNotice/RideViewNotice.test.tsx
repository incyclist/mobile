import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { RideViewNotice } from './RideViewNotice';

const MESSAGE = "Street View isn't available right now. Showing the Map instead.";

describe('RideViewNotice', () => {
    it('renders nothing when there is no notice', () => {
        const { toJSON } = render(<RideViewNotice notice={undefined} message={MESSAGE} />);
        expect(toJSON()).toBeNull();
    });

    it('shows the given message once a notice arrives', () => {
        const { getByText } = render(<RideViewNotice notice={{ cause: 'timeout' }} message={MESSAGE} />);
        expect(getByText(MESSAGE)).toBeTruthy();
    });

    it('self-dismisses after 8s', async () => {
        jest.useFakeTimers();
        const { queryByText } = render(<RideViewNotice notice={{ cause: 'timeout' }} message={MESSAGE} />);

        jest.advanceTimersByTime(8000);

        await waitFor(() => expect(queryByText(MESSAGE)).toBeNull());
        jest.useRealTimers();
    });

    it('keeps showing the same notice across a re-render once the prop is cleared (one-shot capture)', () => {
        const { getByText, rerender } = render(<RideViewNotice notice={{ cause: 'timeout' }} message={MESSAGE} />);
        rerender(<RideViewNotice notice={undefined} message={MESSAGE} />);
        expect(getByText(MESSAGE)).toBeTruthy();
    });

    it('re-triggers for a new distinct notice object (e.g. a coverage-gap notice fired again mid-ride)', () => {
        const coverageMessage = 'No Street View imagery at this location.';
        const { getByText, queryByText, rerender } = render(
            <RideViewNotice notice={{ ts: 1 }} message={coverageMessage} />
        );
        expect(getByText(coverageMessage)).toBeTruthy();

        rerender(<RideViewNotice notice={undefined} message={coverageMessage} />);
        expect(getByText(coverageMessage)).toBeTruthy();

        rerender(<RideViewNotice notice={{ ts: 2 }} message={coverageMessage} />);
        expect(getByText(coverageMessage)).toBeTruthy();
        expect(queryByText(MESSAGE)).toBeNull();
    });
});
