import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideBottomBarAndMenu } from './RideBottomBarAndMenu';

const mockElevationGraph = jest.fn();
const mockRideMenu = jest.fn();

jest.mock('../../../components', () => {
    const { Text, TouchableOpacity } = require('react-native');
    return {
        ElevationGraph: (props: any) => {
            mockElevationGraph(props);
            return <Text>elevation-graph</Text>;
        },
        RideMenu: (props: any) => {
            mockRideMenu(props);
            return <Text>ride-menu</Text>;
        },
        Button: ({ onClick, label }: any) => (
            <TouchableOpacity testID="menu-button" onPress={onClick}>
                <Text>{label}</Text>
            </TouchableOpacity>
        ),
    };
});

const baseProps = {
    bottomBarStyle: { flexDirection: 'row' as const },
    menuButtonContainerStyle: {},
    elevationFullStyle: {},
    routeData: { points: [] } as any,
    rideObserver: null,
    lapMode: false,
    onMenuOpen: jest.fn(),
    menuProps: null,
    onMenuClose: jest.fn(),
    onCloseRidePage: jest.fn(),
};

describe('RideBottomBarAndMenu', () => {
    beforeEach(() => jest.clearAllMocks());

    it('always renders the menu button and the full-route elevation graph', () => {
        const { getByText, getByTestId } = render(<RideBottomBarAndMenu {...baseProps} />);
        expect(getByTestId('menu-button')).toBeTruthy();
        expect(getByText('elevation-graph')).toBeTruthy();
        expect(mockElevationGraph).toHaveBeenCalledWith(
            expect.objectContaining({ showXAxis: false, showYAxis: false })
        );
    });

    it('calls onMenuOpen when the menu button is pressed', () => {
        const onMenuOpen = jest.fn();
        const { getByTestId } = render(<RideBottomBarAndMenu {...baseProps} onMenuOpen={onMenuOpen} />);
        fireEvent.press(getByTestId('menu-button'));
        expect(onMenuOpen).toHaveBeenCalledTimes(1);
    });

    it('does not render the RideMenu when menuProps is null', () => {
        const { queryByText } = render(<RideBottomBarAndMenu {...baseProps} menuProps={null} />);
        expect(queryByText('ride-menu')).toBeNull();
    });

    it('renders the RideMenu with the finished flag forwarded when menuProps is set', () => {
        const { getByText } = render(<RideBottomBarAndMenu {...baseProps} menuProps={{ finished: true }} />);
        expect(getByText('ride-menu')).toBeTruthy();
        expect(mockRideMenu).toHaveBeenCalledWith(expect.objectContaining({ visible: true, finished: true }));
    });
});
