import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { RideDashboardView } from './RideDashboardView';
import { ActivityDashboardItem } from './types';
import { MainBackground } from '../MainBackground';

const meta: Meta<typeof RideDashboardView> = {
    title: 'Components/RideDashboard/RideDashboard',
    component: RideDashboardView,
    decorators: [
        (Story) => (
            <>
                <View style={styles.background}>
                    <MainBackground>        
                        <View style={styles.overlay}>
                            <Story/>
                        </View>
                        
                    </MainBackground>
                </View>
            
            </>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof RideDashboardView>;

const items: ActivityDashboardItem[] = [
    { title: 'Time', data: [{ value: '0:10:01' }, { value: '-0:49:59' }] },
    { title: 'Distance', data: [{ value: '1.8', unit: 'km' }, { value: '-9.2' }] },
    { title: 'Speed', data: [{ value: '31.2', unit: 'km/h' }, { value: '55.0', label: 'max' }] },
    { title: 'Power', data: [{ value: '152', unit: 'W' }, { value: '170', label: 'avg' }] },
    { title: 'Slope', data: [{ value: '1.5', unit: '%' }, { value: '7', label: 'gain', unit: 'm' }] },
    { title: 'Heartrate', data: [{ value: '112', unit: 'bpm' }, { value: '99', label: 'avg' }] },
    { title: 'Cadence', data: [{ value: '82', unit: 'rpm' }, { value: '89', label: 'avg' }] },
    { title: 'Gear', data: [{ value: '10'}] },
];

export const IconTop: Story = {
    args: {
        items,
        layout: 'icon-top',
    },
};

export const IconLeft: Story = {
    args: {
        items,
        layout: 'icon-left',
    },
};

export const NoGear: Story = {
    args: {
        items: items.filter( i => i.title!=='Gear'),
        layout: 'icon-left',
    },
};

export const WithAmber: Story = {
    args: {
        layout: 'icon-top',
        items: items.map(item => 
            item.title === 'Heartrate' ? { ...item, dataState: 'amber' } : item
        ),
    },
};

export const WithRed: Story = {
    args: {
        layout: 'icon-top',
        items: items.map(item => 
            item.title === 'Heartrate' ? { ...item, dataState: 'red' } : item
        ),
    },
};

export const Compact: Story = {
    args: {
        items,
        layout: 'icon-top',
        compact: true,
    },
};


const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex:1
    },
    background: {
        zIndex:0,
        flex:1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        minWidth:'100%',
        minHeight:'100%'
    },

});
