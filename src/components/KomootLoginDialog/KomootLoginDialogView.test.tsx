import React from 'react';
import { render } from '@testing-library/react-native';
import { KomootLoginDialogView } from './KomootLoginDialogView';
import { KomootLoginDialogViewProps } from './types';

const MOCK_PROPS: KomootLoginDialogViewProps = {
    isConnecting: false,
    onUsernameChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onUseridChange: jest.fn(),
    onConnect: jest.fn(),
    onCancel: jest.fn(),
};

describe('KomootLoginDialogView', () => {
    it('renders in normal layout', () => {
        const { getByText } = render(<KomootLoginDialogView {...MOCK_PROPS} />);
        expect(getByText('Komoot Login')).toBeTruthy();
        expect(getByText('Email')).toBeTruthy();
        expect(getByText('Password')).toBeTruthy();
        expect(getByText('Account ID')).toBeTruthy();
    });

    it('renders in compact layout', () => {
        const { getByText } = render(<KomootLoginDialogView {...MOCK_PROPS} compact={true} />);
        expect(getByText('Komoot Login')).toBeTruthy();
    });

    it('renders with isConnecting={true}', () => {
        const { getByText } = render(<KomootLoginDialogView {...MOCK_PROPS} isConnecting={true} />);
        expect(getByText('Komoot Login')).toBeTruthy();
    });

    it('renders with errorMessage set', () => {
        const { getByText } = render(<KomootLoginDialogView {...MOCK_PROPS} errorMessage="Invalid credentials" />);
        expect(getByText('Invalid credentials')).toBeTruthy();
    });

    it('renders with all optional fields undefined without crashing', () => {
        const { getByText } = render(<KomootLoginDialogView isConnecting={false} />);
        expect(getByText('Komoot Login')).toBeTruthy();
    });
});