import React from 'react'
import { render } from '@testing-library/react-native'
import { AppsSettings } from './AppsSettings'

jest.mock('react-native-svg', () => ({
    SvgUri: 'SvgUri',
}))

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openSettings: jest.fn().mockReturnValue([
            {
                name: 'Strava',
                key: 'strava',
                iconUrl: 'strava.svg',
                isConnected: false,
            },
        ]),
    }),
}))

jest.mock('../OAuthAppSettings', () => ({
    OAuthAppSettings: 'OAuthAppSettings',
}))

jest.mock('../KomootSettings', () => ({
    KomootSettings: 'KomootSettings',
}))

describe('AppsSettings', () => {
    it('renders without crashing', () => {
        expect(() => render(<AppsSettings />)).not.toThrow()
    })

    it('null service response does not crash', () => {
        const { useAppsService } =
            require('incyclist-services') as {
                useAppsService: () => { openSettings: jest.Mock }
            }
        ;(useAppsService as jest.Mock).mockReturnValueOnce({
            openSettings: jest.fn().mockReturnValue(null),
        })
        expect(() => render(<AppsSettings />)).not.toThrow()
    })
})