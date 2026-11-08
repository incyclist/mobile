import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PairingStatusLine } from './PairingStatusLine'
import { MOCK_STATUS_SEARCHING, MOCK_STATUS_STILL_SEARCHING, MOCK_STATUS_TRAINER_UNAVAILABLE } from './PairingStatusLine.mock'

describe('PairingStatusLine', () => {
    it('renders a state without a link', () => {
        const { getByText } = render(<PairingStatusLine status={MOCK_STATUS_SEARCHING} variant="short" />)
        expect(getByText('Searching… Pedal to wake your trainer.')).toBeTruthy()
    })

    it('the phone link calls its handler', () => {
        const onLinkPress = jest.fn()
        const { getByText } = render(<PairingStatusLine status={MOCK_STATUS_STILL_SEARCHING} variant="short" onLinkPress={onLinkPress} />)
        fireEvent.press(getByText('Need help?'))
        expect(onLinkPress).toHaveBeenCalledTimes(1)
    })

    it('the full variant uses the full text and link', () => {
        const onLinkPress = jest.fn()
        const { getByText } = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="full" onLinkPress={onLinkPress} />)
        fireEvent.press(getByText('Not available today?'))
        expect(onLinkPress).toHaveBeenCalledTimes(1)
    })

    it('leaves the link out when only the state is shown', () => {
        const { queryByText } = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="short" stateOnly onLinkPress={jest.fn()} />)
        expect(queryByText('Not available?')).toBeNull()
    })

    it('leaves the link out when there is nothing for it to open', () => {
        const { queryByText } = render(<PairingStatusLine status={MOCK_STATUS_STILL_SEARCHING} variant="short" />)
        expect(queryByText('Need help?')).toBeNull()
    })
})
