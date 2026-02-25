import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteImportDialogView } from './RouteImportDialogView';

const meta: Meta<typeof RouteImportDialogView> = {
    title: 'Components/RouteImportDialog',
    component: RouteImportDialogView,
    args: {
        onSelectFile: fn(),
        onClose: fn(),
    },
    decorators: [
        (Story) => (
            // Simulate the overlay for the modal
            <View style={storybookStyles.overlay}>
                <Story />
            </View>
        ),
    ],
    parameters: {
        // This ensures the content of the dialog is directly visible for screenshotting
        // and interaction within Storybook.
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {
    args: {
        phase: 'idle',
        imports: [],
    },
};

export const Importing: Story = {
    args: {
        phase: 'importing',
        imports: [
            { id: '1', status: 'parsing', fileName: 'FR_Col-de-Pennes.xml' },
        ],
    },
};

export const Error: Story = {
    args: {
        phase: 'done',
        imports: [
            { id: '1', status: 'error',
              fileName: 'FR_Col-de-Pennes.xml',
              error: 'GPX file not found' },
        ],
    },
};

export const MultipleImports: Story = {
    args: {
        phase: 'done',
        imports: [
            { id: '1', status: 'success', fileName: 'FR_Col-de-Pennes.xml' },
            { id: '2', status: 'error',
              fileName: 'FR_Another-Route.xml',
              error: 'Invalid XML format' },
        ],
    },
};

const storybookStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
