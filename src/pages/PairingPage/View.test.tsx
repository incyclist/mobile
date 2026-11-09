import React from 'react'
import { render, fireEvent, within } from '@testing-library/react-native'
import type { DeviceSelectionProps, PairingDisplayProps } from 'incyclist-services'
import { PairingPageView } from './View'
import { MOCK_PAIRING_BUTTON_SETS } from './PairingPage.mock'
import {
    buildAsleepHelper, buildFallbackHelper, buildNoDeviceHelper, buildNoTrainerHelper, buildTrainerUnavailableHelper,
} from '../../components/PairingHelperPanel/PairingHelperPanel.mock'
import {
    MOCK_CAPABILITIES_FALLBACK, MOCK_CAPABILITIES_SEARCHING, MOCK_CAPABILITIES_SWITCHED_OFF, MOCK_CAPABILITIES_TRAINER_CONNECTING,
    MOCK_CAPABILITIES_TRAINER_UNAVAILABLE,
} from '../../components/CapabilityStatusBars/CapabilityStatusBars.mock'
import { MOCK_STATUS_STILL_SEARCHING } from '../../components/PairingStatusLine/PairingStatusLine.mock'
import {
    buildDetectionConflict, buildManualConflict, buildQueuedDetectionConflict,
} from '../../components/ConflictStepRows/ConflictStepRows.mock'

