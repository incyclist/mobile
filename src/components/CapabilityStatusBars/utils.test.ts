import type { CapabilityDisplayProps } from 'incyclist-services'
import { getBarLook, getBarStateLine, getOptionalSummary } from './utils'

const tile = (props: Partial<CapabilityDisplayProps> = {}): CapabilityDisplayProps => ({
    title: 'Power', capability: 'power', deviceName: undefined, role: 'required', awaited: false, onClick: jest.fn(), ...props,
})

describe('getBarStateLine', () => {
    it('an empty tile: what it is, then its footer', () => {
        const t = tile({ helpText: { full: 'Power meter', short: 'Power meter' }, emptyFooter: 'Searching…' })
        expect(getBarStateLine(t)).toBe('Power meter · Searching…')
    })

    it('a connected tile: value, device, state', () => {
        const t = tile({ deviceName: 'Stages Power', value: '154', unit: 'W', connectState: 'connected' })
        expect(getBarStateLine(t)).toBe('154 W · Stages Power · CONNECTED')
    })

    it('a found device shows its state text instead of the connect state', () => {
        const t = tile({ deviceName: 'Stages Power', connectState: 'connecting', stateText: 'Found' })
        expect(getBarStateLine(t)).toBe('Stages Power · FOUND')
    })

    it('a switched-off tile: the remembered device, then its footer', () => {
        const t = tile({ deviceName: 'Tacx Flux', disabled: true, emptyFooter: 'Not used', connectState: 'connected', value: '100', unit: 'W' })
        expect(getBarStateLine(t)).toBe('Tacx Flux · Not used')
    })

    it('a switched-off tile without a footer still says it is not used', () => {
        expect(getBarStateLine(tile({ deviceName: 'Tacx Flux', disabled: true }))).toBe('Tacx Flux · Not used')
    })

    it("the page service's footer copy replaces the state, in its phone variant", () => {
        const t = tile({
            deviceName: 'Stages Power', value: '0', unit: 'W', connectState: 'connected',
            footerText: { full: 'CONNECTED · can replace trainer', short: 'Can replace trainer' },
        })
        expect(getBarStateLine(t)).toBe('0 W · Stages Power · Can replace trainer')
    })

    it("the page service's footer copy replaces an empty tile's footer", () => {
        const t = tile({ helpText: { full: 'Power meter', short: 'Power meter' }, emptyFooter: 'Searching…', footerText: { full: 'Optional for now', short: 'Optional for now' } })
        expect(getBarStateLine(t)).toBe('Power meter · Optional for now')
    })

    it('a tile the trainer fills says so after the device', () => {
        const t = tile({
            deviceName: 'Tacx Flux', connectState: 'failed', roleLabel: 'via your trainer',
            footerText: { full: 'Waiting for trainer', short: 'Via trainer' },
        })
        expect(getBarStateLine(t)).toBe('Tacx Flux · via your trainer · Via trainer')
    })
})

describe('getBarLook', () => {
    it('follows the tile colour language', () => {
        expect(getBarLook(tile({ deviceName: 'Stages Power', connectState: 'connected' }))).toBe('connected')
        expect(getBarLook(tile({ deviceName: 'Tacx Flux', disabled: true }))).toBe('dimmed')
        expect(getBarLook(tile({ awaited: true }))).toBe('waiting')
        expect(getBarLook(tile({ awaited: false }))).toBe('idle')
        expect(getBarLook(tile({ deviceName: 'Tacx Flux', connectState: 'connecting' }))).toBe('idle')
    })

    it('the amber outline follows whether the page waits for the tile', () => {
        expect(getBarLook(tile({ deviceName: 'Tacx Flux', connectState: 'failed', awaited: true }))).toBe('waiting')
        expect(getBarLook(tile({ deviceName: 'Tacx Flux', connectState: 'failed', awaited: false }))).toBe('idle')
    })
})

describe('getOptionalSummary', () => {
    it('lists the optional tiles, marking the connected ones', () => {
        const tiles = [
            tile({ title: 'Heartrate', capability: 'heartrate', role: 'optional', deviceName: 'HRM', connectState: 'connected' }),
            tile({ title: 'Cadence', capability: 'cadence', role: 'optional' }),
            tile({ title: 'Controller', capability: 'app_control', role: 'optional', deviceName: 'Zwift Play', connectState: 'connecting' }),
        ]
        expect(getOptionalSummary(tiles)).toEqual([
            { title: 'Heartrate', connected: true },
            { title: 'Cadence', connected: false },
            { title: 'Controller', connected: false },
        ])
    })

    it('a switched-off tile is never marked connected', () => {
        const tiles = [tile({ title: 'Heartrate', capability: 'heartrate', deviceName: 'HRM', connectState: 'connected', disabled: true })]
        expect(getOptionalSummary(tiles)).toEqual([{ title: 'Heartrate', connected: false }])
    })
})
