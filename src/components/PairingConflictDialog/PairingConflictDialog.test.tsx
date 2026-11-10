import React from 'react'
import { act, render, fireEvent, within } from '@testing-library/react-native'
import { Modal, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native'
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

// the dialog's own surface, sized to the whole window with square corners
const fillsScreen = (root: ReturnType<typeof render>['UNSAFE_root']) => root.findAll(node => {
    if (typeof node.type !== 'string')
        return false
    const style = StyleSheet.flatten(node.props.style)
    return style?.width === '100%' && style?.height === '100%' && style?.borderRadius === 0
}).length > 0

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

    it('on a phone, says how many more wait in the footer, next to Done', () => {
        const { getByTestId, queryByText } = render(<PairingConflictDialog conflict={buildQueuedDetectionConflict()} />)

        const footer = within(getByTestId('dialog-footer'))
        expect(footer.getByText('2 more to check')).toBeTruthy()
        expect(footer.getByText('Done')).toBeTruthy()
        expect(queryByText('2 more')).toBeNull()
    })

    it('on a tablet, says it in full', () => {
        setDimensions(...TABLET)
        const { getByTestId } = render(<PairingConflictDialog conflict={buildQueuedDetectionConflict()} />)

        expect(within(getByTestId('dialog-footer')).getByText('2 more devices to check')).toBeTruthy()
    })

    it('shows the page service\'s queued copy as given: short on a phone, full on a tablet', () => {
        const conflict = { ...buildDetectionConflict(), queued: 3, queuedText: { full: 'The full queued line', short: 'The short queued line' } }

        const phone = render(<PairingConflictDialog conflict={conflict} />)
        expect(within(phone.getByTestId('dialog-footer')).getByText('The short queued line')).toBeTruthy()
        expect(phone.queryByText('The full queued line')).toBeNull()
        phone.unmount()

        setDimensions(...TABLET)
        const tablet = render(<PairingConflictDialog conflict={conflict} />)
        expect(within(tablet.getByTestId('dialog-footer')).getByText('The full queued line')).toBeTruthy()
    })

    it('says nothing about more when the page service gives no copy for it, whatever the count', () => {
        const { queryByText } = render(<PairingConflictDialog conflict={{ ...buildDetectionConflict(), queued: 2 }} />)
        expect(queryByText(/to check$/)).toBeNull()
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

    it('on a phone, fills the screen', () => {
        const { UNSAFE_root } = render(<PairingConflictDialog conflict={buildDetectionConflict()} />)
        expect(fillsScreen(UNSAFE_root)).toBe(true)
    })

    it('on a tablet, keeps the device list\'s size', () => {
        setDimensions(...TABLET)
        const { UNSAFE_root } = render(<PairingConflictDialog conflict={buildDetectionConflict()} />)
        expect(fillsScreen(UNSAFE_root)).toBe(false)
    })

    it('scrolls the rows in the body\'s own ScrollView, not the dialog\'s', () => {
        const { UNSAFE_root } = render(<PairingConflictDialog conflict={buildDetectionConflict()} />)
        expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(1)
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
