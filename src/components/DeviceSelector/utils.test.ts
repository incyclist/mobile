import { getConflictDialogStyle, getDeviceDialogWidth } from './utils'

describe('getDeviceDialogWidth', () => {
    it('is about 480 wide, but never more than 90% of the window', () => {
        expect(getDeviceDialogWidth(1280)).toBe(480)
        expect(getDeviceDialogWidth(500)).toBe(450)
    })
})

describe('getConflictDialogStyle', () => {
    it('on a phone, the conflict step fills the screen, without rounded corners', () => {
        expect(getConflictDialogStyle(667, true)).toEqual(expect.objectContaining({
            width: '100%', height: '100%', maxHeight: '100%', borderRadius: 0,
        }))
    })

    it('on a phone, keeps its content clear of a notch on either side, by the larger inset', () => {
        expect(getConflictDialogStyle(667, true, { left: 0, right: 32 })).toEqual(expect.objectContaining({
            paddingLeft: 32, paddingRight: 32,
        }))
        expect(getConflictDialogStyle(667, true)).toEqual(expect.objectContaining({
            paddingLeft: 0, paddingRight: 0,
        }))
    })

    it('on a tablet, keeps the device list\'s size', () => {
        expect(getConflictDialogStyle(1024, false)).toEqual({ width: 480 })
        expect(getConflictDialogStyle(1024, false, { left: 32, right: 0 })).toEqual({ width: 480 })
    })
})
