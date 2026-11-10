import type { CapabilityDisplayProps } from 'incyclist-services'

export type BarLook = 'connected' | 'waiting' | 'dimmed' | 'idle'

export interface OptionalSummaryItem {
    title: string
    connected: boolean
}

export const isSwitchedOff = (tile: CapabilityDisplayProps): boolean => Boolean(tile.deviceName) && Boolean(tile.disabled)

/**
 * A device is there but deliberately not used right now (the ride falls back to another device while
 * the trainer isn't available). It looks like a switched-off tile, but it isn't switched off: it has
 * no switch, and a tap does whatever the page service set as the tile's `onClick`.
 */
export const isDimmed = (tile: CapabilityDisplayProps): boolean => Boolean(tile.deviceName) && Boolean(tile.dimmed)

export const isConnected =(tile: CapabilityDisplayProps): boolean =>
    Boolean(tile.deviceName) && !tile.disabled && !tile.dimmed && tile.connectState === 'connected'

/**
 * The one state line of a status bar, from the same props the tile shows: the value, the device (or
 * what the tile is for, while it's empty), how it relates to the trainer, and the tile's footer. The
 * bars only show on a phone, so the page service's footer copy is its phone variant.
 */
export const getBarStateLine = (tile: CapabilityDisplayProps): string => {
    const footer = tile.footerText?.short

    if (isSwitchedOff(tile))
        return [tile.deviceName, footer ?? tile.emptyFooter ?? 'Not used'].join(' · ')

    // no value and no connect state: the device isn't used, the footer copy says what a tap does
    if (isDimmed(tile))
        return [tile.deviceName, tile.roleLabel, footer ?? tile.emptyFooter].filter(Boolean).join(' · ')

    if (!tile.deviceName)
        return [tile.helpText?.short, footer ?? tile.emptyFooter].filter(Boolean).join(' · ')

    const value = tile.value ? [tile.value, tile.unit].filter(Boolean).join(' ') : undefined
    const state = footer ?? (tile.stateText ?? tile.connectState)?.toUpperCase()
    return [value, tile.deviceName, tile.roleLabel, state].filter(Boolean).join(' · ')
}

/**
 * The bar's look, in the tile colour language: green when connected, dimmed when switched off or not
 * used while the ride falls back to another device, the amber outline while the page waits for it,
 * grey otherwise.
 */
export const getBarLook = (tile: CapabilityDisplayProps): BarLook => {
    if (isSwitchedOff(tile) || isDimmed(tile))
        return 'dimmed'
    if (isConnected(tile))
        return 'connected'
    return tile.awaited ? 'waiting' : 'idle'
}

/** The optional row collapsed to one line: each tile's title, and whether it's connected. */
export const getOptionalSummary = (tiles: ReadonlyArray<CapabilityDisplayProps>): OptionalSummaryItem[] =>
    tiles.map(t => ({ title: t.title, connected: isConnected(t) }))
