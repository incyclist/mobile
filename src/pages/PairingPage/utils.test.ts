import type { InterfaceDisplayProps, PairingHelperDisplayProps, PairingStatusDisplayProps } from 'incyclist-services'
import { getStatusLinkHandler } from './utils'

const status = (id: PairingStatusDisplayProps['id'], link?: string): PairingStatusDisplayProps => ({
    id, text: 'text', shortText: 'short', link, shortLink: link, dot: 'amber',
})

const helper = (onOpen = jest.fn()): PairingHelperDisplayProps => ({
    phase: 'hidden', title: 'Can\'t find your trainer?', reasons: [], footer: 'footer', onOpen, onDismiss: jest.fn(),
})

const ble = (onClick = jest.fn()): InterfaceDisplayProps => ({ name: 'ble', state: 'error', onClick })

describe('getStatusLinkHandler', () => {
    it('a help link opens the helper', () => {
        const onOpen = jest.fn()
        const handler = getStatusLinkHandler(status('S6', 'Need help?'), helper(onOpen), [ble()])
        handler?.()
        expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('the trainer link opens the helper', () => {
        const onOpen = jest.fn()
        const handler = getStatusLinkHandler(status('S7', 'Not available?'), helper(onOpen), [ble()])
        handler?.()
        expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('a settings link opens the Bluetooth interface settings, not the helper', () => {
        const onOpen = jest.fn()
        const onClick = jest.fn()
        const handler = getStatusLinkHandler(status('S1b', 'Settings'), helper(onOpen), [{ name: 'wifi', state: 'idle', onClick: jest.fn() }, ble(onClick)])
        handler?.()
        expect(onClick).toHaveBeenCalledTimes(1)
        expect(onOpen).not.toHaveBeenCalled()
    })

    it('no link, no handler', () => {
        expect(getStatusLinkHandler(status('S5'), helper(), [ble()])).toBeUndefined()
    })

    it('a help link without a helper has no handler', () => {
        expect(getStatusLinkHandler(status('S6', 'Need help?'), undefined, [ble()])).toBeUndefined()
    })

    it('a settings link without a Bluetooth interface has no handler', () => {
        expect(getStatusLinkHandler(status('S1', 'Settings'), helper(), [])).toBeUndefined()
    })
})
