import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, within } from '@testing-library/react-native'
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

    it('side by side: each row\'s Keep and Use share one line, Keep first, under the row\'s title', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByTestId } = render(<ConflictStepRows rows={rows} onChoice={onChoice} layout="side-by-side" />)

        rows.forEach(row => {
            const choices = getByTestId(`conflict-choices-${row.capability}`)
            expect(StyleSheet.flatten(choices.props.style).flexDirection).toBe('row')
            const labels = within(choices).getAllByRole('radio').map(r => r.props.accessibilityLabel)
            expect(labels).toEqual([`${row.capabilityTitle}: ${row.keepLabel}`, `${row.capabilityTitle}: ${row.replaceLabel}`])
            expect(StyleSheet.flatten(getByTestId(`conflict-row-${row.capability}`).props.style)?.flexDirection).not.toBe('row')
        })
    })

    it('stacked: Keep above Use', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByTestId } = render(<ConflictStepRows rows={rows} onChoice={onChoice} layout="stacked" />)

        expect(StyleSheet.flatten(getByTestId('conflict-choices-power').props.style)?.flexDirection).not.toBe('row')
    })

    it('stacked unless told otherwise', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByTestId } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        expect(StyleSheet.flatten(getByTestId('conflict-choices-power').props.style)?.flexDirection).not.toBe('row')
    })

    it('label column: each row is one line - the slot\'s name on the left, then Keep and Use', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByTestId } = render(<ConflictStepRows rows={rows} onChoice={onChoice} layout="label-column" />)

        rows.forEach(row => {
            const line = getByTestId(`conflict-row-${row.capability}`)
            expect(StyleSheet.flatten(line.props.style).flexDirection).toBe('row')

            const texts = within(line).getAllByText(/./).map(t => t.props.children)
            expect(texts).toEqual([row.capabilityTitle.toUpperCase(), row.keepLabel, row.replaceLabel])

            const choices = getByTestId(`conflict-choices-${row.capability}`)
            expect(StyleSheet.flatten(choices.props.style).flexDirection).toBe('row')
        })
    })

    it('label column: the name may wrap, its column has a fixed width so every row lines up', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getByText } = render(<ConflictStepRows rows={rows} onChoice={onChoice} layout="label-column" />)

        const label = getByText('POWER')
        expect(label.props.numberOfLines).toBeUndefined()
        const widths = ['POWER', 'SPEED', 'CADENCE'].map(t => StyleSheet.flatten(getByText(t).props.style).width)
        expect(new Set(widths).size).toBe(1)
        expect(widths[0]).toEqual(expect.any(Number))
    })

    it('renders no buttons of its own beyond the two choices per row', () => {
        const { rows, onChoice } = buildManualConflict()
        const { getAllByRole, queryAllByRole } = render(<ConflictStepRows rows={rows} onChoice={onChoice} />)

        expect(getAllByRole('radio')).toHaveLength(rows.length * 2)
        expect(queryAllByRole('button')).toHaveLength(0)
    })
})
