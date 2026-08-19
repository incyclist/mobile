import React from 'react';
import { render, act } from '@testing-library/react-native';
import { NavigationBar } from './NavigationBar';

jest.mock('incyclist-services', () => {
    const { EventEmitter } = require('events');

    class MockAppsService extends EventEmitter {
        connected: Record<string, boolean> = { strava: false, intervals: false, komoot: false };

        openSettings = jest.fn(() => ([
            { name: 'Strava', key: 'strava', iconUrl: 's.svg', isConnected: this.connected.strava },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: 'i.svg', isConnected: this.connected.intervals },
            { name: 'Komoot', key: 'komoot', iconUrl: 'k.svg', isConnected: this.connected.komoot },
        ]));
    }

    const mockAppsServiceInstance = new MockAppsService();

    return {
        useAppsService: () => mockAppsServiceInstance,
        __mockAppsServiceInstance: mockAppsServiceInstance,
    };
});

jest.mock('./NavigationBarView', () => ({ NavigationBarView: () => null }));
jest.mock('./NavigationBarViewCompact', () => ({ NavigationBarViewCompact: () => null }));
jest.mock('../UserSettings', () => ({ UserSettings: () => null }));
jest.mock('../SettingsSlideIn', () => ({ SettingsSlideIn: () => null }));
jest.mock('../SupportSettings', () => ({ SupportSettings: () => null }));
jest.mock('../SettingsPlaceholder', () => ({ SettingsPlaceholder: () => null }));
jest.mock('../GearSettings', () => ({ GearSettings: () => null }));
jest.mock('../RideSettings', () => ({ RideSettings: () => null }));

jest.mock('../AppsDialog', () => {
    const { Text } = require('react-native');
    return {
        AppsDialog: ({ apps }: { apps: unknown }) => <Text testID="apps-json">{JSON.stringify(apps)}</Text>,
    };
});

const getMockAppsService = () => {
    const { __mockAppsServiceInstance } = require('incyclist-services');
    return __mockAppsServiceInstance;
};

const readApps = (getByTestId: (id: string) => any) =>
    JSON.parse(String(getByTestId('apps-json').props.children));

describe('NavigationBar', () => {
    beforeEach(() => {
        const mockService = getMockAppsService();
        mockService.connected = { strava: false, intervals: false, komoot: false };
        mockService.openSettings.mockClear();
        mockService.removeAllListeners();
    });

    it('fetches apps on mount and subscribes to connected/disconnected events', () => {
        const mockService = getMockAppsService();
        const onSpy = jest.spyOn(mockService, 'on');

        render(<NavigationBar onClick={jest.fn()} />);

        expect(mockService.openSettings).toHaveBeenCalledTimes(1);
        expect(onSpy).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('disconnected', expect.any(Function));

        onSpy.mockRestore();
    });

    it('updates the apps state (and badge data) when the service emits "connected", without a remount', () => {
        const mockService = getMockAppsService();
        const { getByTestId } = render(<NavigationBar onClick={jest.fn()} />);

        expect(readApps(getByTestId).find((a: any) => a.key === 'strava').isConnected).toBe(false);

        act(() => {
            mockService.connected.strava = true;
            mockService.emit('connected', 'strava', true);
        });

        expect(readApps(getByTestId).find((a: any) => a.key === 'strava').isConnected).toBe(true);
    });

    it('updates the apps state (and badge data) when the service emits "disconnected", without a remount', () => {
        const mockService = getMockAppsService();
        mockService.connected.intervals = true;
        const { getByTestId } = render(<NavigationBar onClick={jest.fn()} />);

        expect(readApps(getByTestId).find((a: any) => a.key === 'intervals').isConnected).toBe(true);

        act(() => {
            mockService.connected.intervals = false;
            mockService.emit('disconnected', 'intervals');
        });

        expect(readApps(getByTestId).find((a: any) => a.key === 'intervals').isConnected).toBe(false);
    });

    it('unsubscribes from connected/disconnected events on unmount', () => {
        const mockService = getMockAppsService();
        const offSpy = jest.spyOn(mockService, 'off');

        const { unmount } = render(<NavigationBar onClick={jest.fn()} />);
        unmount();

        expect(offSpy).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(offSpy).toHaveBeenCalledWith('disconnected', expect.any(Function));
        expect(mockService.listenerCount('connected')).toBe(0);
        expect(mockService.listenerCount('disconnected')).toBe(0);

        offSpy.mockRestore();
    });
});
