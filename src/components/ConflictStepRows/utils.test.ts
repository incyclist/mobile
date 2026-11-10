import { hasMoreBelow } from './utils'

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
