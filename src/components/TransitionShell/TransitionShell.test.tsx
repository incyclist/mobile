import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TransitionShell } from './TransitionShell';

const mockNavigationBar = jest.fn();
jest.mock('../NavigationBar', () => {
    const { TouchableOpacity, Text: RNText } = require('react-native');
    return {
        NavigationBar: (props: any) => {
            mockNavigationBar(props);
            return (
                <TouchableOpacity testID="nav-bar" onPress={() => props.onClick('routes')}>
                    <RNText>nav-bar</RNText>
                </TouchableOpacity>
            );
        },
    };
});

jest.mock('../MainBackground', () => ({
    MainBackground: ({ children }: any) => children,
}));

describe('TransitionShell', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders its children in the content area', () => {
        const { getByText } = render(
            <TransitionShell selected="routes">
                <Text>content</Text>
            </TransitionShell>
        );
        expect(getByText('content')).toBeTruthy();
    });

    it('forwards selected/disabled to NavigationBar and defaults onClick to a no-op', () => {
        render(
            <TransitionShell selected="workouts" disabled={true}>
                <Text>content</Text>
            </TransitionShell>
        );
        expect(mockNavigationBar).toHaveBeenCalledWith(
            expect.objectContaining({ selected: 'workouts', disabled: true })
        );
    });

    it('does not throw when NavigationBar is pressed without an onClick prop', () => {
        const { getByTestId } = render(
            <TransitionShell selected="routes">
                <Text>content</Text>
            </TransitionShell>
        );
        expect(() => fireEvent.press(getByTestId('nav-bar'))).not.toThrow();
    });

    it('forwards a real onClick handler when provided', () => {
        const onClick = jest.fn();
        const { getByTestId } = render(
            <TransitionShell selected="routes" onClick={onClick}>
                <Text>content</Text>
            </TransitionShell>
        );
        fireEvent.press(getByTestId('nav-bar'));
        expect(onClick).toHaveBeenCalledWith('routes');
    });
});
