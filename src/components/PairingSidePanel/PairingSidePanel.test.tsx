import React from 'react'
import { Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { PairingSidePanel } from './PairingSidePanel'
import { PairingSidePanelAction } from './PairingSidePanelAction'

describe('PairingSidePanel', () => {
    it('shows the title, the note beside it, the subline and the body', () => {
        const { getByText } = render(
            <PairingSidePanel title="A title" titleNote="2 more" subline="A subline" onClose={jest.fn()}>
                <Text>Body</Text>
            </PairingSidePanel>
        )
        expect(getByText('A title')).toBeTruthy()
        expect(getByText('2 more')).toBeTruthy()
        expect(getByText('A subline')).toBeTruthy()
        expect(getByText('Body')).toBeTruthy()
    })

    it('✕ calls onClose', () => {
        const onClose = jest.fn()
        const { getByLabelText } = render(<PairingSidePanel title="A title" onClose={onClose}><Text>Body</Text></PairingSidePanel>)
        fireEvent.press(getByLabelText('Close'))
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('shows the pinned area only when given', () => {
        const without = render(<PairingSidePanel title="A title" onClose={jest.fn()}><Text>Body</Text></PairingSidePanel>)
        expect(without.queryByTestId('pairing-side-panel-pinned')).toBeNull()

        const withPinned = render(<PairingSidePanel title="A title" onClose={jest.fn()} pinned={<Text>Pinned</Text>}><Text>Body</Text></PairingSidePanel>)
        expect(withPinned.getByTestId('pairing-side-panel-pinned')).toBeTruthy()
        expect(withPinned.getByText('Pinned')).toBeTruthy()
    })
})

describe('PairingSidePanelAction', () => {
    it('shows its note above the button and calls onPress', () => {
        const onPress = jest.fn()
        const { getByText, toJSON } = render(<PairingSidePanelAction label="Do it" note="A note" onPress={onPress} />)
        const tree = JSON.stringify(toJSON())
        expect(tree.indexOf('A note')).toBeLessThan(tree.indexOf('Do it'))
        fireEvent.press(getByText('Do it'))
        expect(onPress).toHaveBeenCalledTimes(1)
    })
})
