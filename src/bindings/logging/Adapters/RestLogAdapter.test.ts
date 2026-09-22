// Covers what happens when a batch of REST log events fails to send. The events are already
// removed from RestLogAdapter's in-memory queue by the time the POST rejects (see
// loadFromMemoryCache in send()), so without persisting them somewhere they are gone for good -
// including, in the worst case, the crash event that triggered the send in the first place.

jest.mock('react-native-mmkv', () => {
    const stores = new Map<string, Map<string, string>>();

    return {
        createMMKV: ({ id }: { id: string }) => {
            if (!stores.has(id))
                stores.set(id, new Map());
            const store = stores.get(id)!;

            return {
                getString: (key: string) => store.get(key),
                set: (key: string, value: string) => { store.set(key, value); },
                remove: (key: string) => {
                    const had = store.has(key);
                    store.delete(key);
                    return had;
                },
                getAllKeys: () => Array.from(store.keys()),
            };
        },
    };
});

const mockPost = jest.fn();

jest.mock('../../../services', () => ({
    ApiClient: class {
        setUrl = jest.fn();
        post = mockPost;
    },
}));

import { RestLogAdapter } from './RestLogAdapter';
import { getRestLogFallbackStore, resetRestLogFallbackStore, RestLogFallbackStore, MAX_FALLBACK_ENTRIES } from './RestLogFallbackStore';

describe('RestLogAdapter', () => {

    beforeEach(() => {
        mockPost.mockReset();
        // The mocked MMKV backing store is keyed by id and outlives resetRestLogFallbackStore()
        // (which only replaces the JS singleton wrapper) - drain it first so a previous test's
        // persisted entries don't leak into this one.
        getRestLogFallbackStore().drain();
        resetRestLogFallbackStore();
    });

    // startWorker() schedules a setInterval - stop it so a failing test doesn't leave a timer
    // running and firing unexpected additional sends.
    const newAdapter = () => new RestLogAdapter({ sendInterval: 0 });

    describe('send() failure', () => {
        it('persists the batch to the fallback store instead of dropping it', async () => {
            mockPost.mockRejectedValue(new Error('network down'));

            const adapter = newAdapter();
            adapter.log('mq', { message: 'mqtt connected' });
            adapter.log('Incyclist', { message: 'crash in main window', isFatal: true });

            await adapter.send(true);

            const persisted = getRestLogFallbackStore().drain();
            expect(persisted).toEqual([
                { context: 'mq', event: { message: 'mqtt connected' } },
                { context: 'Incyclist', event: { message: 'crash in main window', isFatal: true } },
            ]);
        });

        it('reports the persisted count as the file stat instead of the hardcoded 0', async () => {
            mockPost.mockRejectedValue(new Error('network down'));

            const adapter = newAdapter();
            adapter.log('mq', { message: 'one' });
            adapter.log('mq', { message: 'two' });

            const stats: any = await adapter.send(true);

            expect(stats.file).toBe(2);
            expect(stats.processed).toBe(0);
        });

        it('does not touch the fallback store on a successful send', async () => {
            mockPost.mockResolvedValue({ count: 1 });

            const adapter = newAdapter();
            adapter.log('mq', { message: 'mqtt connected' });

            const stats: any = await adapter.send(true);

            expect(stats.file).toBe(0);
            expect(getRestLogFallbackStore().size).toBe(0);
        });

        it('leaves nothing in memory to double-send after a failure - the batch only lives in the fallback store', async () => {
            mockPost.mockRejectedValue(new Error('network down'));

            const adapter = newAdapter();
            adapter.log('mq', { message: 'mqtt connected' });

            const stats: any = await adapter.send(true);

            expect(stats.mem).toBe(0);
        });
    });

    describe('RestLogFallbackStore bounding', () => {
        it('drops the oldest entries once the cap is reached', () => {
            const store = new RestLogFallbackStore(3, 'test_bounded_1');

            [1, 2, 3, 4, 5].forEach((n) => store.persist([{ context: 'mq', event: { message: `event ${n}` } }]));

            const entries = store.drain();
            expect(entries).toHaveLength(3);
            expect(entries.map((e) => e.event.message)).toEqual(['event 3', 'event 4', 'event 5']);
        });

        it('defaults to a cap of 200', () => {
            const store = new RestLogFallbackStore(undefined, 'test_bounded_2');

            for (let i = 0; i < MAX_FALLBACK_ENTRIES + 50; i++) {
                store.persist([{ context: 'mq', event: { message: `event ${i}` } }]);
            }

            expect(store.size).toBe(MAX_FALLBACK_ENTRIES);
        });

        it('stays bounded at 200 under repeated failed sends from the adapter itself', async () => {
            mockPost.mockRejectedValue(new Error('network down'));

            const adapter = newAdapter();

            // 210 events across 21 separate failed batches - well past the cap, and split
            // across multiple sends so this also exercises repeated persist() calls, not just
            // one oversized batch.
            for (let batch = 0; batch < 21; batch++) {
                for (let i = 0; i < 10; i++) {
                    adapter.log('mq', { message: `batch ${batch} event ${i}` });
                }
                await adapter.send(true);
            }

            expect(getRestLogFallbackStore().size).toBe(MAX_FALLBACK_ENTRIES);

            const entries = getRestLogFallbackStore().drain();
            // Oldest dropped first: the earliest surviving entry is from the 2nd batch (10
            // events already dropped), not the 1st.
            expect(entries[0].event.message).toBe('batch 1 event 0');
            expect(entries[entries.length - 1].event.message).toBe('batch 20 event 9');
        });
    });
});
