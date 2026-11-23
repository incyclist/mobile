import { renderHook, act } from '@testing-library/react-native';
import { EventEmitter } from 'node:events';
import { useRouteCopyState } from './useRouteCopyState';

const mockLogEvent = jest.fn();
const mockLogError = jest.fn();
jest.mock('../../hooks/logging', () => ({ useLogging: () => ({ logEvent: mockLogEvent, logError: mockLogError }) }));

const mockService = new EventEmitter() as any;
const mockSharing = { getRowsForRoute: jest.fn() };
jest.mock('incyclist-services', () => ({
    useRouteCopy: () => mockService,
    useRouteSharingClient: () => mockSharing,
}));

describe('useRouteCopyState never throws', () => {
    beforeEach(() => {
        mockLogError.mockClear();
        mockService.removeAllListeners();
        mockService.getState = jest.fn(() => ({ status: 'idle' }));
        mockService.copyToDevice = jest.fn().mockResolvedValue(undefined);
        mockService.cancel = jest.fn();
        mockService.clear = jest.fn();
        mockSharing.getRowsForRoute.mockReturnValue([{ size: 10 }]);
    });

    it('logs and survives a failing size lookup', () => {
        mockSharing.getRowsForRoute.mockImplementation(() => { throw new Error('rows boom'); });
        const { result } = renderHook(() => useRouteCopyState('r1', true));
        expect(result.current.sizeBytes).toBeUndefined();
        expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'rows boom' }), 'getShareSize');
    });

    it('contains a rejecting and a synchronously throwing copyToDevice', async () => {
        const { result } = renderHook(() => useRouteCopyState('r1', true));
        mockService.copyToDevice = jest.fn().mockRejectedValue(new Error('copy down'));
        act(() => result.current.copy());
        await act(async () => { await Promise.resolve(); });
        expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'copy down' }), 'copyToDevice');

        mockService.copyToDevice = jest.fn(() => { throw new Error('sync copy'); });
        expect(() => act(() => result.current.copy())).not.toThrow();
        expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: 'sync copy' }), 'copyToDevice');
    });

    it('contains throwing cancel and clear', () => {
        const { result } = renderHook(() => useRouteCopyState('r1', true));
        mockService.cancel = jest.fn(() => { throw new Error('cancel boom'); });
        mockService.clear = jest.fn(() => { throw new Error('clear boom'); });
        expect(() => result.current.cancel()).not.toThrow();
        expect(() => result.current.clear()).not.toThrow();
        expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'cancel');
        expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'clear');
    });

    it('contains a failing subscription and unsubscription', () => {
        mockService.on = jest.fn(() => { throw new Error('on boom'); });
        mockService.off = jest.fn(() => { throw new Error('off boom'); });
        const { unmount } = renderHook(() => useRouteCopyState('r1', true));
        expect(() => unmount()).not.toThrow();
        expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'useRouteCopyState.subscribe');
        expect(mockLogError).toHaveBeenCalledWith(expect.anything(), 'useRouteCopyState.unsubscribe');
        delete mockService.on;
        delete mockService.off;
    });
});
