import React from 'react'
import { render, fireEvent, within } from '@testing-library/react-native'
import { PairingConflictCard } from './PairingConflictCard'
import { buildDetectionConflict, buildQueuedDetectionConflict } from '../ConflictStepRows/ConflictStepRows.mock'

const mockLogEvent = jest.fn()
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}))

describe('PairingConflictCard', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('shows the title, the phone subline and the rows on a phone', () => {
        const conflict = buildDetectionConflict()
        const { getByText, queryByText } = render(<PairingConflictCard conflict={conflict} layout="phone" />)

        expect(getByText('Tacx Neo 2T can also measure more')).toBeTruthy()
        expect(getByText(conflict.subline.short)).toBeTruthy()
        expect(queryByText(conflict.subline.full)).toBeNull()
        expect(getByText('Keep Stages Power')).toBeTruthy()
        expect(getByText('Keep Wahoo RPM')).toBeTruthy()
    })

    it('shows the full subline on a tablet', () => {
        const conflict = buildDetectionConflict()
        const { getByText } = render(<PairingConflictCard conflict={conflict} layout="tablet" />)

        expect(getByText(conflict.subline.full)).toBeTruthy()
    })

    it('says how many more conflicts wait, only when some do', () => {
        const queued = render(<PairingConflictCard conflict={buildQueuedDetectionConflict()} layout="phone" />)
        expect(queued.getByText('2 more')).toBeTruthy()

        const single = render(<PairingConflictCard conflict={{ ...buildDetectionConflict(), queuedText: 'stale' }} layout="phone" />)
        expect(single.queryByText('stale')).toBeNull()
    })

    it('Done is pinned and applies the choices', () => {
        const onDone = jest.fn()
        const { getByTestId } = render(<PairingConflictCard conflict={buildDetectionConflict({ onDone })} layout="phone" />)

        fireEvent.press(within(getByTestId('pairing-side-panel-pinned')).getByText('Done'))

        expect(onDone).toHaveBeenCalledTimes(1)
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'button clicked', button: 'conflict done' }))
    })

    it('✕ dismisses the card', () => {
        const onDismiss = jest.fn()
        const onDone = jest.fn()
        const { getByLabelText } = render(<PairingConflictCard conflict={buildDetectionConflict({ onDismiss, onDone })} layout="phone" />)

        fireEvent.press(getByLabelText('Close'))

        expect(onDismiss).toHaveBeenCalledTimes(1)
        expect(onDone).not.toHaveBeenCalled()
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'button clicked', button: 'conflict close' }))
    })

    it('a choice is passed on as given', () => {
        const onChoice = jest.fn()
        const { getByLabelText } = render(<PairingConflictCard conflict={buildDetectionConflict({ onChoice })} layout="phone" />)

        fireEvent.press(getByLabelText('Power: Use Tacx Neo 2T'))

        expect(onChoice).toHaveBeenCalledWith('power', 'replace')
    })

    it('has exactly two buttons: ✕ and Done', () => {
        const { getAllByRole } = render(<PairingConflictCard conflict={buildQueuedDetectionConflict()} layout="tablet" />)

        expect(getAllByRole('button').map(b => b.props.accessibilityLabel ?? within(b).queryByText(/./)?.props.children)).toEqual(['Close', 'Done'])
    })
})
