import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import {Dialog} from './Dialog';

const styles = StyleSheet.create({
    text: { color:'white',fontSize:16},
    longText: { color:'white',fontSize:16, marginBottom: 15 },
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }
})


const meta = {
    title: 'Components/Dialog',
    component: Dialog,
    // Initialize standard event handlers with fn() at the meta level
    args: {
        onOutsideClick: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.container}>
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
                <Text  style={styles.text}>This is a standard dialog with simple content.</Text>
            </View>
        ),
    },
};

export const TitleStyle: Story = {
    args: {
        visible: true,
        title: 'Basic Dialog',
        titleStyle: { color: 'red' },
        children: (
            <View>
                <Text  style={styles.text}>This is a standard dialog with simple content.</Text>
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
                <Text  style={styles.text}>Do you want to save the changes you made to your profile?</Text>
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
                    <Text key={i} style={styles.longText}>
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
                <Text  style={styles.text}>The button bar is automatically hidden because the buttons prop is undefined.</Text>
            </View>
        ),
    },
};

export const InfoVariant: Story = {
    args: {
        variant: 'info',
        visible: true,
        title: 'Information Dialog',
        children: (
            <View>
                <Text style={styles.text}>This is the info variant. It renders as a floating modal with a fade animation.</Text>
            </View>
        ),
    },
};

export const DetailsVariant: Story = {
    args: {
        variant: 'details',
        visible: true,
        title: 'Details Dialog',
        buttons: [{ label: 'Accept', onClick: fn(), primary: true }],
        children: (
            <View>
                <Text style={styles.text}>This is the details variant. It renders full-screen with a back navigation strip.</Text>
            </View>
        ),
    },
};