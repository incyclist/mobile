import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { RouteServersDialog } from './RouteServersDialog';
import { listProps, SERVER_ALPINE } from './RouteServersDialog.mock';

const mockService = {
    observer: undefined as any,
    open: jest.fn(),
    close: jest.fn(),
    getPageObserver: jest.fn(),
    getPageDisplayProps: jest.fn(),
    back: jest.fn(),
    showAdd: jest.fn(),
    requestRemove: jest.fn(),
    setManualUrl: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    getRouteServersSettingsPageService: () => mockService,
}));

jest.mock('../Dialog', () => {
    const { View } = require('react-native');
    return { Dialog: ({ children }: any) => <View>{children}</View> };
});

const newObserver = () => {
    const handlers: Record<string, Array<() => void>> = {};
    return {
        on: jest.fn((event: string, fn: () => void) => {
            (handlers[event] ??= []).push(fn);
        }),
        off: jest.fn((event: string, fn: () => void) => {
            handlers[event] = (handlers[event] ?? []).filter(h => h !== fn);
        }),
        emit: (event: string) => (handlers[event] ?? []).forEach(h => h()),
        count: (event: string) => (handlers[event] ?? []).length,
    };
};

describe('RouteServersDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockService.observer = newObserver();
        mockService.open.mockReturnValue(mockService.observer);
        mockService.getPageObserver.mockReturnValue(mockService.observer);
        mockService.getPageDisplayProps.mockReturnValue(listProps([SERVER_ALPINE]));
    });

    it('opens the page service with the origin and renders its display props', () => {
        const { getByText } = render(<RouteServersDialog origin="import" onClose={jest.fn()} />);

        expect(mockService.open).toHaveBeenCalledWith('import');
        expect(getByText('Alpine Videos')).toBeTruthy();
    });

    it('re-renders on page-update', () => {
        const { getByText, queryByText } = render(<RouteServersDialog origin="settings" onClose={jest.fn()} />);
        expect(queryByText('Ride with Jan')).toBeNull();

        mockService.getPageDisplayProps.mockReturnValue(
            listProps([SERVER_ALPINE, { ...SERVER_ALPINE, key: 'Ride with Jan', name: 'Ride with Jan' }])
        );
        act(() => mockService.observer.emit('page-update'));

        expect(getByText('Ride with Jan')).toBeTruthy();
    });

    it('forwards user actions to the page service', () => {
        const { getByText } = render(<RouteServersDialog origin="settings" onClose={jest.fn()} />);

        fireEvent.press(getByText('Remove'));
        expect(mockService.requestRemove).toHaveBeenCalledWith('Alpine Videos');
    });

    it('calls onClose when the page service closes the page', () => {
        const onClose = jest.fn();
        render(<RouteServersDialog origin="settings" onClose={onClose} />);

        act(() => mockService.observer.emit('closed'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes and closes the page service when unmounted while still open', () => {
        const onClose = jest.fn();
        const { unmount } = render(<RouteServersDialog origin="settings" onClose={onClose} />);

        unmount();

        expect(mockService.observer.count('page-update')).toBe(0);
        expect(mockService.observer.count('closed')).toBe(0);
        expect(mockService.close).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('does not close the page service again when it was closed by the service itself', () => {
        const { unmount } = render(<RouteServersDialog origin="settings" onClose={jest.fn()} />);

        mockService.getPageObserver.mockReturnValue(undefined);
        unmount();

        expect(mockService.close).not.toHaveBeenCalled();
    });
});
