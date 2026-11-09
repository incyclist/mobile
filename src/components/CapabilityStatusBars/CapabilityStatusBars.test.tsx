import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CapabilityStatusBars } from './CapabilityStatusBars'
import { MOCK_CAPABILITIES_FALLBACK, MOCK_CAPABILITIES_HEARTRATE_ONLY, MOCK_CAPABILITIES_TRAINER_UNAVAILABLE } from './CapabilityStatusBars.mock'

describe('CapabilityStatusBars', () => {
    it('renders the required row as bars and the optional row as one line', () => {
        const { getByText } = render(<CapabilityStatusBars capabilities={MOCK_CAPABILITIES_HEARTRATE_ONLY} />)
        expect(getByText('RESISTANCE')).toBeTruthy()
        expect(getByText('Smart trainer · Searching…')).toBeTruthy()
        expect(getByText(/CADENCE/)).toBeTruthy()
    })

    it('the optional line writes the titles in upper case, as the tiles and bars do', () => {
        const { getByText, queryByText } = render(<CapabilityStatusBars capabilities={MOCK_CAPABILITIES_HEARTRATE_ONLY} />)
        expect(getByText('OPTIONAL: ✓ HEARTRATE · CADENCE · CONTROLLER')).toBeTruthy()
        expect(queryByText(/Cadence/)).toBeNull()
    })

    it('a tap on a bar opens its device list, as the tile does', () => {
        const onClick = jest.fn()
        const tiles = MOCK_CAPABILITIES_TRAINER_UNAVAILABLE.top.map(t => (t.capability === 'power' ? { ...t, onClick } : t))
        const { getByText } = render(
            <CapabilityStatusBars capabilities={{ ...MOCK_CAPABILITIES_TRAINER_UNAVAILABLE, top: tiles }} />
        )
        fireEvent.press(getByText('POWER'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it("shows the page service's tile copy while the trainer can't be reached", () => {
        const { getByText, getAllByText } = render(<CapabilityStatusBars capabilities={MOCK_CAPABILITIES_TRAINER_UNAVAILABLE} />)
        expect(getByText('Tacx Flux · Your trainer · Waiting…')).toBeTruthy()
        // Power and Speed both hold the trainer
        expect(getAllByText('Tacx Flux · via your trainer · Via trainer')).toHaveLength(2)
    })

    it('while the ride falls back to another device, the dimmed bars show the copy as given', () => {
        const { getByText } = render(<CapabilityStatusBars capabilities={MOCK_CAPABILITIES_FALLBACK} />)
        expect(getByText('Tacx Flux · Your trainer · Tap to use again')).toBeTruthy()
        expect(getByText('154 W · Stages Power · CONNECTED')).toBeTruthy()
        expect(getByText('Tacx Flux · Not used')).toBeTruthy()
        // the dimmed Cadence tile isn't marked connected in the optional line
        expect(getByText('OPTIONAL: HEARTRATE · CADENCE · CONTROLLER')).toBeTruthy()
    })

    it('a tap on a dimmed bar calls its onClick, as the tile does', () => {
        const onClick = jest.fn()
        const tiles = MOCK_CAPABILITIES_FALLBACK.top.map(t => (t.capability === 'control' ? { ...t, onClick } : t))
        const { getByText } = render(<CapabilityStatusBars capabilities={{ ...MOCK_CAPABILITIES_FALLBACK, top: tiles }} />)
        fireEvent.press(getByText('RESISTANCE'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders nothing without capabilities', () => {
        const { toJSON } = render(<CapabilityStatusBars />)
        expect(toJSON()).toBeNull()
    })
})
