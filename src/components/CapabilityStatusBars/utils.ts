import type { CapabilityDisplayProps } from 'incyclist-services'

export type BarLook = 'connected' | 'waiting' | 'dimmed' | 'idle'

export interface OptionalSummaryItem {
    title: string
    connected: boolean
}

const isSwitchedOff = (tile: CapabilityDisplayProps): boolean => Boolean(tile.deviceName) && Boolean(tile.disabled)

const isConnected = (tile: CapabilityDisplayProps): boolean =>
    Boolean(tile.deviceName) && !tile.disabled && tile.connectState === 'connected'

/**
 * The one state line of a status bar, from the same props the tile shows: the value, the device (or
 * what the tile is for, while it's empty) and the tile's footer.
 */
export const getBarStateLine = (tile: CapabilityDisplayProps): string => {
    if (isSwitchedOff(tile))
        return [tile.deviceName, tile.emptyFooter ?? 'Not used'].join(' · ')

    if (!tile.deviceName)
        return [tile.helpText?.short, tile.emptyFooter].filter(Boolean).join(' · ')

    const value = tile.value ? [tile.value, tile.unit].filter(Boolean).join(' ') : undefined
    const state = (tile.stateText ?? tile.connectState)?.toUpperCase()
    return [value, tile.deviceName, state].filter(Boolean).join(' · ')
}

/**
 * The bar's look, in the tile colour language: green when connected, dimmed when switched off, the
 * amber outline while the page waits for it, grey otherwise.
 *
 * @param waiting the page waits for this tile
 */
export const getBarLook = (tile: CapabilityDisplayProps, waiting: boolean): BarLook => {
    if (isSwitchedOff(tile))
        return 'dimmed'
    if (isConnected(tile))
        return 'connected'
    return waiting ? 'waiting' : 'idle'
}

/** The optional row collapsed to one line: each tile's title, and whether it's connected. */
export const getOptionalSummary = (tiles: ReadonlyArray<CapabilityDisplayProps>): OptionalSummaryItem[] =>
    tiles.map(t => ({ title: t.title, connected: isConnected(t) }))
