import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';

const Bomb = () => {
    throw new Error('boom');
};

describe('ErrorBoundary', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        // React logs the caught error to console.error too (expected, not a test failure) -
        // silenced so this test's own output stays readable.
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it('renders children normally when nothing throws', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <Text>fine</Text>
            </ErrorBoundary>
        );

        expect(getByText('fine')).toBeTruthy();
    });

    it('renders null instead of crashing when a child throws', () => {
        const { toJSON } = render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );

        expect(toJSON()).toBeNull();
    });

    it('does not take down a sibling subtree outside the boundary', () => {
        const { getByText, toJSON } = render(
            <>
                <ErrorBoundary>
                    <Bomb />
                </ErrorBoundary>
                <Text>sibling survives</Text>
            </>
        );

        expect(getByText('sibling survives')).toBeTruthy();
        expect(toJSON()).not.toBeNull();
    });
});
