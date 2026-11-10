import React from 'react'
import { act, render, fireEvent } from '@testing-library/react-native'
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { ConflictStepBody } from './ConflictStepBody'
import { buildManualConflict, buildQueuedDetectionConflict } from './ConflictStepRows.mock'

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn() }),
}))

const mockDimensions = { width: 800, height: 360 }
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}))

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width
    mockDimensions.height = height
}

const directionOf = (node: { props: { style?: StyleProp<ViewStyle> } }) => StyleSheet.flatten(node.props.style)?.flexDirection

const resize = (scroll: ReturnType<typeof render>['UNSAFE_root'], viewHeight: number, contentHeight: number) => {
    const view = scroll.findByType(ScrollView)
    act(() => {
        fireEvent(view, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: viewHeight } } })
        fireEvent(view, 'contentSizeChange', 400, contentHeight)
    })
}
const scrollTo = (root: ReturnType<typeof render>['UNSAFE_root'], y: number) => {
    act(() => {
        fireEvent.scroll(root.findByType(ScrollView), { nativeEvent: { contentOffset: { x: 0, y } } })
    })
}

describe('ConflictStepBody', () => {
    beforeEach(() => {
        setDimensions(800, 360)
    })

    it('shows the subline and the rows, the short subline when compact', () => {
        const step = { ...buildManualConflict(), subline: { full: 'The full line', short: 'The short line' } }
        const { getByText, queryByText } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        expect(getByText('The short line')).toBeTruthy()
        expect(queryByText('The full line')).toBeNull()
        expect(getByText('Keep Wahoo Speed')).toBeTruthy()
    })

    it('leaves the count of waiting conflicts to the dialog\'s footer', () => {
        const step = buildQueuedDetectionConflict()
        const { queryByText } = render(<ConflictStepBody step={step} compact={false} onChoice={step.onChoice} />)

        expect(queryByText('2 more')).toBeNull()
        expect(queryByText(/to check/)).toBeNull()
    })

    it('scrolls the rows itself, in one ScrollView', () => {
        const step = buildManualConflict()
        const { UNSAFE_root } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(1)
    })

    it('on a phone, puts each row on one line: the slot\'s name on the left, then Keep and Use', () => {
        const step = buildManualConflict()
        const { getByTestId } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        expect(directionOf(getByTestId('conflict-row-power'))).toBe('row')
        expect(directionOf(getByTestId('conflict-choices-power'))).toBe('row')
    })

    it('on a tablet in landscape, puts Keep and Use side by side under the slot\'s name', () => {
        setDimensions(1280, 800)
        const step = buildManualConflict()
        const { getByTestId } = render(<ConflictStepBody step={step} compact={false} onChoice={step.onChoice} />)

        expect(directionOf(getByTestId('conflict-row-power'))).not.toBe('row')
        expect(directionOf(getByTestId('conflict-choices-power'))).toBe('row')
    })

    it('in portrait, stacks them', () => {
        setDimensions(800, 1280)
        const step = buildManualConflict()
        const { getByTestId } = render(<ConflictStepBody step={step} compact={false} onChoice={step.onChoice} />)

        expect(directionOf(getByTestId('conflict-choices-power'))).not.toBe('row')
    })
})

describe('ConflictStepBody "more below" hint', () => {
    it('shows while rows are hidden below, and goes once the rider scrolled to the end', () => {
        const step = buildManualConflict()
        const { UNSAFE_root, queryByTestId } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        resize(UNSAFE_root, 150, 230)
        expect(queryByTestId('conflict-more-below')).toBeTruthy()

        scrollTo(UNSAFE_root, 80)
        expect(queryByTestId('conflict-more-below')).toBeNull()

        scrollTo(UNSAFE_root, 10)
        expect(queryByTestId('conflict-more-below')).toBeTruthy()
    })

    it('is not shown when every row fits', () => {
        const step = buildManualConflict()
        const { UNSAFE_root, queryByTestId } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        resize(UNSAFE_root, 300, 230)
        expect(queryByTestId('conflict-more-below')).toBeNull()
    })

    it('never takes the taps meant for the row under it', () => {
        const step = buildManualConflict()
        const { UNSAFE_root, getByTestId } = render(<ConflictStepBody step={step} compact onChoice={step.onChoice} />)

        resize(UNSAFE_root, 150, 230)
        expect(StyleSheet.flatten(getByTestId('conflict-more-below').props.style).pointerEvents).toBe('none')
    })
})
