import { renderHook } from '@testing-library/react-native';
import { useRidePageLifecycle } from './useRidePageLifecycle';

const mockClosePage = jest.fn();
const mockOpenPage = jest.fn();
const mockGetRideObserver = jest.fn(() => ({ on: jest.fn(), off: jest.fn() }));
const mockGetPageDisplayProps = jest.fn(() => ({ rideState: 'Active' }));
const mockGetGraphActuals = jest.fn(() => ({ power: [1], heartrate: [2], position: 5 }));
const mockOnMenuOpen = jest.fn();
const mockOnMenuClose = jest.fn();
const mockOnRetryStart = jest.fn();
const mockOnIgnoreStart = jest.fn();

let capturedHandlers: Record<string, (...args: any[]) => void> = {};

jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        openPage: (...args: any[]) => mockOpenPage(...args),
        closePage: mockClosePage,
        getRideObserver: mockGetRideObserver,
        getPageDisplayProps: mockGetPageDisplayProps,
        getGraphActuals: mockGetGraphActuals,
        onMenuOpen: mockOnMenuOpen,
        onMenuClose: mockOnMenuClose,
        onRetryStart: mockOnRetryStart,
        onIgnoreStart: mockOnIgnoreStart,
    }),
}));

describe('useRidePageLifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedHandlers = {};
        mockOpenPage.mockImplementation(() => ({
            on: jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; }),
            off: jest.fn(),
        }));
        mockGetPageDisplayProps.mockReturnValue({ rideState: 'Active' } as any);
    });

    it('opens the page on mount and reports the initial display props', () => {
        const onRideTypeChange = jest.fn();
        const { result } = renderHook(() => useRidePageLifecycle({ simulate: false, onRideTypeChange }));

        expect(mockOpenPage).toHaveBeenCalledWith(false);
        expect(result.current.displayProps).toEqual({ rideState: 'Active' });
    });

    it('forwards page-update and ride-type-update subscriptions to the caller', () => {
        const onRideTypeChange = jest.fn();
        renderHook(() => useRidePageLifecycle({ simulate: true, onRideTypeChange }));

        expect(capturedHandlers['page-update']).toBeDefined();
        expect(capturedHandlers['ride-type-update']).toBe(onRideTypeChange);
    });

    it('closes the page on unmount', () => {
        const { unmount } = renderHook(() => useRidePageLifecycle({ onRideTypeChange: jest.fn() }));
        unmount();
        expect(mockClosePage).toHaveBeenCalledTimes(1);
    });

    it('exposes handlers that delegate to the page service', () => {
        const { result } = renderHook(() => useRidePageLifecycle({ onRideTypeChange: jest.fn() }));

        result.current.onMenuOpen();
        result.current.onMenuClose();
        result.current.onRetryStart();
        result.current.onIgnoreStart();
        expect(result.current.getGraphActuals()).toEqual({ power: [1], heartrate: [2], position: 5 });

        expect(mockOnMenuOpen).toHaveBeenCalledTimes(1);
        expect(mockOnMenuClose).toHaveBeenCalledTimes(1);
        expect(mockOnRetryStart).toHaveBeenCalledTimes(1);
        expect(mockOnIgnoreStart).toHaveBeenCalledTimes(1);
    });
});
