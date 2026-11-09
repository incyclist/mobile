import type { PairingButtonProps } from 'incyclist-services'

// Fixtures for tests and stories: every button set the page service gives the Pairing page, with the
// labels it uses (OK/Skip outside a ride, Start/Cancel when pairing for a ride). Callbacks resolve to
// nothing; tests and stories that want to observe a press build their own set.

type Button = PairingButtonProps[number]

const noop = async () => {}
const button = (label: string, primary: boolean): Button => ({ label, primary, onClick: noop })

export const MOCK_PAIRING_BUTTON_SETS: Record<string, PairingButtonProps> = {
    'searching, something to ride with found': [button('Stop searching', true), button('Skip', false)],
    'searching for a ride, something to ride with found': [button('Stop searching', true), button('Cancel', false)],
    'ready': [button('OK', true)],
    'ready for a ride': [button('Start', true)],
    'ready, search ended without a trainer': [button('OK', true), button('Search again', false)],
    'ready for a ride, search ended without a trainer': [button('Start', true), button('Search again', false)],
    'not ready, nothing found': [button('Search again', true), button('Skip', false)],
    'not ready': [button('Skip', true)],
    'not ready for a ride, nothing found': [button('Search again', true), button('Simulate', false), button('Cancel', false)],
    'not ready for a ride': [button('Simulate', true), button('Cancel', false)],
}
