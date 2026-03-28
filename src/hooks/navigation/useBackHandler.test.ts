import { renderHook } from '@testing-library/react-native';
import { useBackHandler } from './useBackHandler';

const mockLogEvent = jest.fn();
jest.mock('../logging', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}));

const mockAddListener = jest.fn();
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        addListener: mockAddListener,
    }),
}));

describe('useBackHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAddListener.mockReturnValue(jest.fn()); // unsubscribe return value
    });

    const fireListener = (event: { preventDefault: jest.Mock }) => {
        const listener = mockAddListener.mock.calls[0][1];
        listener(event);
    };

    it('logs back navigation pressed in all cases', () => {
        renderHook(() => useBackHandler({ onBack: () => true }));
        fireListener({ preventDefault: jest.fn() });
        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'back navigation pressed',
            eventSource: 'user',
        });
    });

    it('calls e.preventDefault() when onBack returns true', () => {
        const mockService = { onBack: jest.fn(() => true) };
        renderHook(() => useBackHandler(mockService));
        const mockPreventDefault = jest.fn();
        fireListener({ preventDefault: mockPreventDefault });
        expect(mockService.onBack).toHaveBeenCalled();
        expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('does not call e.preventDefault() when onBack returns false', () => {
        const mockService = { onBack: jest.fn(() => false) };
        renderHook(() => useBackHandler(mockService));
        const mockPreventDefault = jest.fn();
        fireListener({ preventDefault: mockPreventDefault });
        expect(mockService.onBack).toHaveBeenCalled();
        expect(mockPreventDefault).not.toHaveBeenCalled();
    });

    it('does not call e.preventDefault() when onBack is absent', () => {
        renderHook(() => useBackHandler({}));
        const mockPreventDefault = jest.fn();
        fireListener({ preventDefault: mockPreventDefault });
        expect(mockPreventDefault).not.toHaveBeenCalled();
    });
});