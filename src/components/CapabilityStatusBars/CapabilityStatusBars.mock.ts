import type { CapabilityDisplayProps } from 'incyclist-services'

// Fixtures with the page service's mobile copy, for tests and stories.

type Capabilities = {
    top: CapabilityDisplayProps[]
    bottom: CapabilityDisplayProps[]
    rowLabels: { top: { text: string, subtext?: string }, bottom: { text: string, subtext?: string } }
}

const noop = () => {}

const empty = (title: string, capability: CapabilityDisplayProps['capability'], what: string, role: 'required' | 'optional'): CapabilityDisplayProps => ({
    title,
    capability,
    deviceName: undefined,
    role,
    helpText: { full: what, short: what },
    emptyFooter: role === 'required' ? 'Searching…' : 'Optional',
    onClick: noop,
})

const OPTIONAL_ROW: CapabilityDisplayProps[] = [
    empty('Heartrate', 'heartrate', 'Heart-rate monitor', 'optional'),
    empty('Cadence', 'cadence', 'Cadence sensor', 'optional'),
    empty('Controller', 'app_control', 'Remote buttons', 'optional'),
]

const OPTIONAL_LABEL = { text: 'OPTIONAL', subtext: 'extras, not needed' }

/** No trainer configured, nothing found yet. */
export const MOCK_CAPABILITIES_SEARCHING: Capabilities = {
    top: [
        empty('Resistance', 'control', 'Smart trainer', 'required'),
        empty('Power', 'power', 'Power meter', 'required'),
        empty('Speed', 'speed', 'Speed sensor', 'required'),
    ],
    bottom: OPTIONAL_ROW,
    rowLabels: { top: { text: 'TO RIDE', subtext: 'connect any one' }, bottom: OPTIONAL_LABEL },
}

/** No trainer configured, only a heart-rate monitor connected. */
export const MOCK_CAPABILITIES_HEARTRATE_ONLY: Capabilities = {
    ...MOCK_CAPABILITIES_SEARCHING,
    bottom: [
        { ...OPTIONAL_ROW[0], deviceName: 'HRM Dual', value: '72', unit: 'bpm', connectState: 'connected' },
        OPTIONAL_ROW[1],
        OPTIONAL_ROW[2],
    ],
}

const trainerIn = (title: string, capability: CapabilityDisplayProps['capability'], connectState: CapabilityDisplayProps['connectState']): CapabilityDisplayProps => ({
    title,
    capability,
    deviceName: 'Tacx Flux',
    interface: 'ble',
    role: 'required',
    connectState,
    onClick: noop,
})

/** A configured trainer that's still connecting (it fills Resistance, Power and Speed). */
export const MOCK_CAPABILITIES_TRAINER_CONNECTING: Capabilities = {
    top: [trainerIn('Resistance', 'control', 'connecting'), trainerIn('Power', 'power', 'connecting'), trainerIn('Speed', 'speed', 'connecting')],
    bottom: OPTIONAL_ROW,
    rowLabels: { top: { text: 'TO RIDE', subtext: 'connecting to your trainer' }, bottom: OPTIONAL_LABEL },
}

/** A configured trainer that can't be reached: its attempt failed, background retries go on. */
export const MOCK_CAPABILITIES_TRAINER_UNAVAILABLE: Capabilities = {
    ...MOCK_CAPABILITIES_TRAINER_CONNECTING,
    top: [trainerIn('Resistance', 'control', 'failed'), trainerIn('Power', 'power', 'failed'), trainerIn('Speed', 'speed', 'failed')],
}

/** Ready: a power meter connected, Resistance switched off with its trainer remembered. */
export const MOCK_CAPABILITIES_SWITCHED_OFF: Capabilities = {
    top: [
        { ...trainerIn('Resistance', 'control', undefined), disabled: true, emptyFooter: 'Not used' },
        { title: 'Power', capability: 'power', deviceName: 'Stages Power', role: 'required', value: '154', unit: 'W', connectState: 'connected', onClick: noop },
        empty('Speed', 'speed', 'Speed sensor', 'required'),
    ],
    bottom: OPTIONAL_ROW,
    rowLabels: { top: { text: '✓ READY TO RIDE' }, bottom: OPTIONAL_LABEL },
}
