import React  from 'react';
import { View } from 'react-native';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RoutesTable } from './RoutesTable';
import { MainBackground } from '../MainBackground';
import type { RouteItemProps } from 'incyclist-services';




const generateMockRoutes = (count: number):Array<Partial<RouteItemProps>> => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `route-${i}`,
        title: `Epic Route ${i + 1}`,
        country: i % 2 === 0 ? 'FR' : 'IT',
        totalDistance: { value: 10 + i, unit: 'km', display: `${10 + i} km` },
        totalElevation: { value: 100 + (i * 10), unit: 'm', display: `${100 + (i * 10)} m` },
        hasVideo: i % 3 === 0,
        isLoop: i % 4 === 0,
        isNew: i < 5,
        isDemo: i === 0,
        cntActive: i % 5,
        loaded: true,
        outsideFold: false,
    }));
};

const meta: Meta<typeof RoutesTable> = {
    title: 'Components/RoutesTable',
    component: RoutesTable,
    decorators: [
        (Story) => {
            
            return (
            <MainBackground>
                <View style={{ height: 600, width: '100%', }}>
                    <Story />
                </View>
            </MainBackground>
            )
        },
    ],
    args: {
        onSelect: fn(),
        onDelete: fn(),
    },
};

export default meta;

export const LargeTable: StoryObj<typeof RoutesTable> = {
    args: {
        routes: generateMockRoutes(1000) as Array<RouteItemProps>
    },
};