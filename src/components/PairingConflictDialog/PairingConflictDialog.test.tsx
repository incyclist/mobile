import React from 'react'
import { act, render, fireEvent } from '@testing-library/react-native'
import { Modal, TouchableWithoutFeedback } from 'react-native'
import { PairingConflictDialog, ARMING_DELAY_MS } from './PairingConflictDialog'
import {
    buildDetectionConflict, buildQueuedDetectionConflict, buildSingleRowDetectionConflict,
} from '../ConflictStepRows/ConflictStepRows.mock'

const mockLogEvent = jest.fn()
jest.mock('../../hooks', () => ({
    ...jest.requireActual('../../hooks'),
    useLogging: () => ({ logEvent: mockLogEvent, logError: jest.fn() }),
}))

const mockDimensions = { width: 800, height: 360 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}
const PHONE: [number, number] = [800, 360]
const TABLET: [number, number] = [1280, 800]

const arm = () => act(() => { jest.advanceTimersByTime(ARMING_DELAY_MS) })

// the dialog's outside area is the outermost TouchableWithoutFeedback; the inner one only stops taps on the dialog itself
const tapOutside = (root: ReturnType<typeof render>['UNSAFE_root']) => {
    root.findAllByType(TouchableWithoutFeedback)[0].props.onPress()
}
const pressBack = (root: ReturnType<typeof render>['UNSAFE_root']) => {
    root.findByType(Modal).props.onRequestClose()
}

describe('PairingConflictDialog', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        setDimensions(...PHONE)
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.clearAllMocks()
    })

    it('shows the title, the phone subline and the rows on a phone', () => {
        const conflict = buildDetectionConflict()
        const { getByText, queryByText, getAllByText } = render(<PairingConflictDialog conflict={conflict} />)

        expect(getByText('Tacx Neo 2T can also measure more')).toBeTruthy()
        expect(getByText('Just found Tacx Neo 2T. Nothing changes until you choose.')).toBeTruthy()
        expect(queryByText(conflict.subline.full)).toBeNull()
        expect(getByText('Keep Stages Power')).toBeTruthy()
        expect(getByText('Keep Wahoo RPM')).toBeTruthy()
        expect(getAllByText('Use Tacx Neo 2T')).toHaveLength(2)
    })

    it('shows the full subline on a tablet', () => {
        setDimensions(...TABLET)
        const conflict = buildDetectionConflict()
        const { getByText, queryByText } = render(<PairingConflictDialog conflict={conflict} />)

        expect(getByText(conflict.subline.full)).toBeTruthy()
        expect(queryByText(conflict.subline.short)).toBeNull()
    })

    it('shows a single row', () => {
        const { getByText, queryByText, getAllByRole } = render(<PairingConflictDialog conflict={buildSingleRowDetectionConflict()} />)

        expect(getByText('Keep Wahoo RPM')).toBeTruthy()
        expect(queryByText('Keep Stages Power')).toBeNull()
        expect(getAllByRole('radio')).toHaveLength(2)
    })

    it('says how many more conflicts wait, only when it is given', () => {
        const queued = render(<PairingConflictDialog conflict={buildQueuedDetectionConflict()} />)
        expect(queued.getByText('2 more')).toBeTruthy()
        queued.unmount()

        const single = render(<PairingConflictDialog conflict={buildDetectionConflict()} />)
        expect(single.queryByText(/^\d+ more$/)).toBeNull()
    })

    it('marks each row\'s choice as given: Keep unless the rider picked otherwise', () => {
        const { getByLabelText } = render(<PairingConflictDialog conflict={buildDetectionConflict({}, { cadence: 'replace' })} />)

        expect(getByLabelText('Power: Keep Stages Power').props.accessibilityState).toEqual({ selected: true })
        expect(getByLabelText('Power: Use Tacx Neo 2T').props.accessibilityState).toEqual({ selected: false })
        expect(getByLabelText('Cadence: Keep Wahoo RPM').props.accessibilityState).toEqual({ selected: false })
        expect(getByLabelText('Cadence: Use Tacx Neo 2T').props.accessibilityState).toEqual({ selected: true })
    })

    it('Done applies the choices', () => {
        const onDone = jest.fn()
        const onDismiss = jest.fn()
        const { getByText } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onDone, onDismiss })} />)
        arm()

        fireEvent.press(getByText('Done'))

        expect(onDone).toHaveBeenCalledTimes(1)
        expect(onDismiss).not.toHaveBeenCalled()
    })

    it('a choice is passed on as given', () => {
        const onChoice = jest.fn()
        const { getByLabelText } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onChoice })} />)
        arm()

        fireEvent.press(getByLabelText('Power: Use Tacx Neo 2T'))

        expect(onChoice).toHaveBeenCalledWith('power', 'replace')
    })

    it.each([
        ['the back button', pressBack],
        ['a tap outside', tapOutside],
    ])('%s dismisses through the conflict\'s own onDismiss', (_name, dismiss) => {
        const onDone = jest.fn()
        const onDismiss = jest.fn()
        const { UNSAFE_root } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onDone, onDismiss })} />)
        arm()

        dismiss(UNSAFE_root)

        expect(onDismiss).toHaveBeenCalledTimes(1)
        expect(onDone).not.toHaveBeenCalled()
    })

    it('has no ✕: Done is its only button besides the rows', () => {
        const { queryByLabelText, queryByText, getAllByText, getAllByRole } = render(<PairingConflictDialog conflict={buildQueuedDetectionConflict()} />)

        expect(queryByLabelText('Close')).toBeNull()
        expect(queryByText('✕')).toBeNull()
        expect(getAllByText('Done')).toHaveLength(1)
        expect(getAllByRole('radio')).toHaveLength(4)
    })
})

