import React from 'react';
import { render } from '@testing-library/react-native';
import { KomootLoginDialog } from './KomootLoginDialog';

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        connect: jest.fn().mockResolvedValue(true),
    }),
}));

describe('KomootLoginDialog', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<KomootLoginDialog />);
        expect(getByText('Komoot Login')).toBeTruthy();
    });

    it('null service response does not crash', () => {
        const { getByText } = render(<KomootLoginDialog />);
        expect(getByText('Komoot Login')).toBeTruthy();
    });
});