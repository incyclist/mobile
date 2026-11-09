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

    it('shows only the state, without its tip, when only the state is shown', () => {
        const short = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="short" stateOnly />)
        expect(short.getByText("Can't reach Tacx Flux.")).toBeTruthy()
        expect(short.queryByText("Can't reach Tacx Flux. Pedal to wake it")).toBeNull()

        const full = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="full" stateOnly />)
        expect(full.getByText("Can't reach your trainer Tacx Flux.")).toBeTruthy()
    })

    it('keeps the tip in the text otherwise', () => {
        const short = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="short" />)
        expect(short.getByText("Can't reach Tacx Flux. Pedal to wake it")).toBeTruthy()

        const full = render(<PairingStatusLine status={MOCK_STATUS_TRAINER_UNAVAILABLE} variant="full" />)
        expect(full.getByText("Can't reach your trainer Tacx Flux. Pedal a few strokes to wake it up.")).toBeTruthy()
    })

    it('leaves the link out when there is nothing for it to open', () => {
        const { queryByText } = render(<PairingStatusLine status={MOCK_STATUS_STILL_SEARCHING} variant="short" />)
        expect(queryByText('Need help?')).toBeNull()
    })
})
