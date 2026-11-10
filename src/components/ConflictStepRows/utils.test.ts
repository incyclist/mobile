import { getConflictQueuedNote, hasMoreBelow } from './utils'

describe('getConflictQueuedNote', () => {
    it('says nothing when no conflict waits', () => {
        expect(getConflictQueuedNote(0, true)).toBeUndefined()
        expect(getConflictQueuedNote(0, false)).toBeUndefined()
    })

    it('on a phone: "{n} more to check"', () => {
        expect(getConflictQueuedNote(1, true)).toBe('1 more to check')
        expect(getConflictQueuedNote(2, true)).toBe('2 more to check')
    })

    it('on a tablet: "{n} more devices to check", singular for one', () => {
        expect(getConflictQueuedNote(1, false)).toBe('1 more device to check')
        expect(getConflictQueuedNote(3, false)).toBe('3 more devices to check')
    })
})

describe('hasMoreBelow', () => {
    it('is false while the content fits', () => {
        expect(hasMoreBelow({ viewHeight: 200, contentHeight: 180, offset: 0 })).toBe(false)
    })

    it('is true while some content is below the visible part', () => {
        expect(hasMoreBelow({ viewHeight: 200, contentHeight: 260, offset: 0 })).toBe(true)
        expect(hasMoreBelow({ viewHeight: 200, contentHeight: 260, offset: 40 })).toBe(true)
    })

    it('is false once scrolled to the end, allowing for rounding', () => {
        expect(hasMoreBelow({ viewHeight: 200, contentHeight: 260, offset: 60 })).toBe(false)
        expect(hasMoreBelow({ viewHeight: 200, contentHeight: 260, offset: 58.5 })).toBe(false)
    })

    it('is false before the sizes are known', () => {
        expect(hasMoreBelow({ viewHeight: 0, contentHeight: 0, offset: 0 })).toBe(false)
    })
})
