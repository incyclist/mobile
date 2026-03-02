import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { EventEmitter } from 'events';
import { Dynamic } from './Dynamic';

// Mock Observer based on EventEmitter
class MockObserver extends EventEmitter {
    stop = fn();
}

const meta: Meta<typeof Dynamic> = {
    title: 'Components/Dynamic',
    component: Dynamic,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

const DynamicContent = ({ text, style }: any) => (
    <View style={[styles.contentContainer, style]}>
        <Text style={styles.contentText}>{text || 'Waiting for data...'}</Text>
    </View>
);

const Template = (args: any) => {
    const observerRef = useRef<MockObserver | null>(null);
    if (!observerRef.current) {
        observerRef.current = new MockObserver();
    }
    const observer = observerRef.current;

    useEffect(() => {
        let count = 0;
        const interval = setInterval(() => {
            count++;
            observer.emit('data', count);
        }, 1000);
        return () => clearInterval(interval);
    }, [observer]);

    return (
        <Dynamic {...args} observer={observer}>
            <DynamicContent />
        </Dynamic>
    );
};

export const EventAndProp: StoryObj<typeof Dynamic> = {
    render: (args) => <Template {...args} />,
    args: {
        event: 'data',
        prop: 'text',
    },
};

export const Mapping: StoryObj<typeof Dynamic> = {
    render: (args) => <Template {...args} />,
    args: {
        mapping: [{ event: 'data', prop: 'text' }],
    },
};

export const Transform: StoryObj<typeof Dynamic> = {
    render: (args) => <Template {...args} />,
    args: {
        event: 'data',
        prop: 'text',
        transform: (v: number) => `Count is: ${v}`,
    },
};

export const Hidden: StoryObj<typeof Dynamic> = {
    render: (args) => <Template {...args} />,
    args: {
        event: 'data',
        prop: 'text',
        hidden: true,
    },
};

const styles = StyleSheet.create({
    decorator: { 
        padding: 20, 
        flex: 1, 
        justifyContent: 'center' 
    },
    contentContainer: { 
        padding: 10, 
        backgroundColor: '#333', 
        borderRadius: 5 
    },
    contentText: { 
        color: '#fff' 
    },
});
