import { getConflictDialogStyle, getDeviceDialogWidth } from './utils'

describe('getDeviceDialogWidth', () => {
    it('is about 480 wide, but never more than 90% of the window', () => {
        expect(getDeviceDialogWidth(1280)).toBe(480)
        expect(getDeviceDialogWidth(500)).toBe(450)
    })
})

describe('getConflictDialogStyle', () => {
    it('on a phone, lets a conflict dialog take nearly the whole height, so more rows fit', () => {
        expect(getConflictDialogStyle(667, true)).toEqual({ width: 480, maxHeight: '94%' })
    })

    it('on a tablet, keeps the dialog\'s usual height', () => {
        expect(getConflictDialogStyle(1024, false)).toEqual({ width: 480 })
    })
})
