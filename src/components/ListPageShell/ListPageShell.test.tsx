import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ListPageShell } from './ListPageShell';

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

describe('ListPageShell', () => {
    const baseProps = {
        compact: false,
        navSelected: 'workouts' as const,
        onNavigate: jest.fn(),
        title: 'WORKOUTS',
    };

    beforeEach(() => jest.clearAllMocks());

    it('renders the title and the children in the list area', () => {
        const { getByText } = render(
            <ListPageShell {...baseProps}>
                <Text>list-content</Text>
            </ListPageShell>
        );
        expect(getByText('WORKOUTS')).toBeTruthy();
        expect(getByText('list-content')).toBeTruthy();
    });

    it('renders headerLeft/headerRight/belowHeader when provided', () => {
        const { getByText } = render(
            <ListPageShell
                {...baseProps}
                headerLeft={<Text>left</Text>}
                headerRight={<Text>right</Text>}
                belowHeader={<Text>below-header</Text>}
            >
                <Text>list-content</Text>
            </ListPageShell>
        );
        expect(getByText('left')).toBeTruthy();
        expect(getByText('right')).toBeTruthy();
        expect(getByText('below-header')).toBeTruthy();
    });

    it('passes navSelected/compact through to NavigationBar and forwards its click', () => {
        const onNavigate = jest.fn();
        const { getByTestId } = render(
            <ListPageShell {...baseProps} onNavigate={onNavigate} navSelected="routes">
                <Text>list-content</Text>
            </ListPageShell>
        );

        expect(mockNavigationBar).toHaveBeenCalledWith(
            expect.objectContaining({ selected: 'routes', compact: false })
        );

        fireEvent.press(getByTestId('nav-bar'));
        expect(onNavigate).toHaveBeenCalledWith('routes');
    });

    it('renders without crashing in compact mode', () => {
        render(
            <ListPageShell {...baseProps} compact={true}>
                <Text>list-content</Text>
            </ListPageShell>
        );
        expect(mockNavigationBar).toHaveBeenCalledWith(expect.objectContaining({ compact: true }));
    });
});
