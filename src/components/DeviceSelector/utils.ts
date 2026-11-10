import type { DimensionValue } from 'react-native'
import { textSizes } from '../../theme'

// about 480: wide enough for a device name at list-entry size
const TARGET_WIDTH = textSizes.listEntry * 0.6 * 40

// a phone in landscape is short: a conflict's rows get nearly the whole height, not the usual 80%
const CONFLICT_MAX_HEIGHT_COMPACT: DimensionValue = '94%'

/**
 * The width of the device list's dialog, which the dialog for a device found by the search shares.
 *
 * @param screenWidth the window's width
 */
export const getDeviceDialogWidth = (screenWidth: number): number => Math.min(0.9 * screenWidth, TARGET_WIDTH)

/**
 * The size of a dialog asking about a conflict: the device list's width, and on a phone nearly the
 * whole height.
 *
 * @param screenWidth the window's width
 * @param compact a phone's layout
 */
export const getConflictDialogStyle = (screenWidth: number, compact: boolean): { width: number, maxHeight?: DimensionValue } => {
    const width = getDeviceDialogWidth(screenWidth)
    return compact ? { width, maxHeight: CONFLICT_MAX_HEIGHT_COMPACT } : { width }
}
