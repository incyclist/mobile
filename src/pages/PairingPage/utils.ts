import type { InterfaceDisplayProps, PairingHelperDisplayProps, PairingStatusDisplayProps } from 'incyclist-services'

// on these states the link points at the Bluetooth settings; every other link asks for help
const SETTINGS_LINK_STATUS = new Set<PairingStatusDisplayProps['id']>(['S1', 'S1b'])

/**
 * What the status line's link does: a settings link opens the Bluetooth interface settings (the same
 * dialog the Bluetooth icon opens), any other link opens the helper.
 *
 * @returns the handler, or `undefined` if the line has no link or there's nothing it could open
 */
export const getStatusLinkHandler = (
    status: PairingStatusDisplayProps | undefined,
    helper: PairingHelperDisplayProps | undefined,
    interfaces: ReadonlyArray<InterfaceDisplayProps> | undefined,
): (() => void) | undefined => {
    if (!status?.link && !status?.shortLink)
        return undefined

    if (SETTINGS_LINK_STATUS.has(status.id))
        return interfaces?.find(i => i.name === 'ble')?.onClick

    return helper?.onOpen
}
