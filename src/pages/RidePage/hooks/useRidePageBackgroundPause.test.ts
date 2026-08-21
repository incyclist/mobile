import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useRidePageBackgroundPause } from './useRidePageBackgroundPause';

describe('useRidePageBackgroundPause', () => {
    it('pauses the page when the app goes to background and resumes on foreground', () => {
        const mockPausePage = jest.fn();
        const mockResumePage = jest.fn();
        const refService = { current: { pausePage: mockPausePage, resumePage: mockResumePage } } as any;

        renderHook(() => useRidePageBackgroundPause(refService));

        const listener = (AppState.addEventListener as jest.Mock).mock.calls.at(-1)[1];

        listener('background');
        expect(mockPausePage).toHaveBeenCalledTimes(1);
        expect(mockResumePage).not.toHaveBeenCalled();

        listener('active');
        expect(mockResumePage).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the service ref is not set yet', () => {
        const refService = { current: null } as any;
        renderHook(() => useRidePageBackgroundPause(refService));

        const listener = (AppState.addEventListener as jest.Mock).mock.calls.at(-1)[1];
        expect(() => listener('background')).not.toThrow();
    });

    it('removes the subscription on unmount', () => {
        const refService = { current: { pausePage: jest.fn(), resumePage: jest.fn() } } as any;
        const { unmount } = renderHook(() => useRidePageBackgroundPause(refService));

        const subscription = (AppState.addEventListener as jest.Mock).mock.results.at(-1)?.value;
        unmount();
        expect(subscription.remove).toHaveBeenCalledTimes(1);
    });
});
