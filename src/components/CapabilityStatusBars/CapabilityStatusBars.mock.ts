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
    awaited: role === 'required',
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
        { ...OPTIONAL_ROW[0], deviceName: 'HRM Dual', value: '72', unit: 'bpm', connectState: 'connected', awaited: false },
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
    // while the trainer connects, the page waits for its Resistance tile
    awaited: capability === 'control',
    onClick: noop,
})

/** A configured trainer that's still connecting (it fills Resistance, Power and Speed). */
export const MOCK_CAPABILITIES_TRAINER_CONNECTING: Capabilities = {
    top: [trainerIn('Resistance', 'control', 'connecting'), trainerIn('Power', 'power', 'connecting'), trainerIn('Speed', 'speed', 'connecting')],
    bottom: OPTIONAL_ROW,
    rowLabels: { top: { text: 'TO RIDE', subtext: 'connecting to your trainer' }, bottom: OPTIONAL_LABEL },
}

const viaTrainer = (title: string, capability: CapabilityDisplayProps['capability']): CapabilityDisplayProps => ({
    ...trainerIn(title, capability, 'failed'),
    trainerRole: 'via-trainer',
    roleLabel: 'via your trainer',
    footerText: { full: 'Waiting for trainer', short: 'Via trainer' },
    awaited: false,
})

/** A configured trainer that can't be reached: its attempt failed, background retries go on. */
export const MOCK_CAPABILITIES_TRAINER_UNAVAILABLE: Capabilities = {
    ...MOCK_CAPABILITIES_TRAINER_CONNECTING,
    top: [
        {
            ...trainerIn('Resistance', 'control', 'failed'),
            trainerRole: 'trainer',
            roleLabel: 'Your trainer',
            footerText: { full: 'Not connected · waiting', short: 'Waiting…' },
            awaited: true,
        },
        viaTrainer('Power', 'power'),
        viaTrainer('Speed', 'speed'),
    ],
    rowLabels: { top: { text: 'TO RIDE', subtext: 'waiting for your trainer' }, bottom: OPTIONAL_LABEL },
}

const dimmedTrainerIn = (title: string, capability: CapabilityDisplayProps['capability']): CapabilityDisplayProps => ({
    ...trainerIn(title, capability, 'failed'),
    trainerRole: 'via-trainer',
    footerText: { full: 'Not used', short: 'Not used' },
    dimmed: true,
    awaited: false,
})

/**
 * The trainer can't be reached and the rider chose to ride on a separate power meter: Resistance and
 * the other tile still holding the trainer are dimmed, and a tap on Resistance takes the trainer back.
 */
export const MOCK_CAPABILITIES_FALLBACK: Capabilities = {
    top: [
        {
            ...trainerIn('Resistance', 'control', 'failed'),
            trainerRole: 'trainer',
            roleLabel: 'Your trainer',
            footerText: { full: 'Tap to use again', short: 'Tap to use again' },
            dimmed: true,
            awaited: false,
        },
        { title: 'Power', capability: 'power', deviceName: 'Stages Power', interface: 'ble', role: 'required', value: '154', unit: 'W', connectState: 'connected', awaited: false, onClick: noop, onUnselect: noop },
        dimmedTrainerIn('Speed', 'speed'),
    ],
    bottom: [
        OPTIONAL_ROW[0],
        { ...dimmedTrainerIn('Cadence', 'cadence'), role: 'optional' },
        OPTIONAL_ROW[2],
    ],
    rowLabels: { top: { text: '✓ READY TO RIDE' }, bottom: OPTIONAL_LABEL },
}

/** Ready: a power meter connected, Resistance switched off with its trainer remembered. */
export const MOCK_CAPABILITIES_SWITCHED_OFF: Capabilities = {
    top: [
        { ...trainerIn('Resistance', 'control', undefined), disabled: true, emptyFooter: 'Not used', awaited: false },
        { title: 'Power', capability: 'power', deviceName: 'Stages Power', role: 'required', value: '154', unit: 'W', connectState: 'connected', awaited: false, onClick: noop },
        // nothing is waited for once the row is ready
        { ...empty('Speed', 'speed', 'Speed sensor', 'required'), awaited: false },
    ],
    bottom: OPTIONAL_ROW,
    rowLabels: { top: { text: '✓ READY TO RIDE' }, bottom: OPTIONAL_LABEL },
}
