import React from 'react'
import { render } from '@testing-library/react-native'
import { KomootLoginDialogView } from './KomootLoginDialogView'
import { KomootLoginDialogViewProps } from './types'

const MOCK_PROPS: KomootLoginDialogViewProps = {
    isConnecting: false,
    onUsernameChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onUseridChange: jest.fn(),
    onConnect: jest.fn(),
    onCancel: jest.fn(),
}

describe('KomootLoginDialogView', () => {
    it('renders in normal layout', () => {
        expect(() => render(<KomootLoginDialogView {...MOCK_PROPS} />)).not.toThrow()
    })

    it('renders in compact layout', () => {
        expect(() =>
            render(<KomootLoginDialogView {...MOCK_PROPS} compact={true} />)
        ).not.toThrow()
    })

    it('renders with isConnecting={true} (buttons and fields disabled)', () => {
        expect(() =>
            render(<KomootLoginDialogView {...MOCK_PROPS} isConnecting={true} />)
        ).not.toThrow()
    })

    it('renders with errorMessage set', () => {
        expect(() =>
            render(
                <KomootLoginDialogView
                    {...MOCK_PROPS}
                    errorMessage="Invalid credentials"
                />
            )
        ).not.toThrow()
    })

    it('renders with all optional fields undefined without crashing', () => {
        expect(() =>
            render(<KomootLoginDialogView isConnecting={false} />)
        ).not.toThrow()
    })
})