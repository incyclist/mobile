import type { PairingHelperDisplayProps, PairingHelperReason, PairingHelperReasonProps } from 'incyclist-services'

// Fixtures with the page service's mobile copy, for tests and stories. Callbacks default to no-ops;
// pass spies (jest.fn() in tests, fn() in stories) to observe them.

type Noop = () => void
const noop: Noop = () => {}

const LABELS: Record<PairingHelperReason, string> = {
    asleep: "It's switched off or asleep",
    other_app: "It's connected to another app or device",
    interface: "Bluetooth isn't working",
    no_device: "I don't have a trainer, power meter or speed sensor",
    trainer_unavailable: "My trainer isn't available today",
    unsure: 'Something else / not sure',
}

const NO_TRAINER_REASONS: PairingHelperReason[] = ['asleep', 'other_app', 'interface', 'no_device', 'unsure']
const TRAINER_UNAVAILABLE_REASONS: PairingHelperReason[] = ['asleep', 'other_app', 'interface', 'trainer_unavailable', 'unsure']

export const MOCK_TIP_ASLEEP = {
    text: 'Most trainers and sensors go to sleep when idle. Pedal a few strokes or press a button on the device. We keep trying automatically.',
    shortText: 'Pedal a few strokes or press a button on it. We keep trying.',
}

export const MOCK_TIP_NO_DEVICE = {
    text: "To ride, Incyclist needs a smart trainer, a power meter or a speed sensor. A heart-rate monitor or cadence sensor alone isn't enough.",
    shortText: 'Riding needs a smart trainer, power meter or speed sensor.',
}

export const MOCK_TIP_TRAINER_UNAVAILABLE = {
    text: 'To ride without your trainer, Incyclist needs a power meter or speed sensor, and none is connected. Have one? Tap the Power or Speed tile to add it.',
    shortText: 'No power meter or speed sensor connected. Have one? Tap Power or Speed to add it.',
}

export interface MockHelperHandlers {
    onOpen?: Noop
    onDismiss?: Noop
    onSelect?: (id: PairingHelperReason) => void
    onAction?: Noop
}

const buildReasons = (ids: PairingHelperReason[], selected: PairingHelperReason | undefined, onSelect: (id: PairingHelperReason) => void): PairingHelperReasonProps[] =>
    ids.map(id => ({ id, label: LABELS[id], selected: id === selected, onSelect: () => onSelect(id) }))

/** No trainer configured: the helper as it opens, nothing picked yet. */
export const buildNoTrainerHelper = (h: MockHelperHandlers = {}): PairingHelperDisplayProps => ({
    phase: 'open',
    title: "Can't find your trainer?",
    subline: "Pick what fits best and we'll show you what to try.",
    reasons: buildReasons(NO_TRAINER_REASONS, undefined, h.onSelect ?? noop),
    footer: 'Still searching. Your tiles light up as soon as something is found.',
    onOpen: h.onOpen ?? noop,
    onDismiss: h.onDismiss ?? noop,
})

/** No trainer configured, "switched off or asleep" picked: a tip without an action. */
export const buildAsleepHelper = (h: MockHelperHandlers = {}): PairingHelperDisplayProps => ({
    ...buildNoTrainerHelper(h),
    subline: undefined,
    reasons: buildReasons(NO_TRAINER_REASONS, 'asleep', h.onSelect ?? noop),
    tip: MOCK_TIP_ASLEEP,
})

/** No trainer configured, "I don't have a device" picked: the tip with its note and pinned action. */
export const buildNoDeviceHelper = (h: MockHelperHandlers = {}): PairingHelperDisplayProps => ({
    ...buildNoTrainerHelper(h),
    subline: undefined,
    reasons: buildReasons(NO_TRAINER_REASONS, 'no_device', h.onSelect ?? noop),
    tip: MOCK_TIP_NO_DEVICE,
    action: { label: 'Browse routes for now', note: "You'll need one of these devices to start a ride.", onClick: h.onAction ?? noop },
})

/** The configured trainer can't be reached, "my trainer isn't available today" picked, no other sensor connected. */
export const buildTrainerUnavailableHelper = (h: MockHelperHandlers = {}): PairingHelperDisplayProps => ({
    phase: 'open',
    title: "Can't connect to your trainer?",
    reasons: buildReasons(TRAINER_UNAVAILABLE_REASONS, 'trainer_unavailable', h.onSelect ?? noop),
    tip: MOCK_TIP_TRAINER_UNAVAILABLE,
    action: { label: 'Ride with simulated power', onClick: h.onAction ?? noop },
    footer: 'Still trying to connect to your saved devices.',
    onOpen: h.onOpen ?? noop,
    onDismiss: h.onDismiss ?? noop,
})

/** A device made the row ready while the helper was open. */
export const buildResolvedHelper = (h: MockHelperHandlers = {}): PairingHelperDisplayProps => ({
    ...buildAsleepHelper(h),
    phase: 'resolved',
    resolvedText: 'Found it! Ready to ride.',
})
