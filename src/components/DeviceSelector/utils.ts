import type { ViewStyle } from 'react-native'
import { textSizes } from '../../theme'

// about 480: wide enough for a device name at list-entry size
const TARGET_WIDTH = textSizes.listEntry * 0.6 * 40

export interface SideInsets {
    left: number
    right: number
}

const NO_INSETS: SideInsets = { left: 0, right: 0 }

/**
 * The width of the device list's dialog, which the dialog for a device found by the search shares.
 *
 * @param screenWidth the window's width
 */
export const getDeviceDialogWidth = (screenWidth: number): number => Math.min(0.9 * screenWidth, TARGET_WIDTH)

/**
 * The size of a dialog asking about a conflict. On a phone it fills the screen: a phone in landscape
 * is too short for more than two rows in the device list's box, and the full width lets each row's
 * two choices sit on one line without wrapping. Its content keeps clear of a notch on either side.
 * On a tablet it keeps the device list's size.
 *
 * @param screenWidth the window's width
 * @param compact a phone's layout
 * @param insets the safe-area insets left and right (the app is landscape-locked, so the notch is on a side)
 */
export const getConflictDialogStyle = (screenWidth: number, compact: boolean, insets: SideInsets = NO_INSETS): ViewStyle => {
    if (!compact)
        return { width: getDeviceDialogWidth(screenWidth) }

    const sidePad = Math.max(insets.left, insets.right)
    return {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        borderRadius: 0,
        paddingLeft: sidePad,
        paddingRight: sidePad,
    }
}
