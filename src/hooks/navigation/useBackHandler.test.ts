import { renderHook } from '@testing-library/react-native'; // Correct import
import { useBackHandler } from './useBackHandler';

// Mock useLogging
const mockLogEvent = jest.fn();
jest.mock('../../hooks/logging', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}));

// The global mock in jest.config.js handles '@react-navigation/native', so local mock is removed.

describe('useBackHandler', () => {
    // We need to re-mock useNavigation for each test to ensure a fresh listener mock
    // if tests modify it, or we rely on the global mock from jest.config.js for setup
    // and clear its internal state with jest.clearAllMocks().
    // Assuming the global mock setup in jest.config.js is sufficient,
    // we will rely on it and clear mocks.

    // Access the globally mocked useNavigation to retrieve its addListener method
    // when needed for tests, e.g., to get the listener function.
    let navigation;
    let addListenerSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        // Dynamically import useNavigation after mocks are setup
        const { useNavigation: actualUseNavigation } = require('@react-navigation/native');
        navigation = actualUseNavigation();
        addListenerSpy = navigation.addListener;
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
        renderHook(() => useBackHandler({}));
        // Since each renderHook in a new test uses a fresh call to useNavigation,
        // addListenerSpy needs to be updated.
        const { useNavigation: actualUseNavigation } = require('@react-navigation/native');
        navigation = actualUseNavigation();
        addListenerSpy = navigation.addListener;
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