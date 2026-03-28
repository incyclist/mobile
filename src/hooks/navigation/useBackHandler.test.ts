import { renderHook } from '@testing-library/react-native'; // Correct import
import { useBackHandler } from './useBackHandler';
import { useNavigation } from '@react-navigation/native'; // Import for typing

// Mock useLogging
const mockLogEvent = jest.fn();
jest.mock('../../hooks/logging', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}));

describe('useBackHandler', () => {
    let navigation: ReturnType<typeof useNavigation>;
    let addListenerSpy: jest.Mock; // Declare with explicit type

    beforeEach(() => {
        jest.clearAllMocks();
        // Dynamically import useNavigation after mocks are setup
        const { useNavigation: actualUseNavigation } = require('@react-navigation/native');
        navigation = actualUseNavigation();
        addListenerSpy = navigation.addListener as jest.Mock; // Cast to jest.Mock
        addListenerSpy.mockReturnValue(jest.fn()); // restore the unsubscribe return value
    });


    it('logs back navigation pressed in all cases', () => {
        const mockService = { onBack: () => true };
        renderHook(() => useBackHandler(mockService));

        // Get the listener function that was passed to navigation.addListener
        const listener = addListenerSpy.mock.calls[0][1];
        const mockEvent = {
            preventDefault: jest.fn(),
            data: {
                action: { type: 'GO_BACK' },
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
        addListenerSpy.mockClear(); // Clear addListener calls for the next renderHook within this test
        renderHook(() => useBackHandler({}));
        const listenerNoOnBack = addListenerSpy.mock.calls[0][1]; // Get the new listener
        listenerNoOnBack(mockEvent);
        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'back navigation pressed',
            eventSource: 'user',
        });
    });

    it('calls e.preventDefault() when onBack returns true', () => {
        const mockService = { onBack: jest.fn(() => true) };
        const { unmount } = renderHook(() => useBackHandler(mockService));

        const listener = addListenerSpy.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' },
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

        const listener = addListenerSpy.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' },
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

        const listener = addListenerSpy.mock.calls[0][1];
        const mockPreventDefault = jest.fn();
        const mockEvent = {
            preventDefault: mockPreventDefault,
            data: {
                action: { type: 'GO_BACK' },
            },
            target: undefined,
        };
        listener(mockEvent);

        expect(mockPreventDefault).not.toHaveBeenCalled();
        unmount();
    });
});