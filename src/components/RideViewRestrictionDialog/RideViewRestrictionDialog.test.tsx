import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideViewRestrictionDialog } from './RideViewRestrictionDialog';

const dialog = {
    title: 'Street View in simulated rides',
    body: 'Body text',
    options: [
        {
            id: 'device' as const,
            text: 'To get Street View: connect your smart trainer.',
            discard: {
                label: 'Discard ride and connect a device',
                confirm: { question: 'Discard this simulated ride?', confirmLabel: 'Discard and connect', cancelLabel: 'Keep riding' },
            },
        },
    ],
    reminder: { label: 'Remind me in simulated rides', checked: true },
};

const renderDialog = (props = {}) => {
    const handlers = { onClose: jest.fn(), onDiscard: jest.fn(), onReminderChanged: jest.fn() };
    const result = render(<RideViewRestrictionDialog dialog={dialog} {...handlers} {...props} />);
    return { ...result, ...handlers };
};

describe('RideViewRestrictionDialog', () => {
    it('renders the body and the device hint, without any key content', () => {
        const { getByText, queryByText } = renderDialog();

        expect(getByText('Body text')).toBeTruthy();
        expect(getByText('To get Street View: connect your smart trainer.')).toBeTruthy();
        expect(queryByText(/key/i)).toBeNull();
    });

    it('Close reports to the caller', () => {
        const { getByText, onClose } = renderDialog();

        fireEvent.press(getByText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('asks for one confirmation before discarding', () => {
        const { getByText, onDiscard } = renderDialog();

        fireEvent.press(getByText('Discard ride and connect a device'));

        expect(onDiscard).not.toHaveBeenCalled();
        expect(getByText('Discard this simulated ride?')).toBeTruthy();

        fireEvent.press(getByText('Discard and connect'));
        expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('"Keep riding" returns to the normal state', () => {
        const { getByText, queryByText, onDiscard } = renderDialog();

        fireEvent.press(getByText('Discard ride and connect a device'));
        fireEvent.press(getByText('Keep riding'));

        expect(onDiscard).not.toHaveBeenCalled();
        expect(queryByText('Discard this simulated ride?')).toBeNull();
        expect(getByText('Discard ride and connect a device')).toBeTruthy();
    });

    it('offers no discard when no ride is running', () => {
        const { queryByText } = renderDialog({
            dialog: { ...dialog, options: [{ id: 'device', text: 'To get Street View: connect your smart trainer.' }], reminder: undefined },
        });

        expect(queryByText('Discard ride and connect a device')).toBeNull();
    });
});
