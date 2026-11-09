import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import type { PairingDisplayProps } from 'incyclist-services'
import { PairingPageView } from './View'
import { buildAsleepHelper, buildNoTrainerHelper } from '../../components/PairingHelperPanel/PairingHelperPanel.mock'
import { MOCK_CAPABILITIES_SEARCHING } from '../../components/CapabilityStatusBars/CapabilityStatusBars.mock'
import { MOCK_STATUS_STILL_SEARCHING } from '../../components/PairingStatusLine/PairingStatusLine.mock'

// the barrel pulls in every component with its native modules; only the ones this page renders are needed
jest.mock('../../components', () => {
    const { View } = jest.requireActual('react-native')
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>
    const Stub = () => null
    return {
        MainBackground: Passthrough,
        ButtonBar: Stub,
        InterfaceState: Stub,
        DeviceSelector: Stub,
        CapabilityGrid: jest.requireActual('../../components/CapabilityGrid').CapabilityGrid,
        CapabilityStatusBars: jest.requireActual('../../components/CapabilityStatusBars').CapabilityStatusBars,
        PairingHelperPanel: jest.requireActual('../../components/PairingHelperPanel').PairingHelperPanel,
        PairingStatusLine: jest.requireActual('../../components/PairingStatusLine').PairingStatusLine,
    }
})
jest.mock('../../components/BleInterfaceSettings', () => ({ BleInterfaceSettings: () => null }))

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

const props = (extra: Partial<PairingDisplayProps> = {}): PairingDisplayProps => ({
    title: 'Devices',
    showInterfaceSettings: undefined,
    status: MOCK_STATUS_STILL_SEARCHING,
    capabilities: MOCK_CAPABILITIES_SEARCHING,
    interfaces: [{ name: 'ble', state: 'scanning', onClick: jest.fn() }],
    buttons: [],
    ...extra,
})

describe('PairingPageView', () => {
    it('the status line link opens the helper', () => {
        setDimensions(...PHONE)
        const onOpen = jest.fn()
        const { getByText } = render(<PairingPageView {...props({ helper: { ...buildNoTrainerHelper({ onOpen }), phase: 'hidden' } })} />)
        fireEvent.press(getByText('Need help?'))
        expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('no panel while the helper is hidden', () => {
        setDimensions(...PHONE)
        const { queryByText } = render(<PairingPageView {...props({ helper: { ...buildNoTrainerHelper(), phase: 'hidden' } })} />)
        expect(queryByText("Can't find your trainer?")).toBeNull()
    })

    it('on a phone with the helper open: status bars, a state-only status line and the panel', () => {
        setDimensions(...PHONE)
        const { getByText, queryByText } = render(<PairingPageView {...props({ helper: buildAsleepHelper() })} />)
        expect(getByText("Can't find your trainer?")).toBeTruthy()
        expect(getByText('Smart trainer · Searching…')).toBeTruthy()
        expect(queryByText('Need help?')).toBeNull()
    })

    it('on a tablet with the helper open: the tiles stay, beside the panel', () => {
        setDimensions(...TABLET)
        const { getByText, queryByText } = render(<PairingPageView {...props({ helper: buildAsleepHelper() })} />)
        expect(getByText('Still searching. Your tiles light up as soon as something is found.')).toBeTruthy()
        expect(queryByText('Smart trainer · Searching…')).toBeNull()
    })
})
