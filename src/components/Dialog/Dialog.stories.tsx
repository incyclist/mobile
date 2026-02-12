import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import {Dialog} from './Dialog';

const meta = {
    title: 'Components/Dialog',
    component: Dialog,
    // Initialize standard event handlers with fn() at the meta level
    args: {
        onOutsideClick: fn(),
    },
    decorators: [
        (Story) => (
            <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Story />
            </View>
        ),
    ],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    args: {
        visible: true,
        title: 'Basic Dialog',
        children: (
            <View>
                <Text  style={{ color:'white',fontSize:16}}>This is a standard dialog with simple content.</Text>
            </View>
        ),
    },
};

export const WithButtons: Story = {
    args: {
        visible: true,
        title: 'Save Changes?',
        buttons: [
            { 
                label: 'Cancel', 
                onClick: fn(), // Specifically spy on this button's action
            },
            { 
                label: 'Save', 
                onClick: fn(), 
                primary: true
            },
        ],
        children: (
            <View>
                <Text  style={{ color:'white',fontSize:16}}>Do you want to save the changes you made to your profile?</Text>
            </View>
        ),
    },
};

export const LongContent: Story = {
    args: {
        visible: true,
        title: 'Terms of Service',
        buttons: [{ label: 'I Agree', onClick: fn(), primary:true }],
        children: (
            <View>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Text key={i} style={{ color:'white',fontSize:16, marginBottom: 15 }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </Text>
                ))}
            </View>
        ),
    },
};

export const NoButtons: Story = {
    args: {
        visible: true,
        title: 'Information Only',
        children: (
            <View>
                <Text  style={{ color:'white',fontSize:16}}>The button bar is automatically hidden because the buttons prop is undefined.</Text>
            </View>
        ),
    },
};
