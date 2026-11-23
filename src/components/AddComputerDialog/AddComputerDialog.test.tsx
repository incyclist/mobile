import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { EventEmitter } from 'node:events';
import { AddComputerDialog } from './AddComputerDialog';

const mockClient = new EventEmitter() as EventEmitter & Record<string, unknown>;
let mockDisplay: Record<string, unknown>;

const mockLogEvent = jest.fn();
const mockLogError = jest.fn();
jest.mock('../../hooks/logging', () => ({ useLogging: () => ({ logEvent: mockLogEvent, logError: mockLogError }) }));
jest.mock('incyclist-services', () => ({
    useLocalLinkClient: () => mockClient,
    useRouteSharingClient: () => ({ getRepo: () => ({ getForLink: () => [] }) }),
}));

const display = (pairing: Record<string, unknown>) => ({
    available: true,
    links: [],
    checking: false,
    recovery: { autoBrowsesUsed: 0, autoBrowsesMax: 3 },
    discovery: { phase: 'searching', computers: [], expiresAt: 0 },
    pairing,
});

describe('AddComputerDialog', () => {
    beforeEach(() => {
        mockLogError.mockClear();
        mockClient.removeAllListeners();
        mockDisplay = display({ step: 'idle' });
        mockClient.getDisplayProps = jest.fn(() => mockDisplay);
        mockClient.startSearch = jest.fn().mockResolvedValue({});
        mockClient.cancelSearch = jest.fn();
        mockClient.cancelPairing = jest.fn();
        mockClient.rename = jest.fn();
        mockClient.retryPairing = jest.fn().mockResolvedValue(undefined);
    });

    it('starts the search when opened and ends it when closed', () => {
        const onClose = jest.fn();
        const { getByText, unmount } = render(<AddComputerDialog onClose={onClose} />);
        expect(mockClient.startSearch).toHaveBeenCalledTimes(1);
        fireEvent.press(getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
        expect(mockClient.cancelSearch).toHaveBeenCalled();
        unmount();
        expect(mockClient.listenerCount('state-changed')).toBe(0);
    });

    it('renames the computer on Done if the name was changed', () => {
        mockDisplay = display({ step: 'connected', linkId: 'l1', name: 'Home PC' });
        const onClose = jest.fn();
        const { getByText, getByLabelText } = render(<AddComputerDialog onClose={onClose} />);
        fireEvent.changeText(getByLabelText('Name on this device'), 'Living room');
        fireEvent.press(getByText('Done'));
        expect(mockClient.rename).toHaveBeenCalledWith('l1', 'Living room');
        expect(onClose).toHaveBeenCalled();
    });

    it('does not rename on Done if the name is unchanged', () => {
        mockDisplay = display({ step: 'connected', linkId: 'l1', name: 'Home PC' });
        const { getByText } = render(<AddComputerDialog onClose={jest.fn()} />);
        fireEvent.press(getByText('Done'));
        expect(mockClient.rename).not.toHaveBeenCalled();
    });

    it('follows the pairing state of the service', () => {
        const { getByText } = render(<AddComputerDialog onClose={jest.fn()} />);
        act(() => {
            mockClient.emit('state-changed', display({ step: 'not-ready', computerId: 'c', name: 'Home PC' }));
        });
        expect(getByText("Home PC isn't ready to connect")).toBeTruthy();
        fireEvent.press(getByText('Try Again'));
        expect(mockClient.retryPairing).toHaveBeenCalled();
    });

    describe('never throws out of a handler or event callback', () => {
        it('contains a rejecting and a synchronously throwing startSearch/selectComputer/retryPairing', async () => {
            mockClient.startSearch = jest.fn().mockRejectedValue(new Error('search down'));
            const { getByText } = render(<AddComputerDialog onClose={jest.fn()} />);
            await act(async () => { await Promise.resolve(); });
            expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'search down' }), 'AddComputerDialog.startSearch');

            act(() => { mockClient.emit('state-changed', display({ step: 'not-ready', computerId: 'c', name: 'Home PC' })); });
            mockClient.retryPairing = jest.fn(() => { throw new Error('sync retry'); });
            expect(() => fireEvent.press(getByText('Try Again'))).not.toThrow();
            expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'sync retry' }), 'AddComputerDialog.handleRetry');
        });

        it('contains throwing cancel and rename/cancelPairing on Done, and still closes', () => {
            mockClient.cancelSearch = jest.fn(() => { throw new Error('cancel boom'); });
            const onClose = jest.fn();
            const { getByText } = render(<AddComputerDialog onClose={onClose} />);
            expect(() => fireEvent.press(getByText('Cancel'))).not.toThrow();
            expect(onClose).toHaveBeenCalled();
            expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'AddComputerDialog.handleCancel');
        });

        it('contains a throwing subscription and a throwing unsubscribe on unmount', () => {
            mockClient.cancelPairing = jest.fn(() => { throw new Error('unmount boom'); });
            const { unmount } = render(<AddComputerDialog onClose={jest.fn()} />);
            expect(() => unmount()).not.toThrow();
            expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'AddComputerDialog.unsubscribe');
        });
    });
});
