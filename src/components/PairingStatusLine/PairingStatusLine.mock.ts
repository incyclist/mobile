import type { PairingStatusDisplayProps } from 'incyclist-services'

// Status lines with the page service's copy, for tests and stories.

export const MOCK_STATUS_SEARCHING: PairingStatusDisplayProps = {
    id: 'S5',
    text: 'Searching for devices… Tip: pedal a few strokes to wake up your trainer.',
    shortText: 'Searching… Pedal to wake your trainer.',
    stateOnlyText: 'Searching for devices…',
    shortStateOnlyText: 'Searching…',
    dot: 'amber',
}

export const MOCK_STATUS_STILL_SEARCHING: PairingStatusDisplayProps = {
    id: 'S6',
    text: 'Still searching…',
    shortText: 'Still searching',
    stateOnlyText: 'Still searching…',
    shortStateOnlyText: 'Still searching',
    link: "Can't find your trainer?",
    shortLink: 'Need help?',
    dot: 'amber',
}

export const MOCK_STATUS_TRAINER_CONNECTING: PairingStatusDisplayProps = {
    id: 'S3',
    text: 'Connecting to your trainer Tacx Flux…',
    shortText: 'Connecting to Tacx Flux…',
    stateOnlyText: 'Connecting to your trainer Tacx Flux…',
    shortStateOnlyText: 'Connecting to Tacx Flux…',
    dot: 'amber',
}

export const MOCK_STATUS_TRAINER_UNAVAILABLE: PairingStatusDisplayProps = {
    id: 'S7',
    text: "Can't reach your trainer Tacx Flux. Pedal a few strokes to wake it up.",
    shortText: "Can't reach Tacx Flux. Pedal to wake it",
    stateOnlyText: "Can't reach your trainer Tacx Flux.",
    shortStateOnlyText: "Can't reach Tacx Flux.",
    link: 'Not available today?',
    shortLink: 'Not available?',
    dot: 'amber',
}

export const MOCK_STATUS_BLUETOOTH_OFF: PairingStatusDisplayProps = {
    id: 'S1b',
    text: "Bluetooth is off, so most trainers won't show up.",
    shortText: 'Bluetooth is off.',
    stateOnlyText: "Bluetooth is off, so most trainers won't show up.",
    shortStateOnlyText: 'Bluetooth is off.',
    link: 'Bluetooth settings',
    shortLink: 'Settings',
    dot: 'amber',
}
