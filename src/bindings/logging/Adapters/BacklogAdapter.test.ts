import { BacklogAdapter, getLogBacklog, resetLogBacklog, MAX_BACKLOG_ENTRIES } from './BacklogAdapter';

describe('BacklogAdapter', () => {

    afterEach(() => {
        resetLogBacklog();
    });

    describe('retaining', () => {
        it('keeps the events it is given', () => {
            const backlog = new BacklogAdapter();

            backlog.log('mq', { message: 'mqtt connected', uri: 'wss://host/ws' });
            backlog.log('Incyclist', { message: 'Initializing App' });

            expect(backlog.drain()).toEqual([
                { context: 'mq', event: { message: 'mqtt connected', uri: 'wss://host/ws' } },
                { context: 'Incyclist', event: { message: 'Initializing App' } },
            ]);
        });

        it('copies the event, so an adapter mutating its own copy cannot corrupt the backlog', () => {
            const backlog = new BacklogAdapter();
            const event: any = { message: 'mqtt connected', ts: '2026-08-19T00:00:00.000Z' };

            backlog.log('mq', event);

            // The console adapter deletes these off the event it is handed.
            delete event.ts;
            delete event.message;

            expect(backlog.drain()[0].event).toEqual({
                message: 'mqtt connected', ts: '2026-08-19T00:00:00.000Z',
            });
        });

        it('ignores undefined context or event rather than throwing', () => {
            const backlog = new BacklogAdapter();

            expect(() => backlog.log(undefined as any, { message: 'x' })).not.toThrow();
            expect(() => backlog.log('mq', undefined)).not.toThrow();
            expect(backlog.size).toBe(0);
        });
    });

    describe('bounded growth', () => {
        it('drops the oldest events once the cap is reached', () => {
            const backlog = new BacklogAdapter(3);

            [1, 2, 3, 4, 5].forEach((n) => backlog.log('mq', { message: `event ${n}` }));

            const entries = backlog.drain();
            expect(entries).toHaveLength(3);
            expect(entries.map((e) => e.event.message)).toEqual(['event 3', 'event 4', 'event 5']);
        });

        it('defaults to a sane cap', () => {
            const backlog = new BacklogAdapter();

            for (let i = 0; i < MAX_BACKLOG_ENTRIES + 50; i++) {
                backlog.log('mq', { message: `event ${i}` });
            }

            expect(backlog.size).toBe(MAX_BACKLOG_ENTRIES);
        });
    });

    describe('handover', () => {
        it('stops retaining once drained, so it costs nothing for the rest of the session', () => {
            const backlog = new BacklogAdapter();
            backlog.log('mq', { message: 'early' });

            expect(backlog.drain()).toHaveLength(1);
            expect(backlog.isRetaining).toBe(false);

            backlog.log('mq', { message: 'later' });
            expect(backlog.size).toBe(0);
        });

        it('a second drain returns nothing rather than repeating the first', () => {
            const backlog = new BacklogAdapter();
            backlog.log('mq', { message: 'early' });

            backlog.drain();
            expect(backlog.drain()).toEqual([]);
        });

        it('stop() releases everything without handing it over', () => {
            const backlog = new BacklogAdapter();
            backlog.log('mq', { message: 'early' });

            backlog.stop();

            expect(backlog.size).toBe(0);
            expect(backlog.isRetaining).toBe(false);
            expect(backlog.drain()).toEqual([]);
        });
    });

    describe('singleton', () => {
        it('hands the same instance to the registrar and the consumer', () => {
            expect(getLogBacklog()).toBe(getLogBacklog());
        });
    });
});
