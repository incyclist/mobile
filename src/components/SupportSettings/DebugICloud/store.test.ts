let mockStorage: Map<string, string>;

jest.mock('react-native-mmkv', () => ({
    createMMKV: jest.fn(() => ({
        set: (k: string, v: string) => mockStorage.set(k, v),
        getString: (k: string) => mockStorage.get(k),
        delete: (k: string) => mockStorage.delete(k),
    })),
}));

import { debugICloudStore } from './store';

describe('debugICloudStore', () => {
    beforeEach(() => {
        mockStorage = new Map();
    });

    it('round-trips a pick without a bookmark', () => {
        debugICloudStore.savePick({ folder: '/a/b', files: ['x.mp4', 'y.xml'] });

        expect(debugICloudStore.getFolder()).toBe('/a/b');
        expect(debugICloudStore.getFiles()).toEqual(['x.mp4', 'y.xml']);
        expect(debugICloudStore.getBookmark()).toBeUndefined();
    });

    it('round-trips a pick with a bookmark', () => {
        debugICloudStore.savePick({ folder: '/a/b', files: ['x.mp4'], bookmark: 'BOOKMARK' });

        expect(debugICloudStore.getBookmark()).toBe('BOOKMARK');
    });

    it('setBookmark overwrites a previously stored bookmark (e.g. after a renewal)', () => {
        debugICloudStore.savePick({ folder: '/a/b', files: [], bookmark: 'OLD' });
        debugICloudStore.setBookmark('NEW');

        expect(debugICloudStore.getBookmark()).toBe('NEW');
    });

    it('stores the captured bookmark independently of the picked-folder bookmark', () => {
        debugICloudStore.savePick({ folder: '/a/b', files: [], bookmark: 'PICKED' });
        debugICloudStore.setCapturedBookmark('CAPTURED');

        expect(debugICloudStore.getBookmark()).toBe('PICKED');
        expect(debugICloudStore.getCapturedBookmark()).toBe('CAPTURED');
    });

    it('stores the largest-video path independently', () => {
        debugICloudStore.setLargestVideo('/a/b/big.mp4');

        expect(debugICloudStore.getLargestVideo()).toBe('/a/b/big.mp4');
    });

    it('returns undefined/empty defaults when nothing has been stored yet', () => {
        expect(debugICloudStore.getFolder()).toBeUndefined();
        expect(debugICloudStore.getFiles()).toEqual([]);
        expect(debugICloudStore.getBookmark()).toBeUndefined();
        expect(debugICloudStore.getCapturedBookmark()).toBeUndefined();
        expect(debugICloudStore.getLargestVideo()).toBeUndefined();
    });

    it('getFiles tolerates corrupted stored JSON', () => {
        mockStorage.set('files', 'not-json');

        expect(debugICloudStore.getFiles()).toEqual([]);
    });
});
