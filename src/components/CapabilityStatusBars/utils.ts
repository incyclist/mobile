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
 * what the tile is for, while it's empty), how it relates to the trainer, and the tile's footer. The
 * bars only show on a phone, so the page service's footer copy is its phone variant.
 */
export const getBarStateLine = (tile: CapabilityDisplayProps): string => {
    const footer = tile.footerText?.short

    if (isSwitchedOff(tile))
        return [tile.deviceName, footer ?? tile.emptyFooter ?? 'Not used'].join(' · ')

    if (!tile.deviceName)
        return [tile.helpText?.short, footer ?? tile.emptyFooter].filter(Boolean).join(' · ')

    const value = tile.value ? [tile.value, tile.unit].filter(Boolean).join(' ') : undefined
    const state = footer ?? (tile.stateText ?? tile.connectState)?.toUpperCase()
    return [value, tile.deviceName, tile.roleLabel, state].filter(Boolean).join(' · ')
}

/**
 * The bar's look, in the tile colour language: green when connected, dimmed when switched off, the
 * amber outline while the page waits for it, grey otherwise.
 */
export const getBarLook = (tile: CapabilityDisplayProps): BarLook => {
    if (isSwitchedOff(tile))
        return 'dimmed'
    if (isConnected(tile))
        return 'connected'
    return tile.awaited ? 'waiting' : 'idle'
}

/** The optional row collapsed to one line: each tile's title, and whether it's connected. */
export const getOptionalSummary = (tiles: ReadonlyArray<CapabilityDisplayProps>): OptionalSummaryItem[] =>
    tiles.map(t => ({ title: t.title, connected: isConnected(t) }))
