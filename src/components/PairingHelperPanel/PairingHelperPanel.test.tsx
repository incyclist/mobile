import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PairingHelperPanel } from './PairingHelperPanel'
import {
    buildAsleepHelper, buildNoDeviceHelper, buildNoTrainerHelper, buildResolvedHelper, buildTrainerUnavailableHelper,
} from './PairingHelperPanel.mock'

describe('PairingHelperPanel', () => {
    it('lists every answer under the title and subline until one is picked', () => {
        const { getByText } = render(<PairingHelperPanel helper={buildNoTrainerHelper()} layout="phone" />)
        expect(getByText("Can't find your trainer?")).toBeTruthy()
        expect(getByText("Pick what fits best and we'll show you what to try.")).toBeTruthy()
        expect(getByText("It's switched off or asleep")).toBeTruthy()
        expect(getByText('Something else / not sure')).toBeTruthy()
    })

    it('picking an answer calls its handler', () => {
        const onSelect = jest.fn()
        const { getByText } = render(<PairingHelperPanel helper={buildNoTrainerHelper({ onSelect })} layout="phone" />)
        fireEvent.press(getByText("It's switched off or asleep"))
        expect(onSelect).toHaveBeenCalledWith('asleep')
    })

    it('on a phone, the other answers fold away after a pick and come back on request', () => {
        const { getByText, queryByText } = render(<PairingHelperPanel helper={buildAsleepHelper()} layout="phone" />)
        expect(getByText('Pedal a few strokes or press a button on it. We keep trying.')).toBeTruthy()
        expect(queryByText('Something else / not sure')).toBeNull()

        fireEvent.press(getByText('‹ Other answers'))
        expect(getByText('Something else / not sure')).toBeTruthy()
    })

    it('on a tablet, every answer stays listed, with the full tip and the footer line', () => {
        const { getByText, queryByText } = render(<PairingHelperPanel helper={buildAsleepHelper()} layout="tablet" />)
        expect(getByText('Something else / not sure')).toBeTruthy()
        expect(getByText(/Most trainers and sensors go to sleep when idle/)).toBeTruthy()
        expect(getByText('Still searching. Your tiles light up as soon as something is found.')).toBeTruthy()
        expect(queryByText('‹ Other answers')).toBeNull()
    })

    it('the phone leaves the footer line out', () => {
        const { queryByText } = render(<PairingHelperPanel helper={buildAsleepHelper()} layout="phone" />)
        expect(queryByText('Still searching. Your tiles light up as soon as something is found.')).toBeNull()
    })

    it('the pinned action shows its note and calls its handler', () => {
        const onAction = jest.fn()
        const { getByText } = render(<PairingHelperPanel helper={buildNoDeviceHelper({ onAction })} layout="phone" />)
        expect(getByText("You'll need one of these devices to start a ride.")).toBeTruthy()
        fireEvent.press(getByText('Browse routes for now'))
        expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('offers the trainer-unavailable answer where the page gives it', () => {
        const { getByText } = render(<PairingHelperPanel helper={buildTrainerUnavailableHelper()} layout="phone" />)
        expect(getByText("Can't connect to your trainer?")).toBeTruthy()
        expect(getByText("My trainer isn't available today")).toBeTruthy()
    })

    it('close dismisses the helper', () => {
        const onDismiss = jest.fn()
        const { getByLabelText } = render(<PairingHelperPanel helper={buildNoTrainerHelper({ onDismiss })} layout="tablet" />)
        fireEvent.press(getByLabelText('Close'))
        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('once resolved, it says so instead of listing answers', () => {
        const { getByText, queryByText } = render(<PairingHelperPanel helper={buildResolvedHelper()} layout="phone" />)
        expect(getByText('Found it! Ready to ride.')).toBeTruthy()
        expect(queryByText("It's switched off or asleep")).toBeNull()
    })
})
