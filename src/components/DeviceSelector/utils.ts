import { textSizes } from '../../theme'

// about 288 dp: wide enough for a device name at list-entry size
const TARGET_WIDTH = textSizes.listEntry * 0.6 * 40

/**
 * The width of the device list's dialog, which the dialog for a device found by the search shares.
 *
 * @param screenWidth the window's width
 */
export const getDeviceDialogWidth = (screenWidth: number): number => Math.min(0.9 * screenWidth, TARGET_WIDTH)
