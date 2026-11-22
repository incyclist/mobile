import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AddComputerDialogView } from './AddComputerDialogView';
import * as mock from './AddComputerDialog.mock';

const meta: Meta<typeof AddComputerDialogView> = {
    title: 'Components/AddComputerDialog',
    component: AddComputerDialogView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            const frameStyle = { width, height };
            return (
                <View style={frameStyle}>
                    <Story />
                </View>
            );
        },
    ],
    args: {
        discovery: mock.SEARCHING,
        pairing: mock.IDLE_PAIRING,
        now: 0,
        compact: false,
        onCancel: fn(),
        onSearchAgain: fn(),
        onSelect: fn(),
        onSubmitCode: fn(),
        onRetry: fn(),
        onBack: fn(),
        onOpenIosSettings: fn(),
        onDone: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof AddComputerDialogView>;

export const Blocked: Story = { args: { discovery: mock.BLOCKED } };

export const Searching: Story = {};

export const SearchingWithResults: Story = { args: { discovery: mock.SEARCHING_WITH_RESULTS } };

export const PhoneSearchingWithResults: Story = { args: { discovery: mock.SEARCHING_WITH_RESULTS, compact: true } };

export const SameNameResults: Story = { args: { discovery: mock.DONE_WITH_RESULTS } };

export const NoneFound: Story = { args: { discovery: mock.NONE_FOUND } };

export const NoneFoundIos: Story = { args: { discovery: mock.NONE_FOUND_IOS } };

export const PhoneNoneFoundIos: Story = { args: { discovery: mock.NONE_FOUND_IOS, compact: true } };

export const NotReady: Story = { args: { pairing: mock.NOT_READY } };

export const CodeTablet: Story = { args: { pairing: mock.CODE } };

export const CodePhone: Story = { args: { pairing: mock.CODE, compact: true } };

export const CodeWrong: Story = { args: { pairing: mock.CODE_WRONG, compact: true } };

export const CodeInvalidated: Story = { args: { pairing: mock.failed('invalidated', 'get-new-code') } };

export const CodeExpired: Story = { args: { pairing: mock.failed('expired', 'get-new-code') } };

export const Denied: Story = { args: { pairing: mock.failed('denied', 'back') } };

export const Superseded: Story = { args: { pairing: mock.failed('superseded', 'try-again') } };

export const RateLimited: Story = { args: { pairing: mock.failed('rate-limited', 'try-again', 42_000) } };

export const ConnectionLost: Story = { args: { pairing: mock.failed('connection-lost', 'try-again') } };

export const VersionMismatch: Story = { args: { pairing: mock.failed('version-mismatch', 'back') } };

export const ConnectedAdding: Story = { args: { pairing: mock.CONNECTED, routeCount: 18, syncDone: false } };

export const ConnectedNothingShared: Story = { args: { pairing: mock.CONNECTED, routeCount: 0, syncDone: true } };

export const AlreadyConnected: Story = { args: { pairing: mock.ALREADY } };