// the barrel pulls in every component with its native modules; only the ones this page renders are needed
jest.mock('../../components', () => {
    const { View } = jest.requireActual('react-native')
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>
    const Stub = () => null
    return {
        MainBackground: Passthrough,
        InterfaceState: Stub,
        ButtonBar: jest.requireActual('../../components/ButtonBar').ButtonBar,
        DeviceSelector: jest.requireActual('../../components/DeviceSelector').DeviceSelector,
        CapabilityGrid: jest.requireActual('../../components/CapabilityGrid').CapabilityGrid,
        CapabilityStatusBars: jest.requireActual('../../components/CapabilityStatusBars').CapabilityStatusBars,
        PairingHelperPanel: jest.requireActual('../../components/PairingHelperPanel').PairingHelperPanel,
        PairingConflictCard: jest.requireActual('../../components/PairingConflictCard').PairingConflictCard,
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

const resistanceList = (extra: Partial<DeviceSelectionProps> = {}): DeviceSelectionProps => ({
    capability: 'control',
    devices: [
        { deviceName: 'Tacx Flux', value: 1, interface: 'ble', isSelected: true, connectState: 'failed', onClick: jest.fn(), onDelete: jest.fn() },
        { deviceName: 'Tacx Neo 2T', value: 2, interface: 'ble', isSelected: false, onClick: jest.fn(), onDelete: jest.fn() },
    ],
    isScanning: false,
    disabled: false,
    changeForAll: false,
    canSelectAll: true,
    onClose: jest.fn(),
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

describe('PairingPageView conflict card', () => {
    it('on a phone: the card in the panel slot, the required row as status bars', () => {
        setDimensions(...PHONE)
        const { getByText } = render(<PairingPageView {...props({ pendingConflict: buildDetectionConflict() })} />)
        expect(getByText('Tacx Neo 2T can also measure more')).toBeTruthy()
        expect(getByText('Nothing changes until you choose.')).toBeTruthy()
        expect(getByText('Smart trainer · Searching…')).toBeTruthy()
    })

    it('on a tablet: the card beside the tiles, with the full subline', () => {
        setDimensions(...TABLET)
        const conflict = buildDetectionConflict()
        const { getByText, queryByText } = render(<PairingPageView {...props({ pendingConflict: conflict })} />)
        expect(getByText(conflict.subline.full)).toBeTruthy()
        expect(queryByText('Smart trainer · Searching…')).toBeNull()
    })

    it('shows how many more wait', () => {
        setDimensions(...PHONE)
        const { getByText } = render(<PairingPageView {...props({ pendingConflict: buildQueuedDetectionConflict() })} />)
        expect(getByText('2 more')).toBeTruthy()
    })

    it('never blocks the page buttons: OK still works while the card shows', () => {
        setDimensions(...PHONE)
        const onOK = jest.fn(async () => {})
        const { getByText } = render(<PairingPageView {...props({
            capabilities: MOCK_CAPABILITIES_SWITCHED_OFF,
            pendingConflict: buildDetectionConflict(),
            buttons: [{ label: 'OK', primary: true, onClick: onOK }],
        })} />)
        fireEvent.press(getByText('OK'))
        expect(onOK).toHaveBeenCalledTimes(1)
    })

    it('Done and ✕ go to the card\'s own handlers', () => {
        setDimensions(...PHONE)
        const onDone = jest.fn()
        const onDismiss = jest.fn()
        const { getByText, getByLabelText } = render(<PairingPageView {...props({ pendingConflict: buildDetectionConflict({ onDone, onDismiss }) })} />)
        fireEvent.press(getByText('Done'))
        fireEvent.press(getByLabelText('Close'))
        expect(onDone).toHaveBeenCalledTimes(1)
        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('renders the card every time it is given, whatever else the page shows', () => {
        setDimensions(...PHONE)
        const { getByText } = render(<PairingPageView {...props({
            capabilities: MOCK_CAPABILITIES_TRAINER_CONNECTING,
            helper: { ...buildTrainerUnavailableHelper(), phase: 'hidden' },
            pendingConflict: buildDetectionConflict(),
        })} />)
        expect(getByText('Tacx Neo 2T can also measure more')).toBeTruthy()
    })

    it('without one, there is no card', () => {
        setDimensions(...PHONE)
        const { queryByText } = render(<PairingPageView {...props()} />)
        expect(queryByText('Tacx Neo 2T can also measure more')).toBeNull()
    })
})

describe('PairingPageView fallback', () => {
    it('the helper offers the fallback with the label the page service gives', () => {
        setDimensions(...PHONE)
        const onAction = jest.fn()
        const { getByText } = render(<PairingPageView {...props({
            capabilities: MOCK_CAPABILITIES_TRAINER_UNAVAILABLE, helper: buildFallbackHelper({ onAction }),
        })} />)
        fireEvent.press(getByText('Ride with power meter only'))
        expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('while the ride falls back, the dimmed Resistance bar beside a card shows its copy and a tap calls its onClick', () => {
        setDimensions(...PHONE)
        const onClick = jest.fn()
        const top = MOCK_CAPABILITIES_FALLBACK.top.map(t => (t.capability === 'control' ? { ...t, onClick } : t))
        const { getByText } = render(<PairingPageView {...props({
            capabilities: { ...MOCK_CAPABILITIES_FALLBACK, top }, pendingConflict: buildDetectionConflict(),
        })} />)

        expect(getByText('Tacx Flux · Your trainer · Tap to use again')).toBeTruthy()
        fireEvent.press(getByText('RESISTANCE'))
        expect(onClick).toHaveBeenCalledTimes(1)
    })
})

// The pairing flow never offers a "try again" button, on any platform: the page renders exactly the
// buttons the page service gives, and none of its own panels or steps adds one.
describe('PairingPageView never shows a "try again" button', () => {
    const TRY_AGAIN = /try\s*again|re-?try/i

    const STATES: Array<[string, Partial<PairingDisplayProps>]> = [
        ['searching', {}],
        ['the helper, nothing picked', { helper: buildNoTrainerHelper() }],
        ['the helper, no device', { helper: buildNoDeviceHelper() }],
        ['the trainer connecting', { capabilities: MOCK_CAPABILITIES_TRAINER_CONNECTING }],
        ['the trainer unavailable, its helper', { capabilities: MOCK_CAPABILITIES_TRAINER_UNAVAILABLE, helper: buildTrainerUnavailableHelper() }],
        ['the fallback offered', { capabilities: MOCK_CAPABILITIES_TRAINER_UNAVAILABLE, helper: buildFallbackHelper() }],
        ['the ride falling back', { capabilities: MOCK_CAPABILITIES_FALLBACK }],
        ['Resistance switched off', { capabilities: MOCK_CAPABILITIES_SWITCHED_OFF }],
        ['a conflict card', { pendingConflict: buildQueuedDetectionConflict() }],
        ['the Resistance list', { deviceSelection: resistanceList() }],
        ['the Resistance list\'s conflict step', { deviceSelection: resistanceList({ conflictStep: buildManualConflict() }) }],
    ]
    const BUTTON_SETS = Object.entries(MOCK_PAIRING_BUTTON_SETS)
    const LAYOUTS: Array<[string, [number, number]]> = [['phone', PHONE], ['tablet', TABLET]]

    describe.each(LAYOUTS)('on a %s', (_layout, size) => {
        it.each(STATES)('%s: no text anywhere on the page reads "try again", with any of the page service\'s button sets', (_state, extra) => {
            setDimensions(...size)
            BUTTON_SETS.forEach(([, buttons]) => {
                const { queryAllByText, unmount } = render(<PairingPageView {...props({ ...extra, buttons })} />)
                expect(queryAllByText(TRY_AGAIN)).toHaveLength(0)
                unmount()
            })
        })
    })

    it.each(BUTTON_SETS)('the page shows exactly the buttons it is given (%s), none added, none dropped', (_name, buttons) => {
        setDimensions(...PHONE)
        const { getByTestId } = render(<PairingPageView {...props({ buttons })} />)
        const labels = within(getByTestId('pairing-page-buttons')).queryAllByText(/./).map(t => t.props.children)
        expect(labels).toEqual(buttons.map(b => b.label))
    })

    it('the check itself is not blind: a button labelled like that would be found', () => {
        setDimensions(...PHONE)
        const { queryAllByText } = render(<PairingPageView {...props({ buttons: [{ label: 'Try again', primary: true, onClick: async () => {} }] })} />)
        expect(queryAllByText(TRY_AGAIN)).toHaveLength(1)
    })

    it('no button set the page service gives has a "try again" label', () => {
        BUTTON_SETS.forEach(([, buttons]) => {
            buttons.forEach(b => expect(b.label).not.toMatch(TRY_AGAIN))
        })
    })
})
