import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ConflictStepRows } from './ConflictStepRows'
import { buildDetectionConflict, buildManualConflict } from './ConflictStepRows.mock'

const mockLogEvent = jest.fn()
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}))

describe('ConflictStepRows', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('shows one row per slot, each with its title and both choices', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByText, getAllByText } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        expect(getByText('POWER')).toBeTruthy()
        expect(getByText('SPEED')).toBeTruthy()
        expect(getByText('CADENCE')).toBeTruthy()
        expect(getByText('Keep Stages Power')).toBeTruthy()
        expect(getByText('Keep Wahoo Speed')).toBeTruthy()
        expect(getAllByText('Use Tacx Neo 2T')).toHaveLength(3)
    })

    it('marks the choice each row has, keep by default', () => {
        const { rows, onChoice } = buildDetectionConflict({}, { cadence: 'replace' })
        const { getByLabelText } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        expect(getByLabelText('Power: Keep Stages Power').props.accessibilityState).toEqual({ selected: true })
        expect(getByLabelText('Power: Use Tacx Neo 2T').props.accessibilityState).toEqual({ selected: false })
        expect(getByLabelText('Cadence: Keep Wahoo RPM').props.accessibilityState).toEqual({ selected: false })
        expect(getByLabelText('Cadence: Use Tacx Neo 2T').props.accessibilityState).toEqual({ selected: true })
    })

    it('a tap on a choice reports the slot and the choice, and logs it', () => {
        const onChoice = jest.fn()
        const { rows } = buildDetectionConflict({ onChoice })
        const { getByLabelText } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        fireEvent.press(getByLabelText('Cadence: Use Tacx Neo 2T'))
        expect(onChoice).toHaveBeenCalledWith('cadence', 'replace')

        fireEvent.press(getByLabelText('Power: Keep Stages Power'))
        expect(onChoice).toHaveBeenCalledWith('power', 'keep')

        expect(onChoice).toHaveBeenCalledTimes(2)
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'button clicked', button: 'conflict choice', capability: 'cadence', choice: 'replace' }))
    })

    it('renders no buttons of its own beyond the two choices per row', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getAllByRole, queryAllByRole } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        expect(getAllByRole('radio')).toHaveLength(rows.length * 2)
        expect(queryAllByRole('button')).toHaveLength(0)
    })
})
