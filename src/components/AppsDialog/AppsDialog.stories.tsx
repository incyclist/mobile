import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppsDialog } from './AppsDialog';
import { Button } from '../ButtonBar/ButtonBar';
import { OperationsSelector } from '../OperationsSelector';
import type { OperationConfig } from '../OperationsSelector/types';

const MockAppContent = ({ appKey, isConnected }: { appKey: string; isConnected: boolean }) => {
    const ops = useMemo(() => {
        if (appKey === 'strava') {
            return [{ operation: 'ActivityUpload', enabled: true }];
        }
        if (appKey === 'intervals') {
            return [
                { operation: 'ActivityUpload', enabled: true },
                { operation: 'WorkoutDownload', enabled: true },
            ];
        }
        if (appKey === 'komoot') {
            return [{ operation: 'RouteDownload', enabled: true }];
        }
        return [];
    }, [appKey]) as OperationConfig[];

    return (
        <View style={styles.mockContent}>
            <View style={styles.buttonContainer}>
                {isConnected ? (
                    <Button 
                        label="Disconnect" 
                        onClick={fn()} 
                        attention 
                    />
                ) : (
                    <Button 
                        label={`Connect with ${appKey === 'intervals' ? 'Intervals.icu' : appKey.charAt(0).toUpperCase() + appKey.slice(1)}`} 
                        onClick={fn()} 
                    />
                )}
            </View>
            {isConnected && (
                <OperationsSelector 
                    operations={ops} 
                    onChanged={fn()} 
                />
            )}
        </View>
    );
};

const meta: Meta<typeof AppsDialog> = {
    title: 'Components/Settings/Apps',
    component: AppsDialog,
    args: {
        visible: true,
        onClose: fn(),
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: '', isConnected: true },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: '', isConnected: false },
            { name: 'Komoot', key: 'komoot', iconUrl: '', isConnected: false },
        ],
        renderApp: (key) => <MockAppContent appKey={key} isConnected={key === 'strava'} />,
    },
};

export default meta;

type Story = StoryObj<typeof AppsDialog>;

export const Default: Story = {};

export const AllDisconnected: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: '', isConnected: false },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: '', isConnected: false },
            { name: 'Komoot', key: 'komoot', iconUrl: '', isConnected: false },
        ],
        renderApp: (key) => <MockAppContent appKey={key} isConnected={false} />,
    },
};

export const AllConnected: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: '', isConnected: true },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: '', isConnected: true },
            { name: 'Komoot', key: 'komoot', iconUrl: '', isConnected: true },
        ],
        renderApp: (key) => <MockAppContent appKey={key} isConnected={true} />,
    },
};

export const StravaConnected: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: '', isConnected: true },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: '', isConnected: false },
            { name: 'Komoot', key: 'komoot', iconUrl: '', isConnected: false },
        ],
        renderApp: (key) => <MockAppContent appKey={key} isConnected={key === 'strava'} />,
    },
};

const styles = StyleSheet.create({
    mockContent: {
        padding: 10,
    },
    buttonContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
});