import React from 'react'
import { render } from '@testing-library/react-native'
import { AppsSettingsView } from './AppsSettingsView'
import type { AppDisplayProps, AppsSettingsViewProps } from './types'

jest.mock('react-native-svg', () => ({
    SvgUri: 'SvgUri',
}))

const MOCK_APPS: AppDisplayProps[] = [
    { name: 'Strava', key: 'strava', iconUrl: 'strava.svg', isConnected: true },
    { name: 'Komoot', key: 'komoot', iconUrl: 'komoot.svg', isConnected: false },
]

const MOCK_PROPS: AppsSettingsViewProps = {
    apps: MOCK_APPS,
    onSelect: jest.fn(),
}

describe('AppsSettingsView', () => {
    it('renders in normal layout with apps list', () => {
        expect(() => render(<AppsSettingsView {...MOCK_PROPS} />)).not.toThrow()
    })

    it('renders in compact layout', () => {
        expect(() =>
            render(<AppsSettingsView {...MOCK_PROPS} compact={true} />),
        ).not.toThrow()
    })

    it('renders with empty apps list without crashing', () => {
        expect(() =>
            render(<AppsSettingsView apps={[]} onSelect={jest.fn()} />),
        ).not.toThrow()
    })

    it('renders with apps={undefined} without crashing', () => {
        expect(() =>
            render(<AppsSettingsView apps={undefined} onSelect={jest.fn()} />),
        ).not.toThrow()
    })
})