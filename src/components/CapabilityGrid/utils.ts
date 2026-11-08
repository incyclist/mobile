import type { CapabilityDisplayProps, PairingCase } from 'incyclist-services'

export interface TileWaitingContext {
    readyToStart?: boolean
    /** nothing can search */
    noSearch?: boolean
    pairingCase?: PairingCase
}

// while a configured trainer connects or can't be reached, the Resistance tile is the one the page waits for
const TRAINER_WAITING_CASES = new Set<PairingCase>(['trainer-connecting', 'trainer-unavailable'])

/**
 * Whether a tile gets the amber "the page is waiting for this one" outline: an empty required tile
 * while the row isn't ready, and the configured trainer's Resistance tile while it connects or can't
 * be reached. Never on a switched-off tile, once the row is ready, or while nothing can search.
 */
export const isTileWaiting = (tile: CapabilityDisplayProps, ctx: TileWaitingContext): boolean => {
    if (tile.disabled || ctx.readyToStart || ctx.noSearch)
        return false
    if (!tile.deviceName)
        return tile.role === 'required'
    return tile.capability === 'control' && ctx.pairingCase !== undefined && TRAINER_WAITING_CASES.has(ctx.pairingCase)
}
