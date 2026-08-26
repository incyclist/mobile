import { getCountdownBucket, hasStepJustStarted } from './utils';

describe('getCountdownBucket', () => {
    it('returns null when remaining is null (no known duration for this step)', () => {
        expect(getCountdownBucket(null, 30)).toBeNull();
    });

    it('returns null when duration is 0 (falsy) even with a small remaining', () => {
        expect(getCountdownBucket(2, 0)).toBeNull();
    });

    it('returns null when duration is negative', () => {
        expect(getCountdownBucket(2, -5)).toBeNull();
    });

    it('returns null when remaining is exactly 0', () => {
        expect(getCountdownBucket(0, 30)).toBeNull();
    });

    it('returns null when remaining is negative', () => {
        expect(getCountdownBucket(-1, 30)).toBeNull();
    });

    it('returns null when remaining is above 4 seconds', () => {
        expect(getCountdownBucket(4.01, 30)).toBeNull();
    });

    it('returns 4 at exactly remaining=4', () => {
        expect(getCountdownBucket(4, 30)).toBe(4);
    });

    it('returns 4 for a fractional remaining just under 4', () => {
        expect(getCountdownBucket(3.5, 30)).toBe(4);
    });

    it('returns 1 for a fractional remaining just above 0', () => {
        expect(getCountdownBucket(0.2, 30)).toBe(1);
    });

    it('returns 1 at exactly remaining=1', () => {
        expect(getCountdownBucket(1, 30)).toBe(1);
    });

    it('returns 3 and 2 at their exact boundaries', () => {
        expect(getCountdownBucket(3, 30)).toBe(3);
        expect(getCountdownBucket(2, 30)).toBe(2);
    });
});

describe('hasStepJustStarted', () => {
    it('returns false when remaining is null', () => {
        expect(hasStepJustStarted(null, 10)).toBe(false);
    });

    it('returns false when prevRemaining is null (first tick, nothing to compare against)', () => {
        expect(hasStepJustStarted(10, null)).toBe(false);
    });

    it('returns false for a normal countdown tick (remaining decreasing)', () => {
        expect(hasStepJustStarted(9.5, 10)).toBe(false);
    });

    it('returns false for a decrease exactly at the jitter guard boundary', () => {
        expect(hasStepJustStarted(9.5, 9.6)).toBe(false);
    });

    it('returns false for a tiny float-jitter increase within the 0.5s guard', () => {
        expect(hasStepJustStarted(9.3, 9.29)).toBe(false);
    });

    it('returns true when remaining jumps up by more than 0.5s (a new, longer step just started)', () => {
        expect(hasStepJustStarted(30, 0.2)).toBe(true);
    });

    it('returns true exactly at the 0.5s+epsilon boundary', () => {
        expect(hasStepJustStarted(10.51, 10)).toBe(true);
    });

    it('returns false exactly at the 0.5s boundary (not strictly greater)', () => {
        expect(hasStepJustStarted(10.5, 10)).toBe(false);
    });
});
