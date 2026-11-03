import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RideViewRestrictionNotice } from './RideViewRestrictionNotice';

const TEXT = "Street View isn't available in simulated rides. Showing the Map instead.";
const message = {
    id: 3,
    state: 'message' as const,
    text: TEXT,
    actions: [
        { id: 'how-to' as const, label: 'How to get Street View' },
        { id: 'dont-show-again' as const, label: "Don't show this again" },
    ],
};
const acknowledged = {
    id: 3,
    state: 'acknowledged' as const,
    actions: [{ id: 'change-this' as const, label: "We won't show this again. Change this" }],
};

describe('RideViewRestrictionNotice', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders nothing without a notice', () => {
        const { toJSON } = render(<RideViewRestrictionNotice notice={undefined} onAction={jest.fn()} onClose={jest.fn()} />);
        expect(toJSON()).toBeNull();
    });

    it('renders the message and its actions', () => {
        const { getByText } = render(<RideViewRestrictionNotice notice={message} onAction={jest.fn()} onClose={jest.fn()} />);

        expect(getByText(TEXT)).toBeTruthy();
        expect(getByText('How to get Street View')).toBeTruthy();
        expect(getByText("Don't show this again")).toBeTruthy();
    });

    it('reports the pressed action', () => {
        const onAction = jest.fn();
        const { getByText } = render(<RideViewRestrictionNotice notice={message} onAction={onAction} onClose={jest.fn()} />);

        fireEvent.press(getByText("Don't show this again"));

        expect(onAction).toHaveBeenCalledWith('dont-show-again');
    });

    it('the close button hides the notice and reports it', () => {
        const onClose = jest.fn();
        const { getByLabelText, queryByText } = render(<RideViewRestrictionNotice notice={message} onAction={jest.fn()} onClose={onClose} />);

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(queryByText(TEXT)).toBeNull();
    });

    it('closes by itself after 12s', () => {
        jest.useFakeTimers();
        const onClose = jest.fn();
        const { queryByText } = render(<RideViewRestrictionNotice notice={message} onAction={jest.fn()} onClose={onClose} />);

        act(() => { jest.advanceTimersByTime(11999); });
        expect(onClose).not.toHaveBeenCalled();

        act(() => { jest.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(queryByText(TEXT)).toBeNull();
    });

    it('replacing the message by the acknowledgement keeps the original timer', () => {
        jest.useFakeTimers();
        const onClose = jest.fn();
        const { rerender, getByText } = render(<RideViewRestrictionNotice notice={message} onAction={jest.fn()} onClose={onClose} />);

        act(() => { jest.advanceTimersByTime(5000); });
        rerender(<RideViewRestrictionNotice notice={acknowledged} onAction={jest.fn()} onClose={onClose} />);
        expect(getByText("We won't show this again. Change this")).toBeTruthy();

        act(() => { jest.advanceTimersByTime(6999); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { jest.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows a notice with a new id again after one was closed', () => {
        const { getByLabelText, rerender, getByText } = render(<RideViewRestrictionNotice notice={message} onAction={jest.fn()} onClose={jest.fn()} />);
        fireEvent.press(getByLabelText('Close'));

        rerender(<RideViewRestrictionNotice notice={{ ...message, id: 4 }} onAction={jest.fn()} onClose={jest.fn()} />);

        expect(getByText(TEXT)).toBeTruthy();
    });
});