describe('PairingConflictDialog arming delay', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        setDimensions(...PHONE)
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.clearAllMocks()
    })

    it('is about half a second', () => {
        expect(ARMING_DELAY_MS).toBe(500)
    })

    it('ignores Keep, Use and Done right after the dialog appears', () => {
        const onChoice = jest.fn()
        const onDone = jest.fn()
        const { getByText, getByLabelText } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onChoice, onDone })} />)

        act(() => { jest.advanceTimersByTime(ARMING_DELAY_MS - 1) })
        fireEvent.press(getByLabelText('Power: Use Tacx Neo 2T'))
        fireEvent.press(getByLabelText('Cadence: Keep Wahoo RPM'))
        fireEvent.press(getByText('Done'))

        expect(onChoice).not.toHaveBeenCalled()
        expect(onDone).not.toHaveBeenCalled()
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'conflict tap ignored', control: 'done' }))
    })

    it('takes Keep, Use and Done once the delay has passed', () => {
        const onChoice = jest.fn()
        const onDone = jest.fn()
        const { getByText, getByLabelText } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onChoice, onDone })} />)

        fireEvent.press(getByText('Done'))
        arm()
        fireEvent.press(getByLabelText('Power: Use Tacx Neo 2T'))
        fireEvent.press(getByLabelText('Cadence: Keep Wahoo RPM'))
        fireEvent.press(getByText('Done'))

        expect(onChoice).toHaveBeenNthCalledWith(1, 'power', 'replace')
        expect(onChoice).toHaveBeenNthCalledWith(2, 'cadence', 'keep')
        expect(onDone).toHaveBeenCalledTimes(1)
    })

    it.each([
        ['the back button', pressBack],
        ['a tap outside', tapOutside],
    ])('never holds back %s', (_name, dismiss) => {
        const onDismiss = jest.fn()
        const { UNSAFE_root } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onDismiss })} />)

        dismiss(UNSAFE_root)

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('starts again when the next conflict takes this one\'s place, so a quick second tap on Done is not applied to it', () => {
        const first = jest.fn()
        const next = jest.fn()
        const { getByText, rerender } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onDone: first })} />)
        arm()
        fireEvent.press(getByText('Done'))

        rerender(<PairingConflictDialog conflict={{ ...buildDetectionConflict({ onDone: next }), id: 'conflict-next' }} />)
        fireEvent.press(getByText('Done'))
        expect(next).not.toHaveBeenCalled()

        arm()
        fireEvent.press(getByText('Done'))
        expect(first).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledTimes(1)
    })

    it('does not start again when the same conflict updates, e.g. after a choice', () => {
        const onDone = jest.fn()
        const { getByText, rerender } = render(<PairingConflictDialog conflict={buildDetectionConflict({ onDone })} />)
        arm()

        rerender(<PairingConflictDialog conflict={buildDetectionConflict({ onDone }, { power: 'replace' })} />)
        fireEvent.press(getByText('Done'))

        expect(onDone).toHaveBeenCalledTimes(1)
    })
})
