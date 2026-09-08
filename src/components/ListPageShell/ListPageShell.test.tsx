import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet, Text, View } from 'react-native';
import * as SafeAreaContext from 'react-native-safe-area-context';
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

    // App is landscape-locked, so the notch sits on left/right (whichever edge the current
    // rotation puts it on) and the home indicator sits at the bottom.
    it('pads the shell for the notch and home indicator on all four edges', () => {
        jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 5, left: 24, right: 0, bottom: 34 });

        const { UNSAFE_root } = render(
            <ListPageShell {...baseProps}>
                <Text>list-content</Text>
            </ListPageShell>
        );

        const container = UNSAFE_root.findAllByType(View).find((v: any) => {
            const flat = StyleSheet.flatten(v.props.style);
            return typeof flat?.paddingTop === 'number';
        });

        expect(container).toBeTruthy();
        const flat = StyleSheet.flatten(container!.props.style);
        expect(flat.paddingTop).toBe(5);
        expect(flat.paddingLeft).toBe(24);
        expect(flat.paddingRight).toBe(0);
        expect(flat.paddingBottom).toBe(34);

        jest.restoreAllMocks();
    });
});
