import React from 'react'
import { render } from '@testing-library/react-native'
import { KomootLoginDialog } from './KomootLoginDialog'

jest.mock('./KomootLoginDialogView', () => ({
    KomootLoginDialogView: () => null,
}))

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        connect: jest.fn().mockResolvedValue(true),
    }),
}))

describe('KomootLoginDialog', () => {
    it('renders without crashing', () => {
        expect(() =>
            render(<KomootLoginDialog onSuccess={jest.fn()} onCancel={jest.fn()} />)
        ).not.toThrow()
    })

    it('null service response does not crash', () => {
        jest.resetModules()
        jest.doMock('incyclist-services', () => ({
            useAppsService: () => null,
        }))
        expect(() =>
            render(<KomootLoginDialog onSuccess={jest.fn()} onCancel={jest.fn()} />)
        ).not.toThrow()
    })
})