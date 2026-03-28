import { renderHook } from '@testing-library/react-hooks';
import { useBackHandler } from './useBackHandler';
import { NavigationAction } from '@react-navigation/native'; // Required for mock event type

// Mock useLogging
const mockLogEvent = jest.fn();
jest.mock('../../hooks/logging', () => ({ // Path adjusted relative to test file
    useLogging: () => ({ logEvent: mockLogEvent }),
}));

// Mock useNavigation
const mockAddListener = jest.fn();
const mockNavigation = {
    addListener: mockAddListener,
};
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

describe('useBackHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('logs back navigation pressed in all cases', () => {
        const mockService = { onBack: () => true };
        renderHook(() => useBackHandler(mockService));

        // Get the listener function that was passed to navigation.addListener
        const listener = mockAddListener.mock.calls[0][1];
        const mockEvent = {
            preventDefault: jest.fn(),
            data: {
                action: { type: 'GO_BACK' } as NavigationAction,
            },
            target: undefined,
        };
        listener(mockEvent);

        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'back navigation pressed',
            eventSource: 'user',
        });

        // Test case where onBack is absent (ensure logging still fires)
        mockLogEvent.mockClear();
        renderHook(() => useBackHandler({}));
        const listenerNoOnBack = mockAddListener.mock.calls[1][1]; // Get the new listener
        listenerNoOnBack(mockEvent);
        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'back navigation pressed',
            eventSource: 'user',
        });
    });

    it('calls e.preventDefault() when onBack returns true', () => {
        const mockService = { onBack: jest.fn(() => true) };
        const { unmount } = renderHook(() => useBackHandler(mockService));

        const listener = mockAddListener.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' } as NavigationAction,
            },
            target: undefined,
        };
        listener(mockEvent);

        expect(mockService.onBack).toHaveBeenCalled();
        expect(mockPreventDefault).toHaveBeenCalled();
        unmount();
    });

    it('does not call e.preventDefault() when onBack returns false', () => {
        const mockService = { onBack: jest.fn(() => false) };
        const { unmount } = renderHook(() => useBackHandler(mockService));

        const listener = mockAddListener.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' } as NavigationAction,
            },
            target: undefined,
        };
        listener(mockEvent);

        expect(mockService.onBack).toHaveBeenCalled();
        expect(mockPreventDefault).not.toHaveBeenCalled();
        unmount();
    });

    it('does not call e.preventDefault() when onBack is absent', () => {
        const mockService = {}; // onBack is absent
        const { unmount } = renderHook(() => useBackHandler(mockService));

        const listener = mockAddListener.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' } as NavigationAction,
            },
            target: undefined,
        };
        listener(mockEvent);

        expect(mockPreventDefault).not.toHaveBeenCalled();
        unmount();
    });
});