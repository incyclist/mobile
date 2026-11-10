import type { ConflictChoice, ConflictStepProps, ConflictStepRowProps, TIncyclistCapability } from 'incyclist-services'

// Fixtures with the page service's copy, for tests and stories. Callbacks default to no-ops; pass
// spies (jest.fn() in tests, fn() in stories) to observe them.

type Noop = () => void
const noop: Noop = () => {}

export interface MockConflictHandlers {
    onChoice?: (capability: TIncyclistCapability, choice: ConflictChoice) => void
    onDone?: Noop
    onDismiss?: Noop
}

const NEW_DEVICE = 'Tacx Neo 2T'

// the page service's copy for two conflicts waiting
const QUEUED_TWO = { full: '2 more devices to check', short: '2 more to check' }

const row = (capability: TIncyclistCapability, capabilityTitle: string, currentName: string, choice: ConflictChoice = 'keep'): ConflictStepRowProps => ({
    capability,
    capabilityTitle,
    currentName,
    choice,
    keepLabel: `Keep ${currentName}`,
    replaceLabel: `Use ${NEW_DEVICE}`,
})

/** A trainer found by the search wants Power and Cadence, which other devices already hold. */
export const buildDetectionConflict = (h: MockConflictHandlers = {}, choices: Partial<Record<TIncyclistCapability, ConflictChoice>> = {}): ConflictStepProps => ({
    id: 'conflict-1',
    origin: 'detection',
    deviceName: NEW_DEVICE,
    title: `${NEW_DEVICE} can also measure more`,
    subline: {
        full: `We just found your ${NEW_DEVICE}. Nothing changes until you choose. Resistance was free and now uses ${NEW_DEVICE}.`,
        short: `Just found ${NEW_DEVICE}. Nothing changes until you choose.`,
    },
    rows: [
        row('power', 'Power', 'Stages Power', choices.power),
        row('cadence', 'Cadence', 'Wahoo RPM', choices.cadence),
    ],
    queued: 0,
    onChoice: h.onChoice ?? noop,
    onDone: h.onDone ?? noop,
    onDismiss: h.onDismiss ?? noop,
})

/** A power meter found by the search wants Cadence only, which another device already holds. */
export const buildSingleRowDetectionConflict = (h: MockConflictHandlers = {}): ConflictStepProps => {
    const conflict = buildDetectionConflict(h)
    return { ...conflict, rows: conflict.rows.filter(r => r.capability === 'cadence') }
}

/** A trainer found by the search wants Power, Speed and Cadence, all held by other devices, with two more conflicts waiting. */
export const buildThreeRowDetectionConflict = (h: MockConflictHandlers = {}): ConflictStepProps => {
    const conflict = buildDetectionConflict(h)
    return {
        ...conflict,
        rows: [conflict.rows[0], row('speed', 'Speed', 'Wahoo Speed'), conflict.rows[1]],
        queued: 2,
        queuedText: QUEUED_TWO,
    }
}

/** The same conflict, with two more waiting behind it. */
export const buildQueuedDetectionConflict = (h: MockConflictHandlers = {}): ConflictStepProps => ({
    ...buildDetectionConflict(h),
    queued: 2,
    queuedText: QUEUED_TWO,
})

/** The rider picked a trainer in the Resistance list, and it would take Power, Speed and Cadence from other devices. */
export const buildManualConflict = (h: MockConflictHandlers = {}, choices: Partial<Record<TIncyclistCapability, ConflictChoice>> = {}): ConflictStepProps => ({
    id: 'conflict-2',
    origin: 'manual',
    deviceName: NEW_DEVICE,
    title: `${NEW_DEVICE} can also measure more`,
    subline: {
        full: 'Choose which device to use for each.',
        short: 'Choose which device to use for each.',
    },
    rows: [
        row('power', 'Power', 'Stages Power', choices.power),
        row('speed', 'Speed', 'Wahoo Speed', choices.speed),
        row('cadence', 'Cadence', 'Wahoo RPM', choices.cadence),
    ],
    queued: 0,
    onChoice: h.onChoice ?? noop,
    onDone: h.onDone ?? noop,
    onDismiss: h.onDismiss ?? noop,
})
