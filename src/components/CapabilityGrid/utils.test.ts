import type { CapabilityDisplayProps } from 'incyclist-services'
import { isTileWaiting } from './utils'

const tile = (props: Partial<CapabilityDisplayProps> = {}): CapabilityDisplayProps => ({
    title: 'Power', capability: 'power', deviceName: undefined, role: 'required', onClick: jest.fn(), ...props,
})

const searching = { readyToStart: false, noSearch: false }

describe('isTileWaiting', () => {
    it('an empty required tile waits while the row is not ready', () => {
        expect(isTileWaiting(tile(), searching)).toBe(true)
    })

    it('an empty optional tile never waits', () => {
        expect(isTileWaiting(tile({ role: 'optional', capability: 'heartrate' }), searching)).toBe(false)
    })

    it('nothing waits once the row is ready, or while nothing can search', () => {
        expect(isTileWaiting(tile(), { readyToStart: true, noSearch: false })).toBe(false)
        expect(isTileWaiting(tile(), { readyToStart: false, noSearch: true })).toBe(false)
    })

    it('a switched-off tile never waits', () => {
        expect(isTileWaiting(tile({ disabled: true }), searching)).toBe(false)
        expect(isTileWaiting(tile({ capability: 'control', deviceName: 'Tacx Flux', disabled: true }), { ...searching, pairingCase: 'trainer-unavailable' })).toBe(false)
    })

    it('a required tile with a device does not wait in the no-trainer case', () => {
        expect(isTileWaiting(tile({ deviceName: 'Stages Power', connectState: 'connecting' }), { ...searching, pairingCase: 'no-trainer' })).toBe(false)
    })

    it('the Resistance tile waits for the configured trainer while it connects or cannot be reached', () => {
        const trainer = tile({ title: 'Resistance', capability: 'control', deviceName: 'Tacx Flux' })
        expect(isTileWaiting(trainer, { ...searching, pairingCase: 'trainer-connecting' })).toBe(true)
        expect(isTileWaiting(trainer, { ...searching, pairingCase: 'trainer-unavailable' })).toBe(true)
        expect(isTileWaiting(trainer, { ...searching, pairingCase: 'trainer-connected' })).toBe(false)
    })

    it('other slots holding the trainer do not wait for it', () => {
        expect(isTileWaiting(tile({ deviceName: 'Tacx Flux' }), { ...searching, pairingCase: 'trainer-unavailable' })).toBe(false)
    })
})
